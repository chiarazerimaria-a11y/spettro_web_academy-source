import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { coursesTable, courseEnrollmentsTable } from "@workspace/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSessionUserId } from "./requireUser";

function lock(res: Response): void {
  res.setHeader("X-Premium-Locked", "1");
  res.json([]);
}

// Quién ve las lecciones de un curso:
//  - Curso de un profesor externo: gratis y publicado -> todos; de pago -> su profesor o un alumno matriculado
//    (la suscripción NO desbloquea cursos de profesores externos); sin publicar -> solo su profesor.
//  - Curso del admin / plataforma: los premium solo con plan activo (cookie firmada + fecha vigente).
export async function premiumLessonsGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = parseInt(String(req.params["id"]), 10);
    if (!courseId) { next(); return; }
    const [c] = await db.select({
      isPremium: coursesTable.isPremium,
      instructorId: coursesTable.instructorId,
      price: coursesTable.price,
      isFree: coursesTable.isFree,
      published: coursesTable.published,
    }).from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!c) { next(); return; }

    const uid = getSessionUserId(req);

    // 1) Curso de un profesor externo
    if (c.instructorId != null) {
      if (uid && uid === c.instructorId) { next(); return; }          // el propio profesor
      if (!c.published) { lock(res); return; }                        // borrador: solo su profesor
      const paid = Number(c.price) > 0 && !c.isFree;
      if (!paid) { next(); return; }                                  // gratuito y publicado
      if (!uid) { lock(res); return; }
      const [enr] = await db.select({ id: courseEnrollmentsTable.id }).from(courseEnrollmentsTable)
        .where(and(eq(courseEnrollmentsTable.userId, uid), eq(courseEnrollmentsTable.courseId, courseId))).limit(1);
      if (enr) { next(); return; }
      lock(res); return;
    }

    // 2) Curso del admin / plataforma (como antes)
    if (!c.isPremium) { next(); return; }
    let ok = false;
    if (uid) {
      const r = await db.execute(sql`SELECT subscription_tier, subscription_expires_at FROM users WHERE id = ${uid}`);
      const row = r.rows[0] as { subscription_tier: string; subscription_expires_at: Date | string | null } | undefined;
      if (row && row.subscription_tier !== "libre") {
        const exp = row.subscription_expires_at ? new Date(row.subscription_expires_at) : null;
        ok = !exp || exp.getTime() > Date.now();
      }
    }
    if (ok) { next(); return; }
    lock(res);
  } catch (e) {
    next(e);
  }
}
