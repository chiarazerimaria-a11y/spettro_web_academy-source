import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { sanitizeStr, isValidEmail, isValidUsername, rateLimit, sanitizeAvatarUrl } from "../middleware/sanitize";

const router = Router();

const loginLimit    = rateLimit(10, 60_000);
const registerLimit = rateLimit(5,  60_000);
const profileLimit  = rateLimit(20, 60_000);

// POST /api/auth/register
router.post("/auth/register", registerLimit, async (req, res) => {
  const raw = req.body as Record<string, unknown>;

  const username   = sanitizeStr(raw.username,   30);
  const email      = sanitizeStr(raw.email,      254).toLowerCase().trim();
  const password   = typeof raw.password === "string" ? raw.password.slice(0, 200) : "";
  const avatarType = sanitizeStr(raw.avatarType, 20) || "ghost";

  if (!username || !email || !password) {
    res.status(400).json({ error: "Faltan campos requeridos" }); return;
  }
  if (!isValidUsername(username)) {
    res.status(400).json({ error: "Usuario inválido: 3-30 caracteres, letras, números, _ o -" }); return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Formato de email inválido" }); return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" }); return;
  }

  try {
    const existEmail = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existEmail.length > 0) { res.status(409).json({ error: "El email ya está registrado" }); return; }

    const existUser = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existUser.length > 0) { res.status(409).json({ error: "El nombre de usuario ya existe" }); return; }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({
      username,
      email,
      passwordHash,
      avatarType,
    }).returning({
      id: usersTable.id, username: usersTable.username, email: usersTable.email,
      avatarType: usersTable.avatarType, avatarUrl: usersTable.avatarUrl, rank: usersTable.rank,
      totalPoints: usersTable.totalPoints, machinesSolved: usersTable.machinesSolved,
      createdAt: usersTable.createdAt,
    });

    // Create wallet for new user
    const { spettroWalletsTable } = await import("@workspace/db");
    await db.insert(spettroWalletsTable).values({
      userId: user.id, balance: 100, totalEarned: 100, totalSpent: 0,
    }).onConflictDoNothing();
    try { await db.execute(sql`UPDATE spettro_wallets SET balance_free = 100 WHERE user_id = ${user.id}`); } catch {}
    res.cookie("spettro_uid", String(user.id), {
      maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax", path: "/",
    });

    res.status(201).json({ user });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/auth/login
router.post("/auth/login", loginLimit, async (req, res) => {
  const raw = req.body as Record<string, unknown>;
  const email    = sanitizeStr(raw.email,    254).toLowerCase().trim();
  const password = typeof raw.password === "string" ? raw.password.slice(0, 200) : "";

  if (!email || !password) { res.status(400).json({ error: "Faltan campos" }); return; }
  if (!isValidEmail(email)) { res.status(400).json({ error: "Email inválido" }); return; }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    // Constant-time comparison even when user not found (prevent timing attacks)
    const dummyHash = "$2a$12$dummy.hash.to.prevent.timing.attack.padding000";
    const valid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !valid) { res.status(401).json({ error: "Credenciales incorrectas" }); return; }
    const { passwordHash: _ph, ...safeUser } = user;
    res.cookie("spettro_uid", String(user.id), {
      maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax", path: "/",
    });
    res.json({ user: safeUser });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


// POST /api/auth/logout — borra la cookie de sesion
router.post("/auth/logout", (req, res) => {
  res.clearCookie("spettro_uid", { path: "/" });
  res.json({ ok: true });
});

// PATCH /api/auth/profile
router.patch("/auth/profile", profileLimit, async (req, res) => {
  const raw = req.body as Record<string, unknown>;
  const id        = parseInt(String(raw.id), 10);
  const username  = sanitizeStr(raw.username, 30) || undefined;
  const avatarUrl = raw.avatarUrl !== undefined
    ? sanitizeAvatarUrl(raw.avatarUrl)
    : undefined;

  if (!id || isNaN(id) || id <= 0) { res.status(400).json({ error: "Falta el id de usuario" }); return; }
  if (username !== undefined && !isValidUsername(username)) {
    res.status(400).json({ error: "Usuario inválido: 3-30 caracteres, letras, números, _ o -" }); return;
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (username) updateData.username = username;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "Nada que actualizar" }); return;
    }

    const [updated] = await db.update(usersTable)
      .set(updateData as never)
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id, username: usersTable.username, email: usersTable.email,
        avatarType: usersTable.avatarType, avatarUrl: usersTable.avatarUrl, rank: usersTable.rank,
        totalPoints: usersTable.totalPoints, machinesSolved: usersTable.machinesSolved,
      });

    if (!updated) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
    res.json({ user: updated });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505") { res.status(409).json({ error: "Ese nombre de usuario ya existe" }); return; }
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
