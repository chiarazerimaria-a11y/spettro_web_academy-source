import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { adminGuard } from "../middleware/adminGuard";
import { sanitizeStr, sanitizeOptional, safeInt, rateLimit } from "../middleware/sanitize";
import { getSessionUserId } from "../middleware/requireUser";
import { creditGhc, getGhcBalance, transferGhc } from "../ghc";

const router = Router();

// GET /api/ghc/:userId — saldo y últimos movimientos de GhostCoin
router.get("/ghc/:userId", async (req, res) => {
  try {
    const userId = safeInt(req.params.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(400).json({ error: "userId inválido" });
    const balance = await getGhcBalance(userId);
    const r = await db.execute(sql`
      SELECT id, amount, description, created_at AS "createdAt"
      FROM ghc_transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 50
    `);
    res.json({ balance, transactions: r.rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al leer GhostCoin" });
  }
});

// POST /api/admin/ghc/grant — solo administración: regala GhostCoin a un usuario
router.post("/admin/ghc/grant", adminGuard, async (req, res) => {
  try {
    const raw = req.body as Record<string, unknown>;
    const amount = safeInt(raw.amount, 0, 1, 100_000_000);
    const description = sanitizeStr(raw.description, 200) || "Regalo de la administración";
    let userId = safeInt(raw.userId, 0, 1, 1_000_000);
    if (!userId) {
      const username = sanitizeStr(raw.username, 30);
      if (username) {
        const [u] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username)).limit(1);
        userId = u?.id ?? 0;
      }
    }
    if (!userId || !amount) return res.status(400).json({ error: "Indica userId (o username) y amount" });
    const [exists] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!exists) return res.status(404).json({ error: "Usuario no encontrado" });
    const balance = await creditGhc(userId, amount, description);
    res.json({ ok: true, userId, granted: amount, balance });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al regalar GhostCoin" });
  }
});

const ghcTransferLimit = rateLimit(20, 60_000);

// POST /api/ghc/transfer — el remitente sale de la cookie firmada, nunca del body
router.post("/ghc/transfer", ghcTransferLimit, async (req, res) => {
  try {
    const fromId = getSessionUserId(req);
    if (!fromId) return res.status(401).json({ error: "Inicia sesión de nuevo" });
    const raw = req.body as Record<string, unknown>;
    const toUsername = sanitizeStr(raw.toUsername, 30);
    const amount = safeInt(raw.amount, 0, 1, 10000);
    const note = sanitizeOptional(raw.note, 200);
    if (!toUsername || !amount) return res.status(400).json({ error: "Faltan campos requeridos" });

    const [toUser] = await db.select({ id: usersTable.id, username: usersTable.username })
      .from(usersTable).where(eq(usersTable.username, toUsername)).limit(1);
    if (!toUser) return res.status(404).json({ error: "Usuario no encontrado" });
    if (toUser.id === fromId) return res.status(400).json({ error: "No puedes enviarte GHC a ti mismo" });
    const [fromUser] = await db.select({ username: usersTable.username })
      .from(usersTable).where(eq(usersTable.id, fromId)).limit(1);
    if (!fromUser) return res.status(401).json({ error: "Sesión inválida" });

    const balance = await transferGhc(fromId, toUser.id, amount, fromUser.username, toUser.username, note ?? undefined);
    res.json({ ok: true, to: toUser.username, amount, balance });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: (err as Error).message ?? "Error al transferir" });
  }
});

export default router;
