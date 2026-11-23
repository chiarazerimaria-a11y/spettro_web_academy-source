import { Router } from "express";
import { db, courseSubmissionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getSessionUserId } from "../middleware/requireUser";
import { sanitizeStr, rateLimit } from "../middleware/sanitize";

const router = Router();

const submitLimit = rateLimit(5, 60_000);
const paymentLimit = rateLimit(10, 60_000);
const LEVELS = ["principiante", "intermedio", "avanzado", "experto"];

// POST /api/courses/submit  — un usuario con sesion propone un curso para revision
router.post("/courses/submit", submitLimit, async (req, res) => {
  // La identidad sale SIEMPRE de la cookie firmada, nunca del body.
  const uid = getSessionUserId(req);
  if (!uid) { res.status(401).json({ error: "Inicia sesion de nuevo" }); return; }

  const b = (req.body ?? {}) as Record<string, unknown>;
  const title = sanitizeStr(b.title, 120);
  const description = sanitizeStr(b.description, 2000);
  const level = LEVELS.includes(String(b.level)) ? String(b.level) : "";
  if (title.length < 3 || description.length < 3 || !level) {
    res.status(400).json({ error: "Faltan campos requeridos (title, description, level)" });
    return;
  }
  const priceNum = Math.min(Math.max(Number(b.price) || 0, 0), 1000);
  const hours = Math.min(Math.max(Math.floor(Number(b.durationHours) || 1), 1), 500);
  const videoRaw = typeof b.videoUrl === "string" ? b.videoUrl.trim().slice(0, 500) : "";
  if (videoRaw && !/^https?:\/\/[^\s]+$/i.test(videoRaw)) {
    res.status(400).json({ error: "Enlace de video invalido (debe empezar por http o https)" });
    return;
  }
  const syllabus = typeof b.syllabus === "string" ? b.syllabus.slice(0, 5000) : "";

  try {
    const [u] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    if (!u) { res.status(401).json({ error: "Inicia sesion de nuevo" }); return; }

    const [sub] = await db.insert(courseSubmissionsTable).values({
      userId: uid,
      title, description, level,
      price: String(priceNum),
      durationHours: hours,
      videoUrl: videoRaw || null,
      syllabus: syllabus || null,
    }).returning();
    res.status(201).json(sub);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

// PATCH /api/auth/payment — guarda marca y ultimos 4 digitos de la tarjeta del usuario con sesion
router.patch("/auth/payment", paymentLimit, async (req, res) => {
  const uid = getSessionUserId(req);
  if (!uid) { res.status(401).json({ error: "Inicia sesion de nuevo" }); return; }

  const b = (req.body ?? {}) as Record<string, unknown>;
  const last4 = String(b.cardLast4 ?? "");
  if (!/^\d{4}$/.test(last4)) { res.status(400).json({ error: "Datos de tarjeta invalidos" }); return; }
  const brandIn = String(b.cardBrand ?? "");
  const brand = ["Visa", "Mastercard"].includes(brandIn) ? brandIn : "Tarjeta";

  try {
    // No se guardan titular ni caducidad: no hacen falta para mostrar "Visa ···· 1234".
    const payload = JSON.stringify({ cardLast4: last4, cardBrand: brand, updatedAt: new Date().toISOString() });
    await db.update(usersTable).set({ paymentMethodJson: payload }).where(eq(usersTable.id, uid));
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
