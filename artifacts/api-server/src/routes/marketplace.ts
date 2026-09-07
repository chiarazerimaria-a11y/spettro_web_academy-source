import { Router } from "express";
import { db } from "@workspace/db";
import {
  marketplaceProductsTable, marketplaceOrdersTable,
  spettroWalletsTable, spettroTransactionsTable,
  tutoringSessionsTable, payoutRequestsTable, usersTable,
} from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  sanitizeStr, sanitizeOptional, safeInt, safeFloat,
  ALLOWED_CATEGORIES, ALLOWED_PAYOUT_METHODS, internalKeyGuard,
} from "../middleware/sanitize";
import { DOWNLOADS } from "../downloads";

const router = Router();

// ── helpers ──────────────────────────────────────────────────────────────────
async function getOrCreateWallet(userId: number) {
  const [w] = await db.select().from(spettroWalletsTable).where(eq(spettroWalletsTable.userId, userId));
  if (w) return w;
  const [c] = await db.insert(spettroWalletsTable).values({ userId, balance: 50, totalEarned: 50 }).returning();
  return c;
}
async function debit(userId: number, amount: number, description: string, type = "spent") {
  const w = await getOrCreateWallet(userId);
  if (w.balance < amount) throw new Error("Saldo SPC insuficiente");
  const [u] = await db.update(spettroWalletsTable).set({
    balance: w.balance - amount, totalSpent: w.totalSpent + amount, updatedAt: new Date(),
  }).where(eq(spettroWalletsTable.userId, userId)).returning();
  await db.insert(spettroTransactionsTable).values({ userId, amount: -amount, type, description });
  return u;
}
async function credit(userId: number, amount: number, description: string, type = "earned") {
  const w = await getOrCreateWallet(userId);
  const [u] = await db.update(spettroWalletsTable).set({
    balance: w.balance + amount, totalEarned: w.totalEarned + amount, updatedAt: new Date(),
  }).where(eq(spettroWalletsTable.userId, userId)).returning();
  await db.insert(spettroTransactionsTable).values({ userId, amount, type, description });
  return u;
}

// ═══════════════════════════════════════════════════════════
// MARKETPLACE
// ═══════════════════════════════════════════════════════════

// GET /api/marketplace/download/:slug — serve real file (no auth: URL is the key)
router.get("/marketplace/download/:slug", (req, res) => {
  const slug = req.params.slug;
  const file = DOWNLOADS[slug];
  if (!file) return res.status(404).json({ error: "Archivo no encontrado" });
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(file.content);
});

// GET /api/marketplace/products
router.get("/marketplace/products", async (req, res) => {
  try {
    const category = sanitizeStr(req.query.category, 30);
    const sellerIdRaw = safeInt(req.query.sellerId, 0, 0, 1_000_000);

    let products = await db.select().from(marketplaceProductsTable)
      .where(eq(marketplaceProductsTable.isActive, true))
      .orderBy(desc(marketplaceProductsTable.salesCount));

    if (category && category !== "all") products = products.filter(p => p.category === category);
    if (sellerIdRaw > 0) products = products.filter(p => p.sellerId === sellerIdRaw);
    res.json(products);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// GET /api/marketplace/products/:id
router.get("/marketplace/products/:id", async (req, res) => {
  try {
    const id = safeInt(req.params.id, 0, 1);
    if (!id) return res.status(400).json({ error: "ID inválido" });
    const [p] = await db.select().from(marketplaceProductsTable).where(eq(marketplaceProductsTable.id, id));
    if (!p) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(p);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// POST /api/marketplace/products — create listing
router.post("/marketplace/products", async (req, res) => {
  const raw = req.body as Record<string, unknown>;
  const sellerId       = safeInt(raw.sellerId, 0, 1, 1_000_000);
  const sellerUsername = sanitizeStr(raw.sellerUsername, 30);
  const title          = sanitizeStr(raw.title, 100);
  const description    = sanitizeStr(raw.description, 2000);
  const category       = sanitizeStr(raw.category, 30) || "writeup";
  const price          = safeInt(raw.price, 0, 1, 100_000);
  const downloadUrl    = sanitizeOptional(raw.downloadUrl, 500);
  const thumbnailUrl   = sanitizeOptional(raw.thumbnailUrl, 500);
  const previewText    = sanitizeOptional(raw.previewText, 1000);
  const tags           = Array.isArray(raw.tags)
    ? (raw.tags as unknown[]).slice(0, 10).map(t => sanitizeStr(t, 30)).filter(Boolean)
    : [];

  if (!sellerId || !sellerUsername || !title || !price) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }
  if (!ALLOWED_CATEGORIES.has(category)) {
    return res.status(400).json({ error: "Categoría inválida" });
  }

  // Verify seller exists
  try {
    const [seller] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, sellerId)).limit(1);
    if (!seller) return res.status(403).json({ error: "Vendedor no encontrado" });

    const [p] = await db.insert(marketplaceProductsTable).values({
      sellerId, sellerUsername, title, description, category, price, downloadUrl, thumbnailUrl, previewText, tags,
    }).returning();
    res.status(201).json(p);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error al crear" }); }
});

// POST /api/marketplace/products/:id/buy
router.post("/marketplace/products/:id/buy", async (req, res) => {
  const productId = safeInt(req.params.id, 0, 1);
  if (!productId) return res.status(400).json({ error: "ID inválido" });

  const raw            = req.body as Record<string, unknown>;
  const buyerId        = safeInt(raw.buyerId, 0, 1, 1_000_000);
  const buyerUsername  = sanitizeStr(raw.buyerUsername, 30);
  if (!buyerId || !buyerUsername) return res.status(400).json({ error: "Faltan campos" });

  try {
    const [product] = await db.select().from(marketplaceProductsTable).where(eq(marketplaceProductsTable.id, productId));
    if (!product || !product.isActive) return res.status(404).json({ error: "Producto no encontrado" });
    if (product.sellerId === buyerId) return res.status(400).json({ error: "No puedes comprar tu propio producto" });

    // Verify buyer exists
    const [buyer] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, buyerId)).limit(1);
    if (!buyer) return res.status(403).json({ error: "Comprador no encontrado" });

    const [existing] = await db.select().from(marketplaceOrdersTable)
      .where(and(eq(marketplaceOrdersTable.productId, productId), eq(marketplaceOrdersTable.buyerId, buyerId)));
    if (existing) return res.status(400).json({ error: "Ya compraste este producto", order: existing });

    const fee        = Math.floor(product.price * 0.1);
    const sellerEarns = product.price - fee;
    await debit(buyerId, product.price, `Compra: "${product.title}"`, "spent");
    await credit(product.sellerId, sellerEarns, `Venta: "${product.title}" (comisión 10% deducida)`, "earned");

    const [order] = await db.insert(marketplaceOrdersTable).values({
      productId, buyerId, buyerUsername, sellerId: product.sellerId, sellerUsername: product.sellerUsername,
      amount: product.price,
    }).returning();

    await db.update(marketplaceProductsTable).set({ salesCount: product.salesCount + 1 })
      .where(eq(marketplaceProductsTable.id, productId));

    res.json({ ok: true, order, downloadUrl: product.downloadUrl });
  } catch (err: unknown) {
    req.log.error(err);
    res.status(400).json({ error: (err as Error).message ?? "Error al comprar" });
  }
});

// GET /api/marketplace/orders/:userId — user's purchases
router.get("/marketplace/orders/:userId", async (req, res) => {
  try {
    const userId = safeInt(req.params.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(400).json({ error: "userId inválido" });
    const orders = await db.select().from(marketplaceOrdersTable)
      .where(eq(marketplaceOrdersTable.buyerId, userId))
      .orderBy(desc(marketplaceOrdersTable.createdAt));
    res.json(orders);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// DELETE /api/marketplace/products/:id — deactivate listing
router.delete("/marketplace/products/:id", async (req, res) => {
  const id  = safeInt(req.params.id, 0, 1);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  const raw  = req.body as Record<string, unknown>;
  const userId = safeInt(raw.userId, 0, 1, 1_000_000);
  try {
    const [p] = await db.select().from(marketplaceProductsTable).where(eq(marketplaceProductsTable.id, id));
    if (!p) return res.status(404).json({ error: "No encontrado" });
    if (p.sellerId !== userId) return res.status(403).json({ error: "Sin permisos" });
    await db.update(marketplaceProductsTable).set({ isActive: false }).where(eq(marketplaceProductsTable.id, p.id));
    res.json({ ok: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// ═══════════════════════════════════════════════════════════
// TUTORING SESSIONS
// ═══════════════════════════════════════════════════════════

router.get("/tutoring", async (req, res) => {
  try {
    const sessions = await db.select().from(tutoringSessionsTable)
      .orderBy(desc(tutoringSessionsTable.createdAt));
    res.json(sessions);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

router.post("/tutoring", async (req, res) => {
  const raw = req.body as Record<string, unknown>;
  const tutorId         = safeInt(raw.tutorId, 0, 1, 1_000_000);
  const tutorUsername   = sanitizeStr(raw.tutorUsername, 30);
  const title           = sanitizeStr(raw.title, 100);
  const description     = sanitizeStr(raw.description, 2000);
  const topics          = Array.isArray(raw.topics)
    ? (raw.topics as unknown[]).slice(0, 10).map(t => sanitizeStr(t, 50)).filter(Boolean)
    : [];
  const durationMinutes = safeInt(raw.durationMinutes, 60, 15, 480);
  const pricePerSession = safeInt(raw.pricePerSession, 0, 1, 50_000);
  const meetLink        = sanitizeOptional(raw.meetLink, 300);

  if (!tutorId || !tutorUsername || !title || !pricePerSession) {
    return res.status(400).json({ error: "Faltan campos" });
  }

  try {
    const [s] = await db.insert(tutoringSessionsTable).values({
      tutorId, tutorUsername, title, description,
      topics, durationMinutes, pricePerSession, meetLink,
    }).returning();
    res.status(201).json(s);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error al crear sesión" }); }
});

router.post("/tutoring/:id/book", async (req, res) => {
  const sessionId = safeInt(req.params.id, 0, 1);
  if (!sessionId) return res.status(400).json({ error: "ID inválido" });
  const raw            = req.body as Record<string, unknown>;
  const studentId      = safeInt(raw.studentId, 0, 1, 1_000_000);
  const studentUsername = sanitizeStr(raw.studentUsername, 30);
  if (!studentId || !studentUsername) return res.status(400).json({ error: "Faltan campos" });
  try {
    const [session] = await db.select().from(tutoringSessionsTable).where(eq(tutoringSessionsTable.id, sessionId));
    if (!session) return res.status(404).json({ error: "Sesión no encontrada" });
    if (session.status !== "disponible") return res.status(400).json({ error: "Sesión no disponible" });
    if (session.tutorId === studentId) return res.status(400).json({ error: "No puedes reservar tu propia sesión" });

    const fee       = Math.floor(session.pricePerSession * 0.1);
    const tutorEarns = session.pricePerSession - fee;
    await debit(studentId, session.pricePerSession, `Tutoría: "${session.title}" con ${session.tutorUsername}`, "spent");
    await credit(session.tutorId, tutorEarns, `Tutoría impartida: "${session.title}" a ${studentUsername}`, "earned");

    const [updated] = await db.update(tutoringSessionsTable).set({
      studentId, studentUsername, status: "reservada",
    }).where(eq(tutoringSessionsTable.id, sessionId)).returning();
    res.json(updated);
  } catch (err: unknown) {
    req.log.error(err);
    res.status(400).json({ error: (err as Error).message ?? "Error al reservar" });
  }
});

router.post("/tutoring/:id/complete", async (req, res) => {
  const sessionId = safeInt(req.params.id, 0, 1);
  if (!sessionId) return res.status(400).json({ error: "ID inválido" });
  const raw    = req.body as Record<string, unknown>;
  const userId = safeInt(raw.userId, 0, 1, 1_000_000);
  const rating = safeFloat(raw.rating, 0, 1, 5);
  const reviewText = sanitizeOptional(raw.reviewText, 1000);
  try {
    const [session] = await db.select().from(tutoringSessionsTable).where(eq(tutoringSessionsTable.id, sessionId));
    if (!session) return res.status(404).json({ error: "No encontrada" });
    if (session.studentId !== userId) return res.status(403).json({ error: "Solo el alumno puede marcar como completada" });
    const [updated] = await db.update(tutoringSessionsTable).set({
      status: "completada", rating: rating || null, reviewText,
    }).where(eq(tutoringSessionsTable.id, sessionId)).returning();
    res.json(updated);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// ═══════════════════════════════════════════════════════════
// PAYOUT REQUESTS
// ═══════════════════════════════════════════════════════════

const MIN_PAYOUT_SPC = 5000;

router.get("/payouts/requests/:userId", async (req, res) => {
  try {
    const userId = safeInt(req.params.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(400).json({ error: "userId inválido" });
    const requests = await db.select().from(payoutRequestsTable)
      .where(eq(payoutRequestsTable.userId, userId))
      .orderBy(desc(payoutRequestsTable.createdAt));
    res.json(requests);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

router.post("/payouts/requests", async (req, res) => {
  const raw = req.body as Record<string, unknown>;
  const userId      = safeInt(raw.userId, 0, 1, 1_000_000);
  const username    = sanitizeStr(raw.username, 30);
  const amountSpc   = safeInt(raw.amountSpc, 0, MIN_PAYOUT_SPC, 10_000_000);
  const method      = sanitizeStr(raw.method, 30);
  const destination = sanitizeStr(raw.destination, 200);

  if (!userId || !username || !amountSpc || !method || !destination) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }
  if (amountSpc < MIN_PAYOUT_SPC) {
    return res.status(400).json({ error: `Mínimo de retiro: ${MIN_PAYOUT_SPC.toLocaleString()} SPC (€${MIN_PAYOUT_SPC / 1000})` });
  }

  try {
    const wallet = await getOrCreateWallet(userId);
    if (wallet.balance < amountSpc) return res.status(400).json({ error: "Saldo insuficiente" });

    const amountEur = parseFloat((amountSpc / 1000).toFixed(2));
    await debit(userId, amountSpc, `Retiro solicitado: ${amountSpc.toLocaleString()} SPC → €${amountEur}`, "withdrawal");

    const [req_] = await db.insert(payoutRequestsTable).values({
      userId, username, amountSpc, amountEur, method, destination,
    }).returning();
    res.status(201).json(req_);
  } catch (err: unknown) {
    req.log.error(err);
    res.status(400).json({ error: (err as Error).message ?? "Error al solicitar retiro" });
  }
});

// GET /api/payouts/requests — admin: all requests (internal key required)
router.get("/payouts/requests", internalKeyGuard, async (_req, res) => {
  try {
    const requests = await db.select().from(payoutRequestsTable)
      .orderBy(desc(payoutRequestsTable.createdAt));
    res.json(requests);
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

// PATCH /api/payouts/requests/:id — admin: approve/reject (internal key required)
router.patch("/payouts/requests/:id", internalKeyGuard, async (req, res) => {
  const id = safeInt(req.params.id, 0, 1);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  const raw       = req.body as Record<string, unknown>;
  const status    = sanitizeStr(raw.status, 20);
  const adminNote = sanitizeOptional(raw.adminNote, 500);
  const ALLOWED_STATUSES = new Set(["pendiente", "aprobado", "rechazado"]);
  if (!ALLOWED_STATUSES.has(status)) return res.status(400).json({ error: "Estado inválido" });
  try {
    const [r] = await db.select().from(payoutRequestsTable).where(eq(payoutRequestsTable.id, id));
    if (!r) return res.status(404).json({ error: "No encontrado" });
    if (status === "rechazado" && r.status === "pendiente") {
      await credit(r.userId, r.amountSpc, `Retiro #${r.id} rechazado — reembolso`, "bonus");
    }
    const [updated] = await db.update(payoutRequestsTable).set({
      status, adminNote, processedAt: new Date(),
    }).where(eq(payoutRequestsTable.id, id)).returning();
    res.json(updated);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

export default router;
