import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { coursesTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSessionUserId } from "./requireUser";

// Cursos premium: las lecciones solo salen si hay plan activo (cookie firmada + fecha vigente).
export async function premiumLessonsGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = parseInt(String(req.params["id"]), 10);
    if (!courseId) { next(); return; }
    const [c] = await db.select({ isPremium: coursesTable.isPremium }).from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!c?.isPremium) { next(); return; }

    let ok = false;
    const uid = getSessionUserId(req);
    if (uid) {
      const r = await db.execute(sql`SELECT subscription_tier, subscription_expires_at FROM users WHERE id = ${uid}`);
      const row = r.rows[0] as { subscription_tier: string; subscription_expires_at: Date | string | null } | undefined;
      if (row && row.subscription_tier !== "libre") {
        const exp = row.subscription_expires_at ? new Date(row.subscription_expires_at) : null;
        ok = !exp || exp.getTime() > Date.now();
      }
    }
    if (ok) { next(); return; }
    res.setHeader("X-Premium-Locked", "1");
    res.json([]);
  } catch (e) {
    next(e);
  }
}
