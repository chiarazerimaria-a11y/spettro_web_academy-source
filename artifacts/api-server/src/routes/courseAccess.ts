import { Router } from "express";
import { db, usersTable, coursesTable, courseEnrollmentsTable } from "@workspace/db";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { safeInt } from "../middleware/sanitize";
import { notifyEmail } from "./subscriptions";

const router = Router();

router.get("/admin/course-access/courses", async (req, res) => {
  try {
    const rows = await db.select({
      id: coursesTable.id, title: coursesTable.title, price: coursesTable.price,
      instructor: coursesTable.instructor, instructorId: coursesTable.instructorId,
      published: coursesTable.published, isFree: coursesTable.isFree, enrolledCount: coursesTable.enrolledCount,
    }).from(coursesTable).orderBy(desc(coursesTable.createdAt));
    res.json(rows);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

router.get("/admin/course-access", async (req, res) => {
  try {
    const courseId = safeInt(req.query["courseId"], 0, 0, 1_000_000);
    if (!courseId) { res.status(400).json({ error: "Falta courseId" }); return; }
    const rows = await db.select({
      userId: usersTable.id, username: usersTable.username, email: usersTable.email,
      enrolledAt: courseEnrollmentsTable.enrolledAt, progress: courseEnrollmentsTable.progress,
    }).from(courseEnrollmentsTable)
      .innerJoin(usersTable, eq(usersTable.id, courseEnrollmentsTable.userId))
      .where(eq(courseEnrollmentsTable.courseId, courseId))
      .orderBy(desc(courseEnrollmentsTable.enrolledAt));
    res.json(rows);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/admin/course-access", async (req, res) => {
  try {
    const b = req.body as Record<string, unknown>;
    const courseId = safeInt(b["courseId"], 0, 1, 1_000_000);
    if (!courseId) { res.status(400).json({ error: "Elige un curso" }); return; }
    const who = String(b["user"] ?? "").trim().slice(0, 80);
    if (!who) { res.status(400).json({ error: "Indica el usuario (nombre de usuario o email)" }); return; }

    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) { res.status(404).json({ error: "Curso no encontrado" }); return; }

    const [u] = await db.select({ id: usersTable.id, username: usersTable.username, email: usersTable.email })
      .from(usersTable)
      .where(or(eq(usersTable.username, who), sql`lower(${usersTable.email}) = ${who.toLowerCase()}`))
      .limit(1);
    if (!u) { res.status(404).json({ error: "No existe ningún usuario con ese nombre o email" }); return; }

    const [existing] = await db.select({ id: courseEnrollmentsTable.id }).from(courseEnrollmentsTable)
      .where(and(eq(courseEnrollmentsTable.userId, u.id), eq(courseEnrollmentsTable.courseId, courseId))).limit(1);
    if (existing) { res.json({ ok: true, already: true, username: u.username }); return; }

    await db.insert(courseEnrollmentsTable).values({ userId: u.id, courseId });
    await db.update(coursesTable).set({ enrolledCount: course.enrolledCount + 1 }).where(eq(coursesTable.id, courseId));
    try {
      await notifyEmail(u.email, "Acceso concedido", "Hemos confirmado tu pago: ya puedes abrir el curso «" + course.title + "».");
    } catch (e) { req.log.error(e); }
    res.status(201).json({ ok: true, already: false, username: u.username });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

router.delete("/admin/course-access", async (req, res) => {
  try {
    const courseId = safeInt(req.query["courseId"], 0, 1, 1_000_000);
    const userId = safeInt(req.query["userId"], 0, 1, 1_000_000);
    if (!courseId || !userId) { res.status(400).json({ error: "Faltan courseId o userId" }); return; }
    const removed = await db.delete(courseEnrollmentsTable)
      .where(and(eq(courseEnrollmentsTable.userId, userId), eq(courseEnrollmentsTable.courseId, courseId)))
      .returning({ id: courseEnrollmentsTable.id });
    if (removed.length) {
      const [c] = await db.select({ n: coursesTable.enrolledCount }).from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
      if (c) await db.update(coursesTable).set({ enrolledCount: Math.max(0, c.n - 1) }).where(eq(coursesTable.id, courseId));
    }
    res.json({ ok: true, removed: removed.length });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
