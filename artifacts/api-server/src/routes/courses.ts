import { Router } from "express";
import { db, courseSubmissionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// POST /api/courses/submit  — instructor submits a course for review
router.post("/courses/submit", async (req, res) => {
  const { userId, title, description, level, price, durationHours, videoUrl, syllabus } = req.body as Record<string, string>;
  if (!title || !description || !level) {
    res.status(400).json({ error: "Faltan campos requeridos (title, description, level)" });
    return;
  }
  try {
    const [sub] = await db.insert(courseSubmissionsTable).values({
      userId: userId ? Number(userId) : null,
      title: title.trim(),
      description: description.trim(),
      level,
      price: price || "0",
      durationHours: durationHours ? Number(durationHours) : 1,
      videoUrl: videoUrl || null,
      syllabus: syllabus || null,
    }).returning();
    res.status(201).json(sub);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

// PATCH /api/auth/payment — save payment method on user record
router.patch("/auth/payment", async (req, res) => {
  const { userId, cardLast4, cardBrand, cardHolder, expiry } = req.body as Record<string, string>;
  if (!userId) { res.status(400).json({ error: "userId requerido" }); return; }
  try {
    const payload = JSON.stringify({ cardLast4, cardBrand, cardHolder, expiry, updatedAt: new Date().toISOString() });
    await db.update(usersTable).set({ paymentMethodJson: payload }).where(eq(usersTable.id, Number(userId)));
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
