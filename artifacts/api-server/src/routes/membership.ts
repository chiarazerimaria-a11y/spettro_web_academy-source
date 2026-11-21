import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { adminGuard } from "../middleware/adminGuard";
import { sanitizeStr, safeInt } from "../middleware/sanitize";
import { getSessionUserId } from "../middleware/requireUser";

const router = Router();

// Precios en GHC por 30 dias. Cambialos aqui.
const PLANS: Record<string, { label: string; price: number; rank: number; bonus: number }> = {
  hacker: { label: "HACKER", price: 100, rank: 1, bonus: 100 },
  elite:  { label: "ELITE",  price: 250, rank: 2, bonus: 300 },
};
const PERIOD_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

// Sin fecha de fin = permanente (cuentas de la administracion). Con fecha vencida = libre.
function effectiveTier(tier: string, expires: Date | null): string {
  if (tier === "libre") return "libre";
  if (expires && expires.getTime() < Date.now()) return "libre";
  return tier;
}

// GET /api/auth/me — usuario real segun la cookie firmada
router.get("/auth/me", async (req, res) => {
  try {
    const id = getSessionUserId(req);
    if (!id) return res.status(401).json({ error: "Sin sesión" });
    const [u] = await db.select({
      id: usersTable.id, username: usersTable.username, email: usersTable.email,
      avatarType: usersTable.avatarType, avatarUrl: usersTable.avatarUrl, rank: usersTable.rank,
      totalPoints: usersTable.totalPoints, machinesSolved: usersTable.machinesSolved,
      subscriptionTier: usersTable.subscriptionTier, subscriptionExpiresAt: usersTable.subscriptionExpiresAt,
    }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!u) return res.status(401).json({ error: "Sin sesión" });
    res.json({ user: { ...u, subscriptionTier: effectiveTier(u.subscriptionTier, u.subscriptionExpiresAt) } });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/subscription/buy — paga con GHC, el usuario sale de la cookie firmada
router.post("/subscription/buy", async (req, res) => {
  // La suscripcion se paga con SPC (pendiente). El pago con GHC queda apagado salvo ALLOW_GHC_SUBSCRIPTION=1.
  if (process.env["ALLOW_GHC_SUBSCRIPTION"] !== "1") return res.status(410).json({ error: "La suscripción se paga con SPC. Próximamente." });
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: "Inicia sesión de nuevo", code: "LOGIN_REQUIRED" });
    const planKey = sanitizeStr((req.body as Record<string, unknown>).plan, 20).toLowerCase();
    const plan = PLANS[planKey];
    if (!plan) return res.status(400).json({ error: "Plan inválido" });

    const out = await db.transaction(async (tx) => {
      const lock = await tx.execute(sql`SELECT subscription_tier, subscription_expires_at FROM users WHERE id = ${userId} FOR UPDATE`);
      const row = lock.rows[0] as { subscription_tier: string; subscription_expires_at: Date | string | null } | undefined;
      if (!row) throw new Error("NO_USER");
      const exp = row.subscription_expires_at ? new Date(row.subscription_expires_at) : null;
      const current = effectiveTier(row.subscription_tier, exp);
      if (current !== "libre" && !exp) throw new Error("PLAN_PERMANENTE");
      if ((PLANS[current]?.rank ?? 0) > plan.rank) throw new Error("PLAN_SUPERIOR");

      const now = Date.now();
      const base = current === planKey && exp && exp.getTime() > now ? exp.getTime() : now;
      const newExp = new Date(base + PERIOD_DAYS * DAY);

      const r = await tx.execute(sql`
        UPDATE spettro_wallets SET ghc_balance = ghc_balance - ${plan.price}, updated_at = now()
        WHERE user_id = ${userId} AND ghc_balance >= ${plan.price} RETURNING ghc_balance`);
      if (r.rows.length === 0) throw new Error("GHC_INSUFICIENTE");
      await tx.execute(sql`INSERT INTO ghc_transactions (user_id, amount, description) VALUES (${userId}, ${-plan.price}, ${"Suscripción " + plan.label})`);
      await tx.execute(sql`UPDATE users SET subscription_tier = ${planKey}, subscription_expires_at = ${newExp.toISOString()} WHERE id = ${userId}`);
      return { tier: planKey, expiresAt: newExp.toISOString(), balance: Number((r.rows[0] as { ghc_balance: number }).ghc_balance) };
    });
    res.json({ ok: true, ...out });
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "GHC_INSUFICIENTE") return res.status(402).json({ error: "No tienes GHC suficientes", code: "INSUFFICIENT_GHC" });
    if (m === "PLAN_SUPERIOR") return res.status(400).json({ error: "Ya tienes un plan superior activo" });
    if (m === "PLAN_PERMANENTE") return res.status(400).json({ error: "Tu plan no caduca, no necesitas comprarlo" });
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/admin/subscription/grant — regalar dias de suscripcion sin gastar GHC
router.post("/admin/subscription/grant", adminGuard, async (req, res) => {
  try {
    const raw = req.body as Record<string, unknown>;
    const planKey = sanitizeStr(raw.plan, 20).toLowerCase();
    if (planKey !== "libre" && !PLANS[planKey]) return res.status(400).json({ error: "Plan inválido" });
    const days = safeInt(raw.days, 30, 1, 3650);
    let userId = safeInt(raw.userId, 0, 1, 1_000_000);
    if (!userId) {
      const username = sanitizeStr(raw.username, 30);
      if (username) {
        const [u] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username)).limit(1);
        userId = u?.id ?? 0;
      }
    }
    if (!userId) return res.status(400).json({ error: "Indica userId o username" });

    const lock = await db.execute(sql`SELECT subscription_tier, subscription_expires_at FROM users WHERE id = ${userId}`);
    const row = lock.rows[0] as { subscription_tier: string; subscription_expires_at: Date | string | null } | undefined;
    if (!row) return res.status(404).json({ error: "Usuario no encontrado" });

    if (planKey === "libre") {
      await db.execute(sql`UPDATE users SET subscription_tier = 'libre', subscription_expires_at = NULL WHERE id = ${userId}`);
      return res.json({ ok: true, userId, tier: "libre" });
    }
    const exp = row.subscription_expires_at ? new Date(row.subscription_expires_at) : null;
    const now = Date.now();
    const base = row.subscription_tier === planKey && exp && exp.getTime() > now ? exp.getTime() : now;
    const newExp = new Date(base + days * DAY);
    // Bonus en GHC (moneda libre) por 30 dias. "bonus" en el cuerpo lo fija a mano (0 = sin bonus).
    const bonus = raw.bonus !== undefined
      ? safeInt(raw.bonus, 0, 0, 1_000_000)
      : Math.floor(PLANS[planKey].bonus * days / PERIOD_DAYS);
    await db.transaction(async (tx) => {
      await tx.execute(sql`UPDATE users SET subscription_tier = ${planKey}, subscription_expires_at = ${newExp.toISOString()} WHERE id = ${userId}`);
      if (bonus > 0) {
        await tx.execute(sql`INSERT INTO spettro_wallets (user_id, balance, total_earned, total_spent) VALUES (${userId}, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING`);
        await tx.execute(sql`UPDATE spettro_wallets SET ghc_balance = ghc_balance + ${bonus}, updated_at = now() WHERE user_id = ${userId}`);
        await tx.execute(sql`INSERT INTO ghc_transactions (user_id, amount, description) VALUES (${userId}, ${bonus}, ${"Bonus suscripción " + PLANS[planKey].label})`);
      }
    });
    res.json({ ok: true, userId, tier: planKey, expiresAt: newExp.toISOString(), bonusGhc: bonus });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/access/me — que boton flotante le toca al usuario (siempre desde la base de datos)
router.get("/access/me", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const id = getSessionUserId(req);
    const none = { loggedIn: false, isInstructor: false, tier: "libre", hasAccess: false };
    if (!id) return res.json(none);
    const [u] = await db.select({
      role: usersTable.role, tier: usersTable.subscriptionTier, exp: usersTable.subscriptionExpiresAt,
    }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!u) return res.json(none);
    const tier = effectiveTier(u.tier, u.exp);
    res.json({ loggedIn: true, isInstructor: u.role === "instructor", tier, hasAccess: tier !== "libre" });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Cuando el admin confirma una solicitud de suscripcion, el plan pasa de verdad al usuario.
const ACTIVE_STATES = ["active", "activo", "activa", "confirmado", "confirmada", "aprobado", "aprobada", "pagado", "paid"];
export async function syncSubscriberToUser(s: { email: string; plan: string; status: string; notes: string | null }) {
  if (!ACTIVE_STATES.includes(String(s.status).toLowerCase())) return;
  const planText = String(s.plan).toLowerCase();
  const planKey = planText.includes("elite") ? "elite" : planText.includes("hacker") ? "hacker" : null;
  if (!planKey) return;
  const r = await db.execute(sql`SELECT id, subscription_tier AS tier, subscription_expires_at AS exp FROM users WHERE lower(email) = lower(${s.email}) LIMIT 1`);
  const u = r.rows[0] as { id: number; tier: string; exp: Date | string | null } | undefined;
  if (!u) return;
  const exp = u.exp ? new Date(u.exp) : null;
  const current = effectiveTier(u.tier, exp);
  if (current !== "libre" && !exp) return;                              // plan permanente
  if ((PLANS[current]?.rank ?? 0) > PLANS[planKey].rank) return;        // ya tiene uno superior
  if (current === planKey) return;                                      // ya activo: para renovar usa "grant"
  const days = /anual/i.test(s.notes ?? "") ? 365 : PERIOD_DAYS;
  const newExp = new Date(Date.now() + days * DAY);
  await db.execute(sql`UPDATE users SET subscription_tier = ${planKey}, subscription_expires_at = ${newExp.toISOString()} WHERE id = ${u.id}`);
}

export default router;
