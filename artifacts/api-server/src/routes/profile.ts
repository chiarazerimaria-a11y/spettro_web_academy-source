import { Router, type IRouter } from "express";
import {
  db, usersTable, labMachinesTable, flagSubmissionsTable,
  certificationsTable, userVpnSessionsTable,
} from "@workspace/db";
import { eq, gt, sql, desc } from "drizzle-orm";
import { safeInt } from "../middleware/sanitize";
import { buildProfileStats } from "../profileStats";

const router: IRouter = Router();

// GET /api/profile/:userId/stats
// Estadisticas publicas del perfil (no incluye flags ni datos privados).
router.get("/profile/:userId/stats", async (req, res) => {
  try {
    const userId = safeInt(req.params.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(400).json({ error: "userId inválido" });

    const [user] = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        totalPoints: usersTable.totalPoints,
        machinesSolved: usersTable.machinesSolved,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const [machines, submissions, certifications, sessions, ahead] = await Promise.all([
      db.select({
        slug: labMachinesTable.slug,
        name: labMachinesTable.name,
        os: labMachinesTable.os,
        difficulty: labMachinesTable.difficulty,
        points: labMachinesTable.points,
        vulnerability: labMachinesTable.vulnerability,
        techniques: labMachinesTable.techniques,
        isActive: labMachinesTable.isActive,
      }).from(labMachinesTable),
      db.select({
        machineSlug: flagSubmissionsTable.machineSlug,
        flagType: flagSubmissionsTable.flagType,
        isCorrect: flagSubmissionsTable.isCorrect,
        submittedAt: flagSubmissionsTable.submittedAt,
      }).from(flagSubmissionsTable)
        .where(eq(flagSubmissionsTable.userId, userId))
        .orderBy(desc(flagSubmissionsTable.submittedAt)),
      db.select({
        id: certificationsTable.id,
        code: certificationsTable.code,
        name: certificationsTable.name,
        level: certificationsTable.level,
        pointsNeeded: certificationsTable.pointsNeeded,
        machinesNeeded: certificationsTable.machinesNeeded,
        badgeColor: certificationsTable.badgeColor,
      }).from(certificationsTable)
        .where(eq(certificationsTable.isActive, true))
        .orderBy(certificationsTable.pointsNeeded),
      db.select({
        machineSlug: userVpnSessionsTable.machineSlug,
        spawnedAt: userVpnSessionsTable.spawnedAt,
      }).from(userVpnSessionsTable)
        .where(eq(userVpnSessionsTable.userId, userId)),
      db.select({ c: sql<number>`count(*)` })
        .from(usersTable)
        .where(gt(usersTable.totalPoints, user.totalPoints)),
    ]);

    res.json(buildProfileStats({
      user, machines, submissions, certifications, sessions,
      usersAhead: Number(ahead[0]?.c ?? 0),
    }));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
