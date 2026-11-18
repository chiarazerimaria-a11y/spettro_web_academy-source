import { Router, type IRouter } from "express";
import { db, subscribersTable, coursesTable, paymentsTable, machinesTable, affiliatesTable, usersTable, applicationsTable, courseSubmissionsTable, labMachinesTable, ctfMissionsTable, squadsTable, tournamentRoomsTable, spettroWalletsTable, spettroTransactionsTable, ghcTransactionsTable, machinePurchasesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { notifyEmail } from "./subscriptions";
import {
  CreateSubscriberBody, UpdateSubscriberBody,
  CreateCourseBody, UpdateCourseBody,
  CreatePaymentBody, UpdatePaymentBody,
  CreateMachineBody, UpdateMachineBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toSubscriber = (r: typeof subscribersTable.$inferSelect) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  status: r.status,
  plan: r.plan,
  notes: r.notes,
  joinedAt: r.joinedAt.toISOString(),
});
const toCourse = (r: typeof coursesTable.$inferSelect) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  price: Number(r.price),
  level: r.level,
  durationHours: r.durationHours,
  videoUrl: r.videoUrl,
  published: r.published,
  createdAt: r.createdAt.toISOString(),
});
const toPayment = (r: typeof paymentsTable.$inferSelect) => ({
  id: r.id,
  subscriberId: r.subscriberId,
  subscriberName: r.subscriberName,
  amount: Number(r.amount),
  method: r.method,
  status: r.status,
  reference: r.reference,
  bank: r.bank,
  createdAt: r.createdAt.toISOString(),
});
const toMachine = (r: typeof machinesTable.$inferSelect) => ({
  id: r.id,
  name: r.name,
  platform: r.platform,
  difficulty: r.difficulty,
  status: r.status,
  points: r.points,
  ip: r.ip,
  os: r.os,
  techniques: r.techniques,
  writeupUrl: r.writeupUrl,
  videoUrl: r.videoUrl,
  createdAt: r.createdAt.toISOString(),
});

// Summary
const PACK_EUR_CENTS: Record<string, number> = { STARTER: 100, HACKER: 450, ELITE: 1000, MASTER: 2000 };

router.get("/admin/summary", async (_req, res) => {
  const [subs, courses, payments, machines, wallets, spcTx] = await Promise.all([
    db.select().from(subscribersTable),
    db.select().from(coursesTable),
    db.select().from(paymentsTable),
    db.select().from(machinesTable),
    db.select().from(spettroWalletsTable),
    db.select().from(spettroTransactionsTable),
  ]);
  const recent = [...subs].sort((a, b) => +b.joinedAt - +a.joinedAt).slice(0, 5).map(toSubscriber);

  const subscriptionRevenue = payments.filter((p) => p.status === "pagado").reduce((s, p) => s + Number(p.amount), 0);

  const spcRevenueCents = spcTx
    .filter((t) => t.type === "purchase")
    .reduce((s, t) => {
      const match = /^Pack (\w+):/.exec(t.description);
      const label = match?.[1];
      return s + (label && PACK_EUR_CENTS[label] ? PACK_EUR_CENTS[label] : 0);
    }, 0);
  const spcRevenue = spcRevenueCents / 100;

  const totalSpcBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const totalGhcBalance = wallets.reduce((s, w) => s + w.ghcBalance, 0);

  res.json({
    totalSubscribers: subs.length,
    activeSubscribers: subs.filter((s) => s.status === "active").length,
    totalCourses: courses.length,
    totalRevenue: subscriptionRevenue + spcRevenue,
    subscriptionRevenue,
    spcRevenue,
    totalSpcBalance,
    totalGhcBalance,
    pendingPayments: payments.filter((p) => p.status === "pendiente").length,
    paidPayments: payments.filter((p) => p.status === "pagado").length,
    machinesCompleted: machines.filter((m) => m.status === "completada").length,
    machinesInProgress: machines.filter((m) => m.status === "en_progreso").length,
    machinesPlanned: machines.filter((m) => m.status === "planificada").length,
    recentSubscribers: recent,
  });
});

// GhostCoin stats (moneda interna, separada de los euros)
router.get("/admin/ghc/stats", async (_req, res) => {
  const a = await db.execute(sql`SELECT COALESCE(SUM(ghc_balance), 0)::bigint AS v FROM spettro_wallets`);
  const b = await db.execute(sql`SELECT COALESCE(SUM(amount), 0)::bigint AS v FROM ghc_transactions WHERE amount > 0 AND description NOT LIKE '[envío]%'`);
  res.json({
    inCirculation: Number((a.rows[0] as { v: string }).v),
    totalCredited: Number((b.rows[0] as { v: string }).v),
  });
});

// Subscribers
router.get("/admin/subscribers", async (_req, res) => {
  const rows = await db.select().from(subscribersTable).orderBy(desc(subscribersTable.joinedAt));
  res.json(rows.map(toSubscriber));
});
router.post("/admin/subscribers", async (req, res) => {
  const body = CreateSubscriberBody.parse(req.body);
  const [row] = await db.insert(subscribersTable).values({
    name: body.name,
    email: body.email,
    status: body.status ?? "active",
    plan: body.plan ?? "eJPTv2",
    notes: body.notes ?? null,
  }).returning();
  res.status(201).json(toSubscriber(row));
});
router.patch("/admin/subscribers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateSubscriberBody.parse(req.body);
  const [row] = await db.update(subscribersTable).set(body).where(eq(subscribersTable.id, id)).returning();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(toSubscriber(row));
});
router.delete("/admin/subscribers/:id", async (req, res) => {
  await db.delete(subscribersTable).where(eq(subscribersTable.id, Number(req.params.id)));
  res.status(204).end();
});

// Courses
router.get("/admin/courses", async (_req, res) => {
  const rows = await db.select().from(coursesTable).orderBy(desc(coursesTable.createdAt));
  res.json(rows.map(toCourse));
});
router.post("/admin/courses", async (req, res) => {
  const body = CreateCourseBody.parse(req.body);
  const [row] = await db.insert(coursesTable).values({
    title: body.title,
    description: body.description,
    price: String(body.price),
    level: body.level,
    durationHours: body.durationHours,
    videoUrl: body.videoUrl ?? null,
    published: body.published ?? false,
  }).returning();
  res.status(201).json(toCourse(row));
});
router.patch("/admin/courses/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateCourseBody.parse(req.body);
  const update: Record<string, unknown> = { ...body };
  if (body.price !== undefined) update.price = String(body.price);
  const [row] = await db.update(coursesTable).set(update).where(eq(coursesTable.id, id)).returning();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(toCourse(row));
});
router.delete("/admin/courses/:id", async (req, res) => {
  await db.delete(coursesTable).where(eq(coursesTable.id, Number(req.params.id)));
  res.status(204).end();
});

// Payments
router.get("/admin/payments", async (_req, res) => {
  const rows = await db.select().from(paymentsTable).orderBy(desc(paymentsTable.createdAt));
  res.json(rows.map(toPayment));
});
router.post("/admin/payments", async (req, res) => {
  const body = CreatePaymentBody.parse(req.body);
  const [row] = await db.insert(paymentsTable).values({
    subscriberId: body.subscriberId ?? null,
    subscriberName: body.subscriberName,
    amount: String(body.amount),
    method: body.method,
    status: body.status ?? "pendiente",
    reference: body.reference ?? "",
    bank: body.bank ?? null,
  }).returning();
  res.status(201).json(toPayment(row));
});
router.patch("/admin/payments/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdatePaymentBody.parse(req.body);
  const update: Record<string, unknown> = { ...body };
  if (body.amount !== undefined) update.amount = String(body.amount);
  const [row] = await db.update(paymentsTable).set(update).where(eq(paymentsTable.id, id)).returning();
  if (!row) return res.status(404).json({ error: "not found" });
  if ((body as { status?: string }).status === "pagado" && row.subscriberId) {
    const [sub] = await db.update(subscribersTable)
      .set({ status: "active" })
      .where(eq(subscribersTable.id, row.subscriberId))
      .returning();
    if (sub) {
      try {
        await notifyEmail(sub.email, "¡Tu suscripción está activa!", `Hemos confirmado tu pago. Tu plan ${sub.plan} ya está activo. ¡Bienvenido a la academia!`);
      } catch (e) { console.error("notify error", e); }
    }
  }
  res.json(toPayment(row));
});
router.delete("/admin/payments/:id", async (req, res) => {
  await db.delete(paymentsTable).where(eq(paymentsTable.id, Number(req.params.id)));
  res.status(204).end();
});

// Machines
router.get("/admin/machines", async (_req, res) => {
  const rows = await db.select().from(machinesTable).orderBy(desc(machinesTable.createdAt));
  res.json(rows.map(toMachine));
});
router.post("/admin/machines", async (req, res) => {
  const body = CreateMachineBody.parse(req.body);
  const [row] = await db.insert(machinesTable).values({
    name: body.name,
    platform: body.platform,
    difficulty: body.difficulty,
    status: body.status ?? "planificada",
    points: body.points ?? 0,
    ip: body.ip ?? null,
    os: body.os ?? null,
    techniques: body.techniques ?? null,
    writeupUrl: body.writeupUrl ?? null,
    videoUrl: body.videoUrl ?? null,
  }).returning();
  res.status(201).json(toMachine(row));
});
router.patch("/admin/machines/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateMachineBody.parse(req.body);
  const [row] = await db.update(machinesTable).set(body).where(eq(machinesTable.id, id)).returning();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(toMachine(row));
});
router.delete("/admin/machines/:id", async (req, res) => {
  await db.delete(machinesTable).where(eq(machinesTable.id, Number(req.params.id)));
  res.status(204).end();
});

// ── Lab Machines (public lab) ─────────────────────────────────
router.get("/admin/lab-machines", async (_req, res) => {
  const rows = await db.select().from(labMachinesTable).orderBy(desc(labMachinesTable.createdAt));
  res.json(rows);
});
router.post("/admin/lab-machines", async (req, res) => {
  const b = req.body;
  const slug = b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const [row] = await db.insert(labMachinesTable).values({
    name: b.name,
    slug,
    os: b.os || "Linux",
    difficulty: b.difficulty || "facil",
    characterType: b.characterType || "skull",
    points: Number(b.points || 20),
    price: Math.max(0, Math.floor(Number(b.price) || 0)),
    priceCurrency: b.priceCurrency === "SPC" ? "SPC" : "GHC",
    description: b.description || "",
    vulnerability: b.vulnerability || "",
    techniques: b.techniques || "",
    hints: b.hints || null,
    userFlag: b.userFlag?.trim() || null,
    rootFlag: b.rootFlag?.trim() || null,
    ip: b.ip || null,
    thumbnailUrl: b.thumbnailUrl || null,
    downloadUrl: b.downloadUrl || null,
    writeupUrl: b.writeupUrl || null,
    videoUrl: b.videoUrl || null,
    isActive: b.isActive !== false,
  }).returning();
  res.status(201).json(row);
});
router.patch("/admin/lab-machines/:id", async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body;
  const updateData: Partial<typeof labMachinesTable.$inferInsert> = {};
  if (b.name !== undefined) updateData.name = b.name;
  if (b.slug !== undefined) updateData.slug = b.slug;
  if (b.os !== undefined) updateData.os = b.os;
  if (b.difficulty !== undefined) updateData.difficulty = b.difficulty;
  if (b.characterType !== undefined) updateData.characterType = b.characterType;
  if (b.points !== undefined) updateData.points = Number(b.points);
  if (b.price !== undefined) updateData.price = Math.max(0, Math.floor(Number(b.price) || 0));
  if (b.priceCurrency !== undefined) updateData.priceCurrency = b.priceCurrency === "SPC" ? "SPC" : "GHC";
  if (b.description !== undefined) updateData.description = b.description;
  if (b.vulnerability !== undefined) updateData.vulnerability = b.vulnerability;
  if (b.techniques !== undefined) updateData.techniques = b.techniques;
  if (b.hints !== undefined) updateData.hints = b.hints;
  if (b.userFlag !== undefined) updateData.userFlag = b.userFlag?.trim() || null;
  if (b.rootFlag !== undefined) updateData.rootFlag = b.rootFlag?.trim() || null;
  if (b.ip !== undefined) updateData.ip = b.ip || null;
  if (b.thumbnailUrl !== undefined) updateData.thumbnailUrl = b.thumbnailUrl;
  if (b.downloadUrl !== undefined) updateData.downloadUrl = b.downloadUrl;
  if (b.writeupUrl !== undefined) updateData.writeupUrl = b.writeupUrl;
  if (b.videoUrl !== undefined) updateData.videoUrl = b.videoUrl;
  if (b.isActive !== undefined) updateData.isActive = b.isActive;
  const [row] = await db.update(labMachinesTable).set(updateData).where(eq(labMachinesTable.id, id)).returning();
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});
router.delete("/admin/lab-machines/:id", async (req, res) => {
  await db.delete(labMachinesTable).where(eq(labMachinesTable.id, Number(req.params.id)));
  res.status(204).end();
});

// ── Affiliates ────────────────────────────────────────────────
const toAffiliate = (r: typeof affiliatesTable.$inferSelect) => ({
  id: r.id, name: r.name, email: r.email, referralCode: r.referralCode,
  referredCount: r.referredCount, commissionRate: Number(r.commissionRate),
  totalEarned: Number(r.totalEarned), status: r.status,
  payoutIban: r.payoutIban, payoutPaypal: r.payoutPaypal, notes: r.notes,
  createdAt: r.createdAt.toISOString(),
});

router.get("/admin/affiliates", async (_req, res) => {
  const rows = await db.select().from(affiliatesTable).orderBy(desc(affiliatesTable.createdAt));
  res.json(rows.map(toAffiliate));
});
router.post("/admin/affiliates", async (req, res) => {
  const { name, email, referralCode, commissionRate, payoutIban, payoutPaypal, notes } = req.body as Record<string, string>;
  if (!name || !email || !referralCode) { res.status(400).json({ error: "Faltan campos" }); return; }
  try {
    const [row] = await db.insert(affiliatesTable).values({
      name, email, referralCode: referralCode.toUpperCase(),
      commissionRate: String(commissionRate || "15"),
      payoutIban: payoutIban || null, payoutPaypal: payoutPaypal || null,
      notes: notes || null,
    }).returning();
    res.status(201).json(toAffiliate(row));
  } catch (e) { req.log.error(e); res.status(500).json({ error: "Error interno" }); }
});
router.patch("/admin/affiliates/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, referralCode, commissionRate, referredCount, totalEarned, status, payoutIban, payoutPaypal, notes } = req.body as Record<string, string>;
  const update: Record<string, unknown> = {};
  if (name) update.name = name;
  if (email) update.email = email;
  if (referralCode) update.referralCode = referralCode.toUpperCase();
  if (commissionRate) update.commissionRate = String(commissionRate);
  if (referredCount !== undefined) update.referredCount = Number(referredCount);
  if (totalEarned !== undefined) update.totalEarned = String(totalEarned);
  if (status) update.status = status;
  if (payoutIban !== undefined) update.payoutIban = payoutIban || null;
  if (payoutPaypal !== undefined) update.payoutPaypal = payoutPaypal || null;
  if (notes !== undefined) update.notes = notes || null;
  const [row] = await db.update(affiliatesTable).set(update).where(eq(affiliatesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json(toAffiliate(row));
});
router.delete("/admin/affiliates/:id", async (req, res) => {
  await db.delete(affiliatesTable).where(eq(affiliatesTable.id, Number(req.params.id)));
  res.status(204).end();
});

// ── Alumnos ───────────────────────────────────────────────────
router.get("/admin/alumnos", async (_req, res) => {
  const rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(rows.map(r => ({
    id: r.id, username: r.username, email: r.email, avatarType: r.avatarType,
    rank: r.rank, totalPoints: r.totalPoints, machinesSolved: r.machinesSolved,
    paymentMethodJson: r.paymentMethodJson, createdAt: r.createdAt.toISOString(),
  })));
});

// ── Instructores (applications) ───────────────────────────────
router.get("/admin/instructores", async (_req, res) => {
  const rows = await db.select().from(applicationsTable).orderBy(desc(applicationsTable.createdAt));
  res.json(rows.map(r => ({
    id: r.id, name: r.name, email: r.email, role: r.role,
    experience: r.experience, links: r.links, message: r.message,
    payoutIban: r.payoutIban, payoutPaypal: r.payoutPaypal,
    status: r.status, createdAt: r.createdAt.toISOString(),
  })));
});
router.patch("/admin/instructores/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status, payoutIban, payoutPaypal } = req.body as Record<string, string>;
  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (payoutIban !== undefined) update.payoutIban = payoutIban || null;
  if (payoutPaypal !== undefined) update.payoutPaypal = payoutPaypal || null;
  const [row] = await db.update(applicationsTable).set(update).where(eq(applicationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json({ id: row.id, status: row.status });
});

// ── Course Submissions ────────────────────────────────────────
router.get("/admin/submissions", async (_req, res) => {
  const rows = await db.select().from(courseSubmissionsTable).orderBy(desc(courseSubmissionsTable.createdAt));
  res.json(rows.map(r => ({
    id: r.id, userId: r.userId, title: r.title, description: r.description,
    level: r.level, price: r.price, durationHours: r.durationHours,
    videoUrl: r.videoUrl, syllabus: r.syllabus, status: r.status,
    createdAt: r.createdAt.toISOString(),
  })));
});
router.patch("/admin/submissions/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as Record<string, string>;
  if (!status) { res.status(400).json({ error: "status requerido" }); return; }
  const [row] = await db.update(courseSubmissionsTable).set({ status }).where(eq(courseSubmissionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json({ id: row.id, status: row.status });
});

// ── CTF Missions (admin) ──────────────────────────────────────
router.get("/admin/ctf-missions", async (_req, res) => {
  const rows = await db.select().from(ctfMissionsTable).orderBy(desc(ctfMissionsTable.createdAt));
  res.json(rows.map(r => ({
    id: r.id, name: r.name, description: r.description, difficulty: r.difficulty,
    points: r.points, targetIp: r.targetIp, flagFormat: r.flagFormat,
    flagValue: r.flagValue, downloadUrl: r.downloadUrl,
    hints: r.hints, isActive: r.isActive, createdAt: r.createdAt.toISOString(),
  })));
});
router.post("/admin/ctf-missions", async (req, res) => {
  const b = req.body as Record<string, unknown>;
  if (!b.name || !b.description) { res.status(400).json({ error: "nombre y descripción requeridos" }); return; }
  const [row] = await db.insert(ctfMissionsTable).values({
    name: String(b.name), description: String(b.description),
    difficulty: String(b.difficulty || "medio"),
    points: Number(b.points) || 100,
    targetIp: String(b.targetIp || "10.10.0.1"),
    flagFormat: String(b.flagFormat || "SpettroWeb{...}"),
    flagValue: b.flagValue ? String(b.flagValue) : null,
    downloadUrl: b.downloadUrl ? String(b.downloadUrl) : null,
    hints: b.hints ? String(b.hints) : null,
    isActive: b.isActive !== false,
  }).returning();
  res.status(201).json({ id: row.id });
});
router.patch("/admin/ctf-missions/:id", async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (b.name !== undefined) update.name = String(b.name);
  if (b.description !== undefined) update.description = String(b.description);
  if (b.difficulty !== undefined) update.difficulty = String(b.difficulty);
  if (b.points !== undefined) update.points = Number(b.points);
  if (b.targetIp !== undefined) update.targetIp = String(b.targetIp);
  if (b.flagFormat !== undefined) update.flagFormat = String(b.flagFormat);
  if (b.flagValue !== undefined) update.flagValue = b.flagValue ? String(b.flagValue) : null;
  if (b.downloadUrl !== undefined) update.downloadUrl = b.downloadUrl ? String(b.downloadUrl) : null;
  if (b.hints !== undefined) update.hints = b.hints ? String(b.hints) : null;
  if (b.isActive !== undefined) update.isActive = Boolean(b.isActive);
  const [row] = await db.update(ctfMissionsTable).set(update).where(eq(ctfMissionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json({ id: row.id });
});
router.delete("/admin/ctf-missions/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(ctfMissionsTable).where(eq(ctfMissionsTable.id, id));
  res.status(204).end();
});

// ── Squads (admin) ────────────────────────────────────────────
router.get("/admin/squads", async (_req, res) => {
  const rows = await db.select().from(squadsTable).orderBy(desc(squadsTable.totalPoints));
  res.json(rows.map(r => ({
    id: r.id, name: r.name, slug: r.slug, captainName: r.captainName,
    description: r.description, emblem: r.emblem, memberCount: r.memberCount,
    totalPoints: r.totalPoints, level: r.level, wins: r.wins, losses: r.losses,
    status: r.status, isBot: r.isBot, aiDifficulty: r.aiDifficulty,
    createdAt: r.createdAt.toISOString(),
  })));
});
router.post("/admin/squads", async (req, res) => {
  const b = req.body as Record<string, unknown>;
  if (!b.name || !b.captainName) { res.status(400).json({ error: "nombre y capitán requeridos" }); return; }
  const slug = String(b.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [row] = await db.insert(squadsTable).values({
    name: String(b.name), slug, captainName: String(b.captainName),
    description: b.description ? String(b.description) : null,
    emblem: String(b.emblem || "skull"),
    status: String(b.status || "activa"),
    isBot: Boolean(b.isBot),
    aiDifficulty: b.aiDifficulty ? String(b.aiDifficulty) : null,
  }).returning();
  res.status(201).json({ id: row.id });
});
router.patch("/admin/squads/:id", async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (b.name !== undefined) update.name = String(b.name);
  if (b.captainName !== undefined) update.captainName = String(b.captainName);
  if (b.description !== undefined) update.description = b.description ? String(b.description) : null;
  if (b.emblem !== undefined) update.emblem = String(b.emblem);
  if (b.status !== undefined) update.status = String(b.status);
  if (b.isBot !== undefined) update.isBot = Boolean(b.isBot);
  if (b.aiDifficulty !== undefined) update.aiDifficulty = b.aiDifficulty ? String(b.aiDifficulty) : null;
  if (b.totalPoints !== undefined) update.totalPoints = Number(b.totalPoints);
  if (b.wins !== undefined) update.wins = Number(b.wins);
  if (b.losses !== undefined) update.losses = Number(b.losses);
  const [row] = await db.update(squadsTable).set(update).where(eq(squadsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json({ id: row.id });
});
router.delete("/admin/squads/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(squadsTable).where(eq(squadsTable.id, id));
  res.status(204).end();
});

// ── Tournament Rooms (admin) ──────────────────────────────────
router.get("/admin/tournament-rooms", async (_req, res) => {
  const rows = await db.select().from(tournamentRoomsTable).orderBy(desc(tournamentRoomsTable.createdAt));
  res.json(rows.map(r => ({
    id: r.id, tournamentName: r.tournamentName, round: r.round,
    squad1Name: r.squad1Name, squad2Name: r.squad2Name,
    squad1Score: r.squad1Score, squad2Score: r.squad2Score,
    machineName: r.machineName, machineIp: r.machineIp,
    machineDownloadUrl: r.machineDownloadUrl,
    flagFormat: r.flagFormat, flagValue: r.flagValue,
    difficulty: r.difficulty, status: r.status,
    maxParticipants: r.maxParticipants, currentParticipants: r.currentParticipants,
    startedAt: r.startedAt?.toISOString() ?? null,
    endedAt: r.endedAt?.toISOString() ?? null,
    winnerName: r.winnerName,
    createdAt: r.createdAt.toISOString(),
  })));
});
router.post("/admin/tournament-rooms", async (req, res) => {
  const b = req.body as Record<string, unknown>;
  if (!b.squad1Name || !b.squad2Name) { res.status(400).json({ error: "dos squads requeridos" }); return; }
  const [row] = await db.insert(tournamentRoomsTable).values({
    tournamentName: String(b.tournamentName || "Infiltration Cup 2026"),
    round: String(b.round || "fase de grupos"),
    squad1Name: String(b.squad1Name), squad2Name: String(b.squad2Name),
    machineName: String(b.machineName || "Unknown"),
    machineIp: String(b.machineIp || "10.10.0.1"),
    machineDownloadUrl: b.machineDownloadUrl ? String(b.machineDownloadUrl) : null,
    flagFormat: String(b.flagFormat || "SpettroWeb{...}"),
    flagValue: b.flagValue ? String(b.flagValue) : null,
    difficulty: String(b.difficulty || "medio"),
    status: "esperando",
    maxParticipants: Number(b.maxParticipants) || 20,
  }).returning();
  res.status(201).json({ id: row.id });
});
router.patch("/admin/tournament-rooms/:id", async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (b.tournamentName !== undefined) update.tournamentName = String(b.tournamentName);
  if (b.round !== undefined) update.round = String(b.round);
  if (b.squad1Name !== undefined) update.squad1Name = String(b.squad1Name);
  if (b.squad2Name !== undefined) update.squad2Name = String(b.squad2Name);
  if (b.squad1Score !== undefined) update.squad1Score = Number(b.squad1Score);
  if (b.squad2Score !== undefined) update.squad2Score = Number(b.squad2Score);
  if (b.machineName !== undefined) update.machineName = String(b.machineName);
  if (b.machineIp !== undefined) update.machineIp = String(b.machineIp);
  if (b.machineDownloadUrl !== undefined) update.machineDownloadUrl = b.machineDownloadUrl ? String(b.machineDownloadUrl) : null;
  if (b.flagFormat !== undefined) update.flagFormat = String(b.flagFormat);
  if (b.flagValue !== undefined) update.flagValue = b.flagValue ? String(b.flagValue) : null;
  if (b.difficulty !== undefined) update.difficulty = String(b.difficulty);
  if (b.status !== undefined) update.status = String(b.status);
  if (b.winnerName !== undefined) update.winnerName = b.winnerName ? String(b.winnerName) : null;
  if (b.maxParticipants !== undefined) update.maxParticipants = Number(b.maxParticipants);
  const [row] = await db.update(tournamentRoomsTable).set(update).where(eq(tournamentRoomsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json({ id: row.id });
});
router.delete("/admin/tournament-rooms/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(tournamentRoomsTable).where(eq(tournamentRoomsTable.id, id));
  res.status(204).end();
});

// -- Usuarios (panel admin: ficha completa por usuario) --------
router.get("/admin/users", async (_req, res) => {
  const rows = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      rank: usersTable.rank,
      totalPoints: usersTable.totalPoints,
      machinesSolved: usersTable.machinesSolved,
      createdAt: usersTable.createdAt,
      spcBalance: spettroWalletsTable.balance,
      ghcBalance: spettroWalletsTable.ghcBalance,
    })
    .from(usersTable)
    .leftJoin(spettroWalletsTable, eq(spettroWalletsTable.userId, usersTable.id))
    .orderBy(desc(usersTable.createdAt));

  const subs = await db.select().from(subscribersTable);
  const subByEmail = new Map(subs.map((s) => [s.email.toLowerCase(), s]));

  res.json(
    rows.map((r) => {
      const sub = subByEmail.get(r.email.toLowerCase());
      return {
        id: r.id,
        username: r.username,
        email: r.email,
        rank: r.rank,
        totalPoints: r.totalPoints,
        machinesSolved: r.machinesSolved,
        createdAt: r.createdAt.toISOString(),
        spcBalance: r.spcBalance ?? 0,
        ghcBalance: r.ghcBalance ?? 0,
        subscriptionStatus: sub?.status ?? null,
        subscriptionPlan: sub?.plan ?? null,
      };
    })
  );
});

router.get("/admin/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "usuario no encontrado" }); return; }

  const [wallet] = await db.select().from(spettroWalletsTable).where(eq(spettroWalletsTable.userId, id)).limit(1);
  const spcTx = await db
    .select()
    .from(spettroTransactionsTable)
    .where(eq(spettroTransactionsTable.userId, id))
    .orderBy(desc(spettroTransactionsTable.createdAt))
    .limit(100);
  const ghcTx = await db
    .select()
    .from(ghcTransactionsTable)
    .where(eq(ghcTransactionsTable.userId, id))
    .orderBy(desc(ghcTransactionsTable.createdAt))
    .limit(100);
  const purchases = await db
    .select()
    .from(machinePurchasesTable)
    .where(eq(machinePurchasesTable.userId, id))
    .orderBy(desc(machinePurchasesTable.createdAt));

  const [sub] = await db.select().from(subscribersTable).where(eq(subscribersTable.email, user.email)).limit(1);

  res.json({
    user: {
      id: user.id, username: user.username, email: user.email, rank: user.rank,
      totalPoints: user.totalPoints, machinesSolved: user.machinesSolved,
      createdAt: user.createdAt.toISOString(), avatarType: user.avatarType,
      paymentMethodJson: user.paymentMethodJson, role: user.role,
    },
    wallet: wallet ? {
      balance: wallet.balance, totalEarned: wallet.totalEarned, totalSpent: wallet.totalSpent,
      ghcBalance: wallet.ghcBalance,
    } : null,
    subscription: sub ? {
      status: sub.status, plan: sub.plan, joinedAt: sub.joinedAt.toISOString(), notes: sub.notes,
    } : null,
    spcTransactions: spcTx.map((t) => ({
      id: t.id, amount: t.amount, type: t.type, description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
    ghcTransactions: ghcTx.map((t) => ({
      id: t.id, amount: t.amount, description: t.description, createdAt: t.createdAt.toISOString(),
    })),
    machinePurchases: purchases.map((p) => ({
      id: p.id, machineId: p.machineId, price: p.price, currency: p.currency,
      createdAt: p.createdAt.toISOString(),
    })),
  });
});

router.patch("/admin/users/:id/role", async (req, res) => {
  const id = Number(req.params.id);
  const role = String((req.body as Record<string, unknown> | undefined)?.role ?? "");
  if (!Number.isInteger(id) || id <= 0 || !["student", "instructor"].includes(role)) {
    res.status(400).json({ error: "datos invalidos" }); return;
  }
  await db.update(usersTable).set({ role }).where(eq(usersTable.id, id));
  res.json({ ok: true, role });
});

void sql;

export default router;
