import { Router } from "express";
import { db } from "@workspace/db";
import { instructorPayoutsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /api/payouts
router.get("/payouts", async (req, res) => {
  try {
    const payouts = await db.select().from(instructorPayoutsTable).orderBy(desc(instructorPayoutsTable.createdAt));
    res.json(payouts);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error fetching payouts" });
  }
});

// POST /api/payouts
router.post("/payouts", async (req, res) => {
  try {
    const { instructorName, instructorEmail, iban, paypal, courseTitle, grossAmount, commissionRate = "30" } = req.body;
    if (!instructorName || !instructorEmail || !courseTitle || !grossAmount) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const gross = parseFloat(grossAmount);
    const commission = parseFloat(commissionRate);
    const net = gross * (1 - commission / 100);
    const [payout] = await db.insert(instructorPayoutsTable).values({
      instructorName, instructorEmail, iban: iban || null, paypal: paypal || null,
      courseTitle, grossAmount: gross.toFixed(2), commissionRate: commission.toFixed(2),
      netAmount: net.toFixed(2), status: "pendiente",
    }).returning();
    res.status(201).json(payout);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error creating payout" });
  }
});

// PATCH /api/payouts/:id
router.patch("/payouts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, reference, notes } = req.body;
    const updateData: any = { status };
    if (reference) updateData.reference = reference;
    if (notes) updateData.notes = notes;
    if (status === "pagado") updateData.paidAt = new Date();
    const [updated] = await db.update(instructorPayoutsTable).set(updateData)
      .where(eq(instructorPayoutsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Payout not found" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error updating payout" });
  }
});

// DELETE /api/payouts/:id
router.delete("/payouts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(instructorPayoutsTable).where(eq(instructorPayoutsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error deleting payout" });
  }
});

export default router;
