import { Router } from "express";
import { db, subscribersTable, paymentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

async function ensureNotifTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id serial PRIMARY KEY,
      email text NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      is_read boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function notifyEmail(email: string, title: string, message: string) {
  await ensureNotifTable();
  await db.execute(sql`
    INSERT INTO user_notifications (email, title, message)
    VALUES (${email.trim().toLowerCase()}, ${title}, ${message})
  `);
}

// GET /api/notifications?email=... — avisos del usuario
router.get("/notifications", async (req, res) => {
  const email = String(req.query.email ?? "").trim().toLowerCase();
  if (!email) { res.status(400).json({ error: "Falta email" }); return; }
  await ensureNotifTable();
  const r = await db.execute(sql`
    SELECT id, title, message, is_read AS "isRead", created_at AS "createdAt"
    FROM user_notifications WHERE email = ${email} ORDER BY created_at DESC LIMIT 30
  `);
  res.json({ notifications: r.rows, unread: r.rows.filter((n: any) => !n.isRead).length });
});

// POST /api/notifications/read — marcar todas como leídas
router.post("/notifications/read", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email) { res.status(400).json({ error: "Falta email" }); return; }
  await ensureNotifTable();
  await db.execute(sql`UPDATE user_notifications SET is_read = true WHERE email = ${email}`);
  res.json({ ok: true });
});


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

    try {
      await notifyEmail(
        email,
        "Solicitud de suscripción recibida",
        `Tu suscripción al plan ${planLabel} está pendiente de confirmación. Te avisaremos en cuanto se active.`,
      );
    } catch (e) { req.log.error(e); }

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
