import { Router } from "express";
import { randomBytes, createHash } from "node:crypto";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { adminGuard } from "../middleware/adminGuard";
import { sanitizeStr, safeInt } from "../middleware/sanitize";
import { getSessionUserId } from "../middleware/requireUser";

const router = Router();
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function newCode(): string {
  const b = randomBytes(16);
  let s = "";
  for (let i = 0; i < 16; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return "GIFT-" + (s.match(/.{4}/g) as string[]).join("-");
}
function normalize(code: string): string { return code.trim().toUpperCase().replace(/\s+/g, ""); }
function hashCode(code: string): string { return createHash("sha256").update(normalize(code)).digest("hex"); }

// Limite de intentos de canje: 10 cada 10 minutos por usuario
const attempts = new Map<number, { n: number; t: number }>();
function tooMany(userId: number): boolean {
  const now = Date.now();
  const a = attempts.get(userId);
  if (!a || now - a.t > 10 * 60 * 1000) { attempts.set(userId, { n: 1, t: now }); return false; }
  a.n += 1;
  return a.n > 10;
}

// POST /api/admin/gift/create — solo administracion. Los codigos en claro salen UNA vez.
router.post("/admin/gift/create", adminGuard, async (req, res) => {
  try {
    const raw = req.body as Record<string, unknown>;
    const amount = safeInt(raw.amount, 0, 1, 1_000_000);
    const count = safeInt(raw.count, 1, 1, 50);
    const note = sanitizeStr(raw.note, 100) || null;
    if (!amount) return res.status(400).json({ error: "Indica amount" });
    const codes: string[] = [];
    await db.transaction(async (tx) => {
      for (let i = 0; i < count; i++) {
        const code = newCode();
        await tx.execute(sql`INSERT INTO gift_codes (code_hash, amount, note) VALUES (${hashCode(code)}, ${amount}, ${note})`);
        codes.push(code);
      }
    });
    res.status(201).json({ ok: true, amount, count, codes });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/gift/redeem — el usuario sale de la cookie firmada
router.post("/gift/redeem", async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: "Inicia sesión de nuevo", code: "LOGIN_REQUIRED" });
    if (tooMany(userId)) return res.status(429).json({ error: "Demasiados intentos. Espera unos minutos." });
    const code = normalize(sanitizeStr((req.body as Record<string, unknown>).code, 60));
    if (!/^GIFT-[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/.test(code)) return res.status(400).json({ error: "Código inválido o ya usado" });
    const out = await db.transaction(async (tx) => {
      const r = await tx.execute(sql`
        UPDATE gift_codes SET redeemed_by = ${userId}, redeemed_at = now()
        WHERE code_hash = ${hashCode(code)} AND redeemed_at IS NULL RETURNING amount`);
      if (r.rows.length === 0) throw new Error("INVALID");
      const amount = Number((r.rows[0] as { amount: number }).amount);
      await tx.execute(sql`INSERT INTO spettro_wallets (user_id, balance, total_earned, total_spent) VALUES (${userId}, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING`);
      const w = await tx.execute(sql`UPDATE spettro_wallets SET gift_balance = gift_balance + ${amount}, updated_at = now() WHERE user_id = ${userId} RETURNING gift_balance`);
      await tx.execute(sql`INSERT INTO gift_transactions (user_id, amount, description) VALUES (${userId}, ${amount}, 'Canje de código de regalo')`);
      return { amount, balance: Number((w.rows[0] as { gift_balance: number }).gift_balance) };
    });
    res.json({ ok: true, ...out });
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID") return res.status(400).json({ error: "Código inválido o ya usado" });
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/gift/me — solo el saldo y el historial de quien tiene sesion
router.get("/gift/me", async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: "Sin sesión" });
    const b = await db.execute(sql`SELECT gift_balance FROM spettro_wallets WHERE user_id = ${userId}`);
    const t = await db.execute(sql`SELECT id, amount, description, created_at AS "createdAt" FROM gift_transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 50`);
    res.json({ balance: Number((b.rows[0] as { gift_balance?: number } | undefined)?.gift_balance ?? 0), transactions: t.rows });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
