import { Router } from "express";
import { db } from "@workspace/db";
import {
  spettroWalletsTable, spettroTransactionsTable,
  usersTable, spcTransfersTable, roomBetsTable,
} from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { sanitizeStr, sanitizeOptional, safeInt, rateLimit } from "../middleware/sanitize";

const router = Router();

// Rate limits
const transferLimit = rateLimit(20, 60_000);
const betLimit      = rateLimit(30, 60_000);

// ── helpers ──────────────────────────────────────────────────────────────────
async function getOrCreate(userId: number) {
  const [w] = await db.select().from(spettroWalletsTable).where(eq(spettroWalletsTable.userId, userId));
  if (w) return w;
  const [c] = await db.insert(spettroWalletsTable).values({ userId, balance: 50, totalEarned: 50 }).returning();
  await db.insert(spettroTransactionsTable).values({ userId, amount: 50, type: "bonus", description: "Bienvenida — bonus de registro" });
  return c;
}

async function debit(userId: number, amount: number, description: string, type = "spent", refId?: string) {
  const w = await getOrCreate(userId);
  if (w.balance < amount) throw new Error("Saldo insuficiente");
  const [upd] = await db.update(spettroWalletsTable).set({
    balance: w.balance - amount, totalSpent: w.totalSpent + amount, updatedAt: new Date(),
  }).where(eq(spettroWalletsTable.userId, userId)).returning();
  await db.insert(spettroTransactionsTable).values({ userId, amount: -amount, type, description, referenceId: refId ?? null });
  return upd;
}

async function credit(userId: number, amount: number, description: string, type = "earned", refId?: string) {
  const w = await getOrCreate(userId);
  const [upd] = await db.update(spettroWalletsTable).set({
    balance: w.balance + amount, totalEarned: w.totalEarned + amount, updatedAt: new Date(),
  }).where(eq(spettroWalletsTable.userId, userId)).returning();
  await db.insert(spettroTransactionsTable).values({ userId, amount, type, description, referenceId: refId ?? null });
  return upd;
}

// ── P2P Transfer ─────────────────────────────────────────────────────────────
router.post("/spc/transfer", transferLimit, async (req, res) => {
  const raw        = req.body as Record<string, unknown>;
  const fromUserId = safeInt(raw.fromUserId, 0, 1, 1_000_000);
  const toUsername = sanitizeStr(raw.toUsername, 30);
  const amount     = safeInt(raw.amount, 0, 1, 50_000);
  const note       = sanitizeOptional(raw.note, 200);
  const roomId     = safeInt(raw.roomId, 0, 0, 1_000_000) || undefined;

  if (!fromUserId || !toUsername || !amount) {
    res.status(400).json({ error: "Faltan campos requeridos" }); return;
  }

  try {
    const [toUser] = await db.select({ id: usersTable.id, username: usersTable.username })
      .from(usersTable).where(eq(usersTable.username, toUsername)).limit(1);
    if (!toUser) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
    if (toUser.id === fromUserId) { res.status(400).json({ error: "No puedes enviarte SPC a ti mismo" }); return; }

    const [fromUser] = await db.select({ username: usersTable.username })
      .from(usersTable).where(eq(usersTable.id, fromUserId)).limit(1);
    if (!fromUser) { res.status(403).json({ error: "Usuario origen no encontrado" }); return; }

    await debit(fromUserId, amount, `→ ${toUser.username}${note ? `: ${note}` : ""}`, "transfer");
    await credit(toUser.id, amount, `← ${fromUser.username}${note ? `: ${note}` : ""}`, "transfer");

    await db.insert(spcTransfersTable).values({
      fromUserId, toUserId: toUser.id, amount, note: note ?? null, roomId: roomId ?? null,
    });

    res.json({ ok: true, to: toUser.username, amount });
  } catch (err: unknown) {
    req.log.error(err);
    res.status(400).json({ error: (err as Error).message ?? "Error al transferir" });
  }
});

// ── SPC Packs ─────────────────────────────────────────────────────────────────
const PACKS = [
  { id: "starter", label: "STARTER", spc: 1000,  eurCents: 100,  bonus: 0 },
  { id: "hacker",  label: "HACKER",  spc: 5000,  eurCents: 450,  bonus: 500 },
  { id: "elite",   label: "ELITE",   spc: 12000, eurCents: 1000, bonus: 2000 },
  { id: "master",  label: "MASTER",  spc: 30000, eurCents: 2000, bonus: 6000 },
] as const;
type PackId = typeof PACKS[number]["id"];
const VALID_PACK_IDS = new Set<PackId>(PACKS.map(p => p.id));

router.get("/spc/packs", (_req, res) => {
  res.json(PACKS);
});

router.post("/spc/purchase", async (req, res) => {
  const raw    = req.body as Record<string, unknown>;
  const userId = safeInt(raw.userId, 0, 1, 1_000_000);
  const packId = sanitizeStr(raw.packId, 20) as PackId;
  if (!userId || !packId) { res.status(400).json({ error: "Faltan campos" }); return; }
  if (!VALID_PACK_IDS.has(packId)) { res.status(400).json({ error: "Pack no válido" }); return; }
  const pack  = PACKS.find(p => p.id === packId)!;
  try {
    const total  = pack.spc + pack.bonus;
    const wallet = await credit(userId, total,
      `Pack ${pack.label}: ${pack.spc.toLocaleString()} SPC${pack.bonus > 0 ? ` + ${pack.bonus} bonus` : ""}`,
      "purchase"
    );
    res.json({ ok: true, pack, total, wallet });
  } catch (err: unknown) {
    req.log.error(err);
    res.status(500).json({ error: (err as Error).message ?? "Error al procesar compra" });
  }
});

// ── Room Bets ─────────────────────────────────────────────────────────────────
router.get("/spc/bets/:roomId", async (req, res) => {
  const roomId = safeInt(req.params.roomId, 0, 1);
  if (!roomId) { res.status(400).json({ error: "roomId inválido" }); return; }
  try {
    const bets = await db.select().from(roomBetsTable)
      .where(eq(roomBetsTable.roomId, roomId))
      .orderBy(desc(roomBetsTable.createdAt))
      .limit(50);
    res.json(bets);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

router.post("/spc/bets/:roomId", betLimit, async (req, res) => {
  const roomId = safeInt(req.params.roomId, 0, 1);
  if (!roomId) { res.status(400).json({ error: "roomId inválido" }); return; }
  const raw             = req.body as Record<string, unknown>;
  const creatorId       = safeInt(raw.creatorId, 0, 1, 1_000_000);
  const creatorUsername = sanitizeStr(raw.creatorUsername, 50);
  const prediction      = sanitizeStr(raw.prediction, 200);
  const isFree          = raw.isFree === true;
  const betAmount       = isFree ? 0 : safeInt(raw.amount, 0, 0, 100_000);

  if (!creatorId || !creatorUsername || !prediction) {
    res.status(400).json({ error: "Faltan campos" }); return;
  }
  if (!isFree && betAmount < 10) {
    res.status(400).json({ error: "Apuesta mínima: 10 SPC" }); return;
  }
  try {
    if (!isFree && betAmount > 0) {
      await debit(creatorId, betAmount, `Apuesta en sala #${roomId}: "${prediction}"`, "bet");
    }
    const [bet] = await db.insert(roomBetsTable).values({
      roomId, creatorId, creatorUsername, amount: betAmount, prediction, isFree,
    }).returning();
    res.json(bet);
  } catch (err: unknown) {
    req.log.error(err);
    res.status(400).json({ error: (err as Error).message ?? "Error al crear apuesta" });
  }
});

router.post("/spc/bets/:betId/accept", betLimit, async (req, res) => {
  const betId = safeInt(req.params.betId, 0, 1);
  if (!betId) { res.status(400).json({ error: "betId inválido" }); return; }
  const raw             = req.body as Record<string, unknown>;
  const acceptorId      = safeInt(raw.acceptorId, 0, 1, 1_000_000);
  const acceptorUsername = sanitizeStr(raw.acceptorUsername, 50);
  if (!acceptorId || !acceptorUsername) { res.status(400).json({ error: "Faltan campos" }); return; }
  try {
    const [bet] = await db.select().from(roomBetsTable).where(eq(roomBetsTable.id, betId));
    if (!bet) { res.status(404).json({ error: "Apuesta no encontrada" }); return; }
    if (bet.status !== "abierta") { res.status(400).json({ error: "Esta apuesta ya no está abierta" }); return; }
    if (bet.creatorId === acceptorId) { res.status(400).json({ error: "No puedes aceptar tu propia apuesta" }); return; }

    if (!bet.isFree && bet.amount > 0) {
      await debit(acceptorId, bet.amount, `Apuesta aceptada: "${bet.prediction}"`, "bet");
    }
    const [updated] = await db.update(roomBetsTable).set({
      acceptorId, acceptorUsername, status: "aceptada",
    }).where(eq(roomBetsTable.id, betId)).returning();
    res.json(updated);
  } catch (err: unknown) {
    req.log.error(err);
    res.status(400).json({ error: (err as Error).message ?? "Error al aceptar apuesta" });
  }
});

router.post("/spc/bets/:betId/resolve", async (req, res) => {
  const betId = safeInt(req.params.betId, 0, 1);
  if (!betId) { res.status(400).json({ error: "betId inválido" }); return; }
  const raw      = req.body as Record<string, unknown>;
  const winnerId = safeInt(raw.winnerId, 0, 1, 1_000_000);
  if (!winnerId) { res.status(400).json({ error: "Falta winnerId" }); return; }
  try {
    const [bet] = await db.select().from(roomBetsTable).where(eq(roomBetsTable.id, betId));
    if (!bet) { res.status(404).json({ error: "No encontrada" }); return; }
    if (bet.status !== "aceptada") { res.status(400).json({ error: "La apuesta debe estar aceptada primero" }); return; }
    if (winnerId !== bet.creatorId && winnerId !== bet.acceptorId) {
      res.status(400).json({ error: "El ganador debe ser uno de los participantes" }); return;
    }
    if (!bet.isFree && bet.amount > 0) {
      await credit(winnerId, bet.amount * 2, `Victoria apuesta #${betId}: "${bet.prediction}"`, "tournament");
    }
    const [updated] = await db.update(roomBetsTable).set({
      status: "resuelta", winnerId, resolvedAt: new Date(),
    }).where(eq(roomBetsTable.id, betId)).returning();
    res.json(updated);
  } catch (err: unknown) {
    req.log.error(err);
    res.status(500).json({ error: (err as Error).message ?? "Error al resolver" });
  }
});

router.post("/spc/bets/:betId/cancel", async (req, res) => {
  const betId = safeInt(req.params.betId, 0, 1);
  if (!betId) { res.status(400).json({ error: "betId inválido" }); return; }
  const raw    = req.body as Record<string, unknown>;
  const userId = safeInt(raw.userId, 0, 1, 1_000_000);
  try {
    const [bet] = await db.select().from(roomBetsTable).where(eq(roomBetsTable.id, betId));
    if (!bet) { res.status(404).json({ error: "No encontrada" }); return; }
    if (bet.creatorId !== userId) { res.status(403).json({ error: "Solo el creador puede cancelar" }); return; }
    if (bet.status !== "abierta") { res.status(400).json({ error: "Solo se pueden cancelar apuestas abiertas" }); return; }
    if (!bet.isFree && bet.amount > 0) {
      await credit(userId, bet.amount, `Apuesta #${betId} cancelada — reembolso`, "bonus");
    }
    const [updated] = await db.update(roomBetsTable).set({ status: "cancelada" })
      .where(eq(roomBetsTable.id, betId)).returning();
    res.json(updated);
  } catch (err: unknown) {
    req.log.error(err);
    res.status(400).json({ error: (err as Error).message ?? "Error" });
  }
});

export default router;
