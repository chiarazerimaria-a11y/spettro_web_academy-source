import { Router } from "express";
import { db } from "@workspace/db";
import { tutoringSessionsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router = Router();

// GET /api/tutoring — lista todas las tutorías
router.get("/tutoring", async (req, res) => {
  try {
    const sessions = await db
      .select()
      .from(tutoringSessionsTable)
      .orderBy(desc(tutoringSessionsTable.id));
    res.json(sessions);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error fetching tutoring sessions" });
  }
});

// GET /api/tutoring/:id — una tutoría específica
router.get("/tutoring/:id", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(tutoringSessionsTable)
      .where(eq(tutoringSessionsTable.id, parseInt(req.params.id)));
    if (!session) return res.status(404).json({ error: "Tutoría no encontrada" });
    res.json(session);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

import { eq } from "drizzle-orm";
export default router;
