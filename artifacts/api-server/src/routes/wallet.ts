import { Router } from "express";
import { db } from "@workspace/db";
import { spettroWalletsTable, spettroTransactionsTable, usersTable } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { sanitizeStr, safeInt, internalKeyGuard } from "../middleware/sanitize";

const router = Router();

async function getOrCreateWallet(userId: number) {
  try { await db.execute(sql`SELECT wallet_liquidate(${userId})`); } catch {}
  const [existing] = await db.select().from(spettroWalletsTable).where(eq(spettroWalletsTable.userId, userId));
  if (existing) return existing;
  const [created] = await db.insert(spettroWalletsTable).values({ userId, balance: 100, totalEarned: 100 }).returning();
  await db.insert(spettroTransactionsTable).values({
    userId, amount: 100, type: "bonus", description: "Bienvenida SpettroWeb - 100 creditos free",
  });
  try { await db.execute(sql`UPDATE spettro_wallets SET balance_free = 100 WHERE user_id = ${userId}`); } catch {}
  return created;
}

// GET /api/wallet/leaderboard — top 10 richest users (must be BEFORE /:userId)
router.get("/wallet/leaderboard", async (req, res) => {
  try {
    const wallets = await db.select().from(spettroWalletsTable)
      .orderBy(desc(spettroWalletsTable.totalEarned))
      .limit(10);
    const result = await Promise.all(wallets.map(async (w) => {
      const [u] = await db.select({ username: usersTable.username, rank: usersTable.rank })
        .from(usersTable).where(eq(usersTable.id, w.userId));
      return { ...w, username: u?.username ?? "Hacker", rank: u?.rank ?? "Rookie" };
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// GET /api/wallet/:userId
router.get("/wallet/:userId", async (req, res) => {
  try {
    const userId = safeInt(req.params.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(400).json({ error: "userId inválido" });
    const wallet = await getOrCreateWallet(userId);
    const txs = await db.select().from(spettroTransactionsTable)
      .where(eq(spettroTransactionsTable.userId, userId))
      .orderBy(desc(spettroTransactionsTable.createdAt))
      .limit(50);
    res.json({ wallet, transactions: txs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error fetching wallet" });
  }
});

// POST /api/wallet/reward — INTERNAL ONLY: credit SPC to a user
router.post("/wallet/reward", internalKeyGuard, async (req, res) => {
  try {
    const raw = req.body as Record<string, unknown>;
    const userId      = safeInt(raw.userId, 0, 1, 1_000_000);
    const amount      = safeInt(raw.amount, 0, -500_000, 500_000);
    const description = sanitizeStr(raw.description, 200);
    const type        = sanitizeStr(raw.type, 30) || (amount > 0 ? "earned" : "spent");
    const referenceId = sanitizeStr(raw.referenceId, 100) || null;

    if (!userId || amount === 0 || !description) {
      return res.status(400).json({ error: "userId, amount, description requeridos" });
    }

    const wallet = await getOrCreateWallet(userId);
    const newBalance = wallet.balance + amount;
    const newEarned  = wallet.totalEarned + (amount > 0 ? amount : 0);
    const newSpent   = wallet.totalSpent  + (amount < 0 ? Math.abs(amount) : 0);

    const [updated] = await db.update(spettroWalletsTable).set({
      balance: newBalance, totalEarned: newEarned, totalSpent: newSpent, updatedAt: new Date(),
    }).where(eq(spettroWalletsTable.userId, userId)).returning();

    const [tx] = await db.insert(spettroTransactionsTable).values({
      userId, amount, type, description, referenceId,
    }).returning();

    res.json({ wallet: updated, transaction: tx });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error rewarding wallet" });
  }
});

// POST /api/wallet/squad-reward — INTERNAL ONLY
router.post("/wallet/squad-reward", internalKeyGuard, async (req, res) => {
  try {
    const raw = req.body as Record<string, unknown>;
    const squadName  = sanitizeStr(raw.squadName, 80);
    const amount     = safeInt(raw.amount, 0, 1, 500_000);
    const description = sanitizeStr(raw.description, 200);
    if (!squadName || !amount) return res.status(400).json({ error: "Faltan datos" });
    res.json({ ok: true, squadName, amount, description, note: "Recompensa registrada para la escuadra" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

export default router;
