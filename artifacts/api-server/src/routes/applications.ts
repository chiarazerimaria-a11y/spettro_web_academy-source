import { Router } from "express";
import { db, applicationsTable } from "@workspace/db";

const router = Router();

// POST /api/applications
router.post("/applications", async (req, res) => {
  const { name, email, role, experience, links, message, payoutIban, payoutPaypal } = req.body as Record<string, string>;
  if (!name || !email || !role || !experience || !message) {
    res.status(400).json({ error: "Faltan campos requeridos" });
    return;
  }
  try {
    const [app] = await db.insert(applicationsTable).values({
      name, email, role, experience, links: links || null, message,
      payoutIban: payoutIban || null, payoutPaypal: payoutPaypal || null,
    }).returning();
    res.status(201).json(app);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
