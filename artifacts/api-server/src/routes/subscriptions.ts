import { Router } from "express";
import { db, subscribersTable, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// POST /api/subscriptions — user self-subscribe request
router.post("/subscriptions", async (req, res) => {
  const { name, email, plan, method, reference, amount, billing } = req.body as {
    name: string;
    email: string;
    plan: string;
    method: string;
    reference?: string;
    amount: number;
    billing: "monthly" | "annual";
  };

  if (!name?.trim() || !email?.trim() || !plan) {
    res.status(400).json({ error: "Faltan campos requeridos" });
    return;
  }

  try {
    const planLabels: Record<string, string> = {
      rookie: "ROOKIE (Gratuito)",
      hacker: "HACKER",
      elite: "ELITE",
    };
    const planLabel = planLabels[plan] || plan;
    const notes = `Plan: ${planLabel} | Facturación: ${billing === "annual" ? "Anual" : "Mensual"} | Método: ${method}`;

    // Upsert subscriber
    const existing = await db.select({ id: subscribersTable.id })
      .from(subscribersTable)
      .where(eq(subscribersTable.email, email.trim().toLowerCase()))
      .limit(1);

    let subscriberId: number;

    if (existing.length > 0) {
      subscriberId = existing[0].id;
      await db.update(subscribersTable)
        .set({ plan: planLabel, notes, status: "pendiente" })
        .where(eq(subscribersTable.id, subscriberId));
    } else {
      const [sub] = await db.insert(subscribersTable).values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        plan: planLabel,
        status: "pendiente",
        notes,
      }).returning({ id: subscribersTable.id });
      subscriberId = sub.id;
    }

    // Register payment
    await db.insert(paymentsTable).values({
      subscriberId,
      subscriberName: name.trim(),
      amount: amount.toFixed(2),
      method,
      status: "pendiente",
      reference: reference?.trim() || "sin-referencia",
    });

    res.status(201).json({
      message: "Solicitud registrada. Te contactaremos en menos de 24h.",
      subscriberId,
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
