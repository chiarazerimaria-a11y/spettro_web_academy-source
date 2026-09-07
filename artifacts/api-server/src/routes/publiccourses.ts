import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable, courseEnrollmentsTable, spettroWalletsTable, spettroTransactionsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const SEED_COURSES = [
  {
    title: "Pentesting Desde Cero: eJPTv2",
    description: "El curso más completo en español para preparar la certificación eJPTv2. De cero a comprometer tu primera máquina real con guía paso a paso.",
    level: "principiante", category: "certificacion", instructor: "R3dD3vil",
    durationHours: 42, totalLessons: 85, price: "97.00", isFree: false, isPremium: false,
    enrolledCount: 1240, rating: 4.9, spcReward: 150, published: true,
  },
  {
    title: "Linux para Hackers: Domina la Terminal",
    description: "Todo lo que necesitas saber de Linux para hacking: bash scripting, procesos, permisos, redes y automatización de ataques. Acceso gratuito para todos.",
    level: "principiante", category: "fundamentos", instructor: "Ph4ntom",
    durationHours: 12, totalLessons: 24, price: "0.00", isFree: true, isPremium: false,
    enrolledCount: 3800, rating: 4.8, spcReward: 80, published: true,
  },
  {
    title: "Introducción al Hacking Ético",
    description: "Aprende los conceptos básicos del hacking ético, metodología y primeras herramientas. Curso gratuito de introducción a la ciberseguridad ofensiva.",
    level: "principiante", category: "fundamentos", instructor: "SpettroWeb",
    durationHours: 8, totalLessons: 16, price: "0.00", isFree: true, isPremium: false,
    enrolledCount: 5200, rating: 4.7, spcReward: 60, published: true,
  },
  {
    title: "Hacking Web Avanzado: OWASP Top 10",
    description: "Explota las 10 vulnerabilidades web más críticas: SQL Injection, XSS, SSRF, XXE, deserialization y más. Con laboratorios reales en entorno controlado.",
    level: "intermedio", category: "web", instructor: "Cyph3rX",
    durationHours: 28, totalLessons: 56, price: "79.00", isFree: false, isPremium: false,
    enrolledCount: 890, rating: 4.8, spcReward: 200, published: true,
  },
  {
    title: "Active Directory: Red Team Completo",
    description: "Aprende a comprometer entornos Windows corporativos. BloodHound, Mimikatz, Pass-the-Hash, Kerberoasting y lateral movement. Solo para suscriptores Elite.",
    level: "avanzado", category: "windows", instructor: "N1ghtCrawl3r",
    durationHours: 35, totalLessons: 70, price: "119.00", isFree: false, isPremium: true,
    enrolledCount: 340, rating: 5.0, spcReward: 400, published: true,
  },
  {
    title: "Bug Bounty Hunting Profesional",
    description: "Encuentra vulnerabilidades en programas reales, reporta correctamente y aprende a monetizar tus hallazgos éticos. Metodología Hunter profesional.",
    level: "intermedio", category: "bug_bounty", instructor: "H4ck3rQueen",
    durationHours: 22, totalLessons: 44, price: "89.00", isFree: false, isPremium: false,
    enrolledCount: 620, rating: 4.9, spcReward: 250, published: true,
  },
  {
    title: "Reversing & Malware Analysis",
    description: "Desmonta binarios, analiza malware real y aprende a programar shellcodes. Ghidra, radare2 y x64dbg desde cero. Contenido exclusivo Elite.",
    level: "experto", category: "reversing", instructor: "B1n4ryGh0st",
    durationHours: 30, totalLessons: 60, price: "129.00", isFree: false, isPremium: true,
    enrolledCount: 180, rating: 5.0, spcReward: 500, published: true,
  },
  {
    title: "Redes y Protocolos para Hackers",
    description: "TCP/IP, ARP spoofing, Man-in-the-Middle, sniffing de tráfico y ataques a infraestructura de red. El curso gratuito de redes más completo en español.",
    level: "principiante", category: "redes", instructor: "N3tW4rri0r",
    durationHours: 14, totalLessons: 28, price: "0.00", isFree: true, isPremium: false,
    enrolledCount: 2900, rating: 4.6, spcReward: 90, published: true,
  },
];

// GET /api/public/courses
router.get("/public/courses", async (req, res) => {
  try {
    let courses = await db.select().from(coursesTable)
      .where(eq(coursesTable.published, true))
      .orderBy(desc(coursesTable.enrolledCount));

    if (courses.length === 0) {
      const seeded = await db.insert(coursesTable).values(SEED_COURSES).returning();
      courses = seeded;
    }
    res.json(courses);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error fetching courses" });
  }
});

// GET /api/public/courses/:id
router.get("/public/courses/:id", async (req, res) => {
  try {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, parseInt(req.params.id)));
    if (!course) return res.status(404).json({ error: "Curso no encontrado" });
    res.json(course);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// POST /api/public/courses/:id/enroll — enroll a user
router.post("/public/courses/:id/enroll", async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { userId } = req.body as { userId: number };
    if (!userId) return res.status(400).json({ error: "userId requerido" });

    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
    if (!course) return res.status(404).json({ error: "Curso no encontrado" });

    const [existing] = await db.select().from(courseEnrollmentsTable)
      .where(and(eq(courseEnrollmentsTable.userId, userId), eq(courseEnrollmentsTable.courseId, courseId)));
    if (existing) return res.json({ enrollment: existing, alreadyEnrolled: true });

    const [enrollment] = await db.insert(courseEnrollmentsTable).values({ userId, courseId }).returning();

    // Increment enrolled count
    await db.update(coursesTable).set({ enrolledCount: course.enrolledCount + 1 }).where(eq(coursesTable.id, courseId));

    // Give welcome SPC if free course
    if (course.isFree) {
      const [wallet] = await db.select().from(spettroWalletsTable).where(eq(spettroWalletsTable.userId, userId));
      const currentBalance = wallet?.balance ?? 0;
      const currentEarned = wallet?.totalEarned ?? 0;
      const bonus = Math.floor(course.spcReward * 0.2);
      if (wallet) {
        await db.update(spettroWalletsTable).set({
          balance: currentBalance + bonus, totalEarned: currentEarned + bonus, updatedAt: new Date(),
        }).where(eq(spettroWalletsTable.userId, userId));
      } else {
        await db.insert(spettroWalletsTable).values({ userId, balance: bonus + 50, totalEarned: bonus + 50 });
      }
      await db.insert(spettroTransactionsTable).values({
        userId, amount: bonus, type: "earned", description: `Inscripción: ${course.title}`, referenceId: `course_${courseId}`,
      });
    }

    res.status(201).json({ enrollment, alreadyEnrolled: false });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al inscribirse" });
  }
});

// GET /api/public/courses/enrollments/:userId
router.get("/public/enrollments/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const enrollments = await db.select().from(courseEnrollmentsTable)
      .where(eq(courseEnrollmentsTable.userId, userId));
    res.json(enrollments);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

export default router;
