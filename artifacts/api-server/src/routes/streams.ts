import { Router } from "express";
import { db } from "@workspace/db";
import { liveStreamsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /api/streams
router.get("/streams", async (req, res) => {
  try {
    const streams = await db.select().from(liveStreamsTable).orderBy(desc(liveStreamsTable.scheduledAt));
    res.json(streams);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error fetching streams" });
  }
});

// POST /api/streams (admin)
router.post("/streams", async (req, res) => {
  try {
    const { title, instructor, description, scheduledAt, durationMinutes, maxParticipants, type, priceEur, roomUrl } = req.body;
    if (!title || !instructor) return res.status(400).json({ error: "Faltan campos obligatorios" });
    const [stream] = await db.insert(liveStreamsTable).values({
      title, instructor, description: description || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      durationMinutes: durationMinutes || 60,
      maxParticipants: maxParticipants || 10,
      type: type || "personalizado",
      priceEur: priceEur || "0",
      roomUrl: roomUrl || null,
      status: "programado",
    }).returning();
    res.status(201).json(stream);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error creating stream" });
  }
});

// PATCH /api/streams/:id
router.patch("/streams/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db.update(liveStreamsTable).set(req.body)
      .where(eq(liveStreamsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Stream not found" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error updating stream" });
  }
});

// POST /api/streams/:id/join
router.post("/streams/:id/join", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [stream] = await db.select().from(liveStreamsTable).where(eq(liveStreamsTable.id, id));
    if (!stream) return res.status(404).json({ error: "Stream not found" });
    if (stream.currentParticipants >= stream.maxParticipants) {
      return res.status(400).json({ error: "Sesión completa" });
    }
    const [updated] = await db.update(liveStreamsTable)
      .set({ currentParticipants: stream.currentParticipants + 1 })
      .where(eq(liveStreamsTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error joining stream" });
  }
});

// DELETE /api/streams/:id
router.delete("/streams/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(liveStreamsTable).where(eq(liveStreamsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error deleting stream" });
  }
});

export default router;
