import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getSessionUserId } from "../middleware/requireUser";
import { rateLimit } from "../middleware/sanitize";

const router = Router();
const reqLimit = rateLimit(10, 60_000);

// Debe coincidir con PACKS de spc.ts.
const PACKS = {
  starter: { label: "STARTER", spc: 1000, eurCents: 100, bonus: 0 },
  hacker: { label: "HACKER", spc: 5000, eurCents: 450, bonus: 500 },
  elite: { label: "ELITE", spc: 12000, eurCents: 1000, bonus: 2000 },
  master: { label: "MASTER", spc: 30000, eurCents: 2000, bonus: 6000 },
} as const;
type PackId = keyof typeof PACKS;
const METHODS = new Set(["card", "paypal", "bizum", "applepay", "googlepay", "transfer"]);

type Row = Record<string, unknown>;
const rowsOf = (r: unknown): Row[] => (r as { rows?: Row[] }).rows ?? [];
const ref = (id: unknown) => "SPC-" + String(id);

function instructions(): string {
  const info = (process.env["PAY_INFO"] ?? "").trim().slice(0, 300);
  return info || "El administrador te enviará los datos de pago.";
}

(async () => {
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS spc_purchase_requests (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      pack_id text NOT NULL,
      spc_total integer NOT NULL,
      eur_cents integer NOT NULL,
      method text NOT NULL DEFAULT 'transfer',
      status text NOT NULL DEFAULT 'pendiente',
      created_at timestamptz NOT NULL DEFAULT now(),
      processed_at timestamptz
    )`);
  } catch (e) {
    console.error("[spcRequests] ensure table fallo:", e);
  }
})();

// ── Usuario: pedir un pack (sesion firmada) ──────────────────────────────────
router.post("/spc/purchase-request", reqLimit, async (req, res) => {
  const uid = getSessionUserId(req);
  if (!uid) { res.status(401).json({ error: "Inicia sesión de nuevo" }); return; }
  const b = (req.body ?? {}) as Record<string, unknown>;
  const packId = String(b.packId ?? "");
  if (!Object.prototype.hasOwnProperty.call(PACKS, packId)) { res.status(400).json({ error: "Pack no válido" }); return; }
  const method = METHODS.has(String(b.method ?? "")) ? String(b.method) : "transfer";
  const pack = PACKS[packId as PackId];
  const total = pack.spc + pack.bonus;

  try {
    const pend = rowsOf(await db.execute(sql`SELECT id, pack_id FROM spc_purchase_requests WHERE user_id = ${uid} AND status = 'pendiente'`));
    const same = pend.find((p) => p.pack_id === packId);
    if (same) { res.json({ ok: true, reference: ref(same.id), instructions: instructions(), already: true }); return; }
    if (pend.length >= 5) { res.status(429).json({ error: "Ya tienes 5 solicitudes pendientes" }); return; }

    const ins = rowsOf(await db.execute(sql`INSERT INTO spc_purchase_requests (user_id, pack_id, spc_total, eur_cents, method)
      VALUES (${uid}, ${packId}, ${total}, ${pack.eurCents}, ${method}) RETURNING id`));
    res.status(201).json({ ok: true, reference: ref(ins[0]?.id), instructions: instructions(), already: false });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

router.get("/spc/purchase-requests/mine", async (req, res) => {
  const uid = getSessionUserId(req);
  if (!uid) { res.status(401).json({ error: "Inicia sesión de nuevo" }); return; }
  try {
    const rows = rowsOf(await db.execute(sql`SELECT id, pack_id, spc_total, eur_cents, status, created_at
      FROM spc_purchase_requests WHERE user_id = ${uid} ORDER BY id DESC LIMIT 20`));
    res.json(rows.map((r) => ({ reference: ref(r.id), packId: r.pack_id, spc: Number(r.spc_total), eurCents: Number(r.eur_cents), status: r.status, createdAt: r.created_at })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

// ── Admin (ya protegido por adminGuard en /admin) ────────────────────────────
router.get("/admin/spc-requests", async (req, res) => {
  try {
    const rows = rowsOf(await db.execute(sql`SELECT r.id, r.user_id, r.pack_id, r.spc_total, r.eur_cents, r.method, r.status, r.created_at, u.username, u.email
      FROM spc_purchase_requests r LEFT JOIN users u ON u.id = r.user_id
      ORDER BY (r.status = 'pendiente') DESC, r.id DESC LIMIT 200`));
    res.json(rows.map((r) => ({
      id: Number(r.id), reference: ref(r.id), userId: Number(r.user_id), username: r.username ?? "?", email: r.email ?? "",
      packId: r.pack_id, spc: Number(r.spc_total), eurCents: Number(r.eur_cents), method: r.method, status: r.status, createdAt: r.created_at,
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/admin/spc-requests/:id/approve", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "id inválido" }); return; }
  try {
    let done = false;
    await db.transaction(async (tx) => {
      const c = rowsOf(await tx.execute(sql`UPDATE spc_purchase_requests SET status = 'acreditada', processed_at = now()
        WHERE id = ${id} AND status = 'pendiente' RETURNING user_id, pack_id, spc_total`));
      if (c.length === 0) return;
      const uid = Number(c[0].user_id);
      const n = Number(c[0].spc_total);
      const label = PACKS[String(c[0].pack_id) as PackId]?.label ?? String(c[0].pack_id);
      const upd = rowsOf(await tx.execute(sql`UPDATE spettro_wallets SET balance = balance + ${n}, total_earned = total_earned + ${n}, updated_at = now()
        WHERE user_id = ${uid} RETURNING id`));
      if (upd.length === 0) {
        await tx.execute(sql`INSERT INTO spettro_wallets (user_id, balance, total_earned) VALUES (${uid}, ${n}, ${n})`);
      }
      await tx.execute(sql`INSERT INTO spettro_transactions (user_id, amount, type, description, reference_id)
        VALUES (${uid}, ${n}, 'purchase', ${"Pack " + label + " (" + ref(id) + ")"}, ${"req_" + id})`);
      done = true;
    });
    if (!done) { res.status(409).json({ error: "La solicitud ya no está pendiente" }); return; }
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/admin/spc-requests/:id/reject", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "id inválido" }); return; }
  try {
    const r = rowsOf(await db.execute(sql`UPDATE spc_purchase_requests SET status = 'rechazada', processed_at = now()
      WHERE id = ${id} AND status = 'pendiente' RETURNING id`));
    if (r.length === 0) { res.status(409).json({ error: "La solicitud ya no está pendiente" }); return; }
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
