import { Router, type Request, type Response } from "express";
import {
  db, usersTable, coursesTable, courseLessonsTable, lessonProgressTable,
  courseEnrollmentsTable, examsTable, examQuestionsTable, examAttemptsTable,
} from "@workspace/db";
import { eq, and, asc, desc, inArray, sql } from "drizzle-orm";
import { getSessionUserId } from "../middleware/requireUser";
import { sanitizeStr, rateLimit } from "../middleware/sanitize";

const router = Router();

// Crea columnas/tablas si faltan (idempotente). Se ejecuta al arrancar el servidor.
(async () => {
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student'`);
    await db.execute(sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id integer`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS exams (
      id serial PRIMARY KEY,
      course_id integer NOT NULL REFERENCES courses(id),
      title text NOT NULL,
      pass_score integer NOT NULL DEFAULT 60,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS exam_questions (
      id serial PRIMARY KEY,
      exam_id integer NOT NULL REFERENCES exams(id),
      position integer NOT NULL DEFAULT 0,
      question text NOT NULL,
      options text NOT NULL DEFAULT '[]',
      correct_index integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS exam_attempts (
      id serial PRIMARY KEY,
      exam_id integer NOT NULL REFERENCES exams(id),
      user_id integer NOT NULL REFERENCES users(id),
      score integer NOT NULL DEFAULT 0,
      passed boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
  } catch (e) {
    console.error("[instructor] ensure schema fallo:", e);
  }
})();

router.use("/instructor", rateLimit(120, 60_000));

type Me = { id: number; username: string };
const LEVELS = ["principiante", "intermedio", "avanzado", "experto"];

function intId(v: unknown): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

// Acepta http(s); convierte enlaces de YouTube a embed.
function cleanUrl(v: unknown): { ok: boolean; value: string | null } {
  if (v === undefined || v === null) return { ok: true, value: null };
  if (typeof v !== "string") return { ok: false, value: null };
  const u = v.trim().slice(0, 500);
  if (!u) return { ok: true, value: null };
  if (!/^https?:\/\/[^\s]+$/i.test(u)) return { ok: false, value: null };
  const yt = u.match(/(?:youtube\.com\/watch\?(?:[^#\s]*&)?v=|youtu\.be\/)([\w-]{11})/i);
  return { ok: true, value: yt ? "https://www.youtube.com/embed/" + yt[1] : u };
}

type Handler = (req: Request, res: Response, me: Me) => Promise<void>;
function guarded(fn: Handler) {
  return async (req: Request, res: Response) => {
    try {
      const uid = getSessionUserId(req);
      if (!uid) { res.status(401).json({ error: "Inicia sesion de nuevo" }); return; }
      const [u] = await db
        .select({ id: usersTable.id, username: usersTable.username, role: usersTable.role })
        .from(usersTable).where(eq(usersTable.id, uid)).limit(1);
      if (!u || u.role !== "instructor") { res.status(403).json({ error: "Solo profesores" }); return; }
      await fn(req, res, { id: u.id, username: u.username });
    } catch (e) {
      req.log.error(e);
      res.status(500).json({ error: "Error interno" });
    }
  };
}

async function ownedCourse(courseId: number, uid: number) {
  if (!courseId) return null;
  const [c] = await db.select().from(coursesTable)
    .where(and(eq(coursesTable.id, courseId), eq(coursesTable.instructorId, uid))).limit(1);
  return c ?? null;
}
async function ownedLesson(id: number, uid: number) {
  if (!id) return null;
  const [l] = await db.select().from(courseLessonsTable).where(eq(courseLessonsTable.id, id)).limit(1);
  if (!l) return null;
  return (await ownedCourse(l.courseId, uid)) ? l : null;
}
async function ownedExam(id: number, uid: number) {
  if (!id) return null;
  const [x] = await db.select().from(examsTable).where(eq(examsTable.id, id)).limit(1);
  if (!x) return null;
  return (await ownedCourse(x.courseId, uid)) ? x : null;
}
async function refreshLessonCount(courseId: number) {
  const [r] = await db.select({ n: sql<number>`count(*)::int` })
    .from(courseLessonsTable).where(eq(courseLessonsTable.courseId, courseId));
  await db.update(coursesTable).set({ totalLessons: r?.n ?? 0 }).where(eq(coursesTable.id, courseId));
}

// ── Quien soy ────────────────────────────────────────────────────────────────
router.get("/instructor/me", async (req, res) => {
  try {
    const uid = getSessionUserId(req);
    if (!uid) { res.json({ loggedIn: false, isInstructor: false }); return; }
    const [u] = await db.select({ username: usersTable.username, role: usersTable.role })
      .from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    res.json({ loggedIn: !!u, isInstructor: u?.role === "instructor", username: u?.username ?? null });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

// ── Convertirse en profesor (autoservicio, sin aprobacion de admin) ──────────
router.post("/instructor/become", async (req, res) => {
  try {
    const uid = getSessionUserId(req);
    if (!uid) { res.status(401).json({ error: "Inicia sesion de nuevo" }); return; }
    await db.update(usersTable).set({ role: "instructor" }).where(eq(usersTable.id, uid));
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

// ── Cursos ───────────────────────────────────────────────────────────────────
router.get("/instructor/courses", guarded(async (_req, res, me) => {
  const rows = await db.select().from(coursesTable)
    .where(eq(coursesTable.instructorId, me.id)).orderBy(desc(coursesTable.createdAt));
  res.json(rows);
}));

router.post("/instructor/courses", guarded(async (req, res, me) => {
  const b = req.body as Record<string, unknown>;
  const title = sanitizeStr(b.title, 120);
  const description = sanitizeStr(b.description, 2000);
  const level = LEVELS.includes(String(b.level)) ? String(b.level) : "principiante";
  const category = sanitizeStr(b.category, 40) || "general";
  const price = Math.min(Math.max(Number(b.price) || 0, 0), 1000);
  const hours = Math.min(Math.max(Math.floor(Number(b.durationHours) || 0), 0), 500);
  const vid = cleanUrl(b.videoUrl);
  if (title.length < 3) { res.status(400).json({ error: "El titulo debe tener al menos 3 caracteres" }); return; }
  if (!vid.ok) { res.status(400).json({ error: "Enlace de video invalido (debe empezar por http o https)" }); return; }
  const [c] = await db.insert(coursesTable).values({
    title, description, level, category,
    price: String(price), durationHours: hours, videoUrl: vid.value,
    instructor: me.username, instructorId: me.id, published: false, isFree: price === 0,
  }).returning();
  res.status(201).json(c);
}));

router.patch("/instructor/courses/:id", guarded(async (req, res, me) => {
  const c = await ownedCourse(intId(req.params.id), me.id);
  if (!c) { res.status(404).json({ error: "Curso no encontrado" }); return; }
  const b = req.body as Record<string, unknown>;
  const upd: Record<string, unknown> = {};
  if (b.title !== undefined) { const t = sanitizeStr(b.title, 120); if (t.length < 3) { res.status(400).json({ error: "Titulo demasiado corto" }); return; } upd.title = t; }
  if (b.description !== undefined) upd.description = sanitizeStr(b.description, 2000);
  if (b.level !== undefined && LEVELS.includes(String(b.level))) upd.level = String(b.level);
  if (b.category !== undefined) upd.category = sanitizeStr(b.category, 40) || "general";
  if (b.price !== undefined) { const p = Math.min(Math.max(Number(b.price) || 0, 0), 1000); upd.price = String(p); upd.isFree = p === 0; }
  if (b.durationHours !== undefined) upd.durationHours = Math.min(Math.max(Math.floor(Number(b.durationHours) || 0), 0), 500);
  if (b.videoUrl !== undefined) { const v = cleanUrl(b.videoUrl); if (!v.ok) { res.status(400).json({ error: "Enlace de video invalido" }); return; } upd.videoUrl = v.value; }
  if (Object.keys(upd).length === 0) { res.status(400).json({ error: "Nada que actualizar" }); return; }
  const [row] = await db.update(coursesTable).set(upd as never).where(eq(coursesTable.id, c.id)).returning();
  res.json(row);
}));

router.delete("/instructor/courses/:id", guarded(async (req, res, me) => {
  const c = await ownedCourse(intId(req.params.id), me.id);
  if (!c) { res.status(404).json({ error: "Curso no encontrado" }); return; }
  const [en] = await db.select({ n: sql<number>`count(*)::int` })
    .from(courseEnrollmentsTable).where(eq(courseEnrollmentsTable.courseId, c.id));
  if ((en?.n ?? 0) > 0) {
    res.status(409).json({ error: "El curso ya tiene alumnos inscritos; pide al admin que lo archive" }); return;
  }
  const exams = await db.select({ id: examsTable.id }).from(examsTable).where(eq(examsTable.courseId, c.id));
  const examIds = exams.map((x) => x.id);
  if (examIds.length > 0) {
    await db.delete(examAttemptsTable).where(inArray(examAttemptsTable.examId, examIds));
    await db.delete(examQuestionsTable).where(inArray(examQuestionsTable.examId, examIds));
    await db.delete(examsTable).where(inArray(examsTable.id, examIds));
  }
  await db.delete(lessonProgressTable).where(eq(lessonProgressTable.courseId, c.id));
  await db.delete(courseLessonsTable).where(eq(courseLessonsTable.courseId, c.id));
  await db.delete(coursesTable).where(eq(coursesTable.id, c.id));
  res.json({ ok: true });
}));

// ── Lecciones ────────────────────────────────────────────────────────────────
router.get("/instructor/courses/:id/lessons", guarded(async (req, res, me) => {
  const c = await ownedCourse(intId(req.params.id), me.id);
  if (!c) { res.status(404).json({ error: "Curso no encontrado" }); return; }
  const rows = await db.select().from(courseLessonsTable)
    .where(eq(courseLessonsTable.courseId, c.id)).orderBy(asc(courseLessonsTable.order), asc(courseLessonsTable.id));
  res.json(rows);
}));

router.post("/instructor/courses/:id/lessons", guarded(async (req, res, me) => {
  const c = await ownedCourse(intId(req.params.id), me.id);
  if (!c) { res.status(404).json({ error: "Curso no encontrado" }); return; }
  const b = req.body as Record<string, unknown>;
  const title = sanitizeStr(b.title, 150);
  const description = sanitizeStr(b.description, 1000);
  const content = typeof b.content === "string" ? b.content.slice(0, 20000) : "";
  const vid = cleanUrl(b.videoUrl);
  if (title.length < 2) { res.status(400).json({ error: "Falta el titulo de la leccion" }); return; }
  if (!vid.ok) { res.status(400).json({ error: "Enlace invalido (debe empezar por http o https)" }); return; }
  const [mx] = await db.select({ m: sql<number>`coalesce(max(${courseLessonsTable.order}), 0)::int` })
    .from(courseLessonsTable).where(eq(courseLessonsTable.courseId, c.id));
  const [l] = await db.insert(courseLessonsTable).values({
    courseId: c.id,
    order: (mx?.m ?? 0) + 1,
    title, description, content: content || null,
    videoUrl: vid.value,
    videoUrls: vid.value ? JSON.stringify({ es: vid.value }) : null,
    duration: Math.min(Math.max(Math.floor(Number(b.durationMinutes) || 0), 0), 600) * 60,
    isFree: b.isFree === true,
  }).returning();
  await refreshLessonCount(c.id);
  res.status(201).json(l);
}));

router.patch("/instructor/lessons/:id", guarded(async (req, res, me) => {
  const l = await ownedLesson(intId(req.params.id), me.id);
  if (!l) { res.status(404).json({ error: "Leccion no encontrada" }); return; }
  const b = req.body as Record<string, unknown>;
  const upd: Record<string, unknown> = {};
  if (b.title !== undefined) { const t = sanitizeStr(b.title, 150); if (t.length < 2) { res.status(400).json({ error: "Titulo invalido" }); return; } upd.title = t; }
  if (b.description !== undefined) upd.description = sanitizeStr(b.description, 1000);
  if (b.content !== undefined) upd.content = typeof b.content === "string" ? b.content.slice(0, 20000) : null;
  if (b.videoUrl !== undefined) {
    const v = cleanUrl(b.videoUrl);
    if (!v.ok) { res.status(400).json({ error: "Enlace invalido" }); return; }
    upd.videoUrl = v.value;
    upd.videoUrls = v.value ? JSON.stringify({ es: v.value }) : null;
  }
  if (b.durationMinutes !== undefined) upd.duration = Math.min(Math.max(Math.floor(Number(b.durationMinutes) || 0), 0), 600) * 60;
  if (b.isFree !== undefined) upd.isFree = b.isFree === true;
  if (b.order !== undefined) upd.order = Math.max(0, Math.floor(Number(b.order) || 0));
  if (Object.keys(upd).length === 0) { res.status(400).json({ error: "Nada que actualizar" }); return; }
  const [row] = await db.update(courseLessonsTable).set(upd as never).where(eq(courseLessonsTable.id, l.id)).returning();
  res.json(row);
}));

router.delete("/instructor/lessons/:id", guarded(async (req, res, me) => {
  const l = await ownedLesson(intId(req.params.id), me.id);
  if (!l) { res.status(404).json({ error: "Leccion no encontrada" }); return; }
  await db.delete(lessonProgressTable).where(eq(lessonProgressTable.lessonId, l.id));
  await db.delete(courseLessonsTable).where(eq(courseLessonsTable.id, l.id));
  await refreshLessonCount(l.courseId);
  res.json({ ok: true });
}));

// ── Examenes ─────────────────────────────────────────────────────────────────
router.get("/instructor/courses/:id/exams", guarded(async (req, res, me) => {
  const c = await ownedCourse(intId(req.params.id), me.id);
  if (!c) { res.status(404).json({ error: "Curso no encontrado" }); return; }
  const rows = await db.select().from(examsTable).where(eq(examsTable.courseId, c.id)).orderBy(asc(examsTable.id));
  res.json(rows);
}));

router.post("/instructor/courses/:id/exams", guarded(async (req, res, me) => {
  const c = await ownedCourse(intId(req.params.id), me.id);
  if (!c) { res.status(404).json({ error: "Curso no encontrado" }); return; }
  const b = req.body as Record<string, unknown>;
  const title = sanitizeStr(b.title, 150);
  const passScore = Math.min(Math.max(Math.floor(Number(b.passScore) || 60), 1), 100);
  if (title.length < 2) { res.status(400).json({ error: "Falta el titulo del examen" }); return; }
  const [x] = await db.insert(examsTable).values({ courseId: c.id, title, passScore }).returning();
  res.status(201).json(x);
}));

router.delete("/instructor/exams/:id", guarded(async (req, res, me) => {
  const x = await ownedExam(intId(req.params.id), me.id);
  if (!x) { res.status(404).json({ error: "Examen no encontrado" }); return; }
  await db.delete(examAttemptsTable).where(eq(examAttemptsTable.examId, x.id));
  await db.delete(examQuestionsTable).where(eq(examQuestionsTable.examId, x.id));
  await db.delete(examsTable).where(eq(examsTable.id, x.id));
  res.json({ ok: true });
}));

router.get("/instructor/exams/:id/questions", guarded(async (req, res, me) => {
  const x = await ownedExam(intId(req.params.id), me.id);
  if (!x) { res.status(404).json({ error: "Examen no encontrado" }); return; }
  const rows = await db.select().from(examQuestionsTable)
    .where(eq(examQuestionsTable.examId, x.id)).orderBy(asc(examQuestionsTable.position), asc(examQuestionsTable.id));
  res.json(rows.map((q) => {
    let options: string[] = [];
    try { options = JSON.parse(q.options); } catch { options = []; }
    return { id: q.id, question: q.question, options, correctIndex: q.correctIndex };
  }));
}));

router.post("/instructor/exams/:id/questions", guarded(async (req, res, me) => {
  const x = await ownedExam(intId(req.params.id), me.id);
  if (!x) { res.status(404).json({ error: "Examen no encontrado" }); return; }
  const b = req.body as Record<string, unknown>;
  const question = sanitizeStr(b.question, 500);
  const options = Array.isArray(b.options)
    ? b.options.map((o) => sanitizeStr(o, 200)).filter((o) => o.length > 0).slice(0, 6)
    : [];
  const correctIndex = Math.floor(Number(b.correctIndex));
  if (question.length < 3) { res.status(400).json({ error: "Escribe la pregunta" }); return; }
  if (options.length < 2) { res.status(400).json({ error: "Pon al menos 2 opciones" }); return; }
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    res.status(400).json({ error: "Respuesta correcta invalida" }); return;
  }
  const [mx] = await db.select({ m: sql<number>`coalesce(max(${examQuestionsTable.position}), 0)::int` })
    .from(examQuestionsTable).where(eq(examQuestionsTable.examId, x.id));
  const [q] = await db.insert(examQuestionsTable).values({
    examId: x.id, position: (mx?.m ?? 0) + 1, question, options: JSON.stringify(options), correctIndex,
  }).returning();
  res.status(201).json({ id: q.id, question: q.question, options, correctIndex });
}));

router.delete("/instructor/questions/:id", guarded(async (req, res, me) => {
  const qid = intId(req.params.id);
  const [q] = qid ? await db.select().from(examQuestionsTable).where(eq(examQuestionsTable.id, qid)).limit(1) : [];
  if (!q || !(await ownedExam(q.examId, me.id))) { res.status(404).json({ error: "Pregunta no encontrada" }); return; }
  await db.delete(examQuestionsTable).where(eq(examQuestionsTable.id, q.id));
  res.json({ ok: true });
}));

export default router;
