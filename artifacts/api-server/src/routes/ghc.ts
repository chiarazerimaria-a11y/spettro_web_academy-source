import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { adminGuard } from "../middleware/adminGuard";
import { sanitizeStr, safeInt } from "../middleware/sanitize";
import { creditGhc, getGhcBalance } from "../ghc";

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

export default router;
