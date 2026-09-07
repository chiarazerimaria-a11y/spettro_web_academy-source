import { Router } from "express";
import { db } from "@workspace/db";
import {
  squadsTable, ctfBattlesTable, ctfMissionsTable, battleMessagesTable,
  spettroWalletsTable, spettroTransactionsTable, usersTable,
} from "@workspace/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { sanitizeStr, sanitizeOptional, safeInt } from "../middleware/sanitize";

const router = Router();

// ── AI difficulty → minutes to capture flag ────────────────────────────────
const AI_TIMING: Record<string, number> = {
  facil:   90,
  medio:   50,
  dificil: 30,
  insano:  15,
};
const ALLOWED_AI_DIFFICULTY = new Set(["facil", "medio", "dificil", "insano"]);

function computeBotProgress(startedAt: string | null, aiDifficulty: string | null): number {
  if (!startedAt || !aiDifficulty) return 0;
  const elapsedMin = (Date.now() - new Date(startedAt).getTime()) / 60000;
  const totalMin = AI_TIMING[aiDifficulty] ?? 60;
  return Math.min(100, (elapsedMin / totalMin) * 100);
}

// ── helpers ──────────────────────────────────────────────────────────────────
async function creditSpc(userId: number, amount: number, desc_: string) {
  try {
    const [w] = await db.select().from(spettroWalletsTable).where(eq(spettroWalletsTable.userId, userId));
    if (w) {
      await db.update(spettroWalletsTable).set({
        balance: w.balance + amount, totalEarned: w.totalEarned + amount, updatedAt: new Date(),
      }).where(eq(spettroWalletsTable.userId, userId));
    } else {
      await db.insert(spettroWalletsTable).values({ userId, balance: amount, totalEarned: amount });
    }
    await db.insert(spettroTransactionsTable).values({ userId, amount, type: "battle", description: desc_ });
  } catch (_) {}
}

// ── Squads ───────────────────────────────────────────────────────────────────
router.get("/squads", async (req, res) => {
  try {
    const squads = await db.select().from(squadsTable).orderBy(desc(squadsTable.totalPoints));
    res.json(squads);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

router.post("/squads", async (req, res) => {
  try {
    const raw         = req.body as Record<string, unknown>;
    const name        = sanitizeStr(raw.name, 50);
    const captainName = sanitizeStr(raw.captainName, 50);
    const description = sanitizeOptional(raw.description, 300);
    const emblem      = sanitizeStr(raw.emblem, 20) || "skull";

    if (!name || !captainName) return res.status(400).json({ error: "Nombre y capitán requeridos" });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const [existing] = await db.select().from(squadsTable).where(eq(squadsTable.slug, slug));
    if (existing) return res.status(409).json({ error: "Ya existe una escuadra con ese nombre" });

    const [squad] = await db.insert(squadsTable).values({
      name, slug, captainName, description, emblem,
    }).returning();
    res.status(201).json(squad);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// PATCH /api/squads/:id — whitelist updatable fields to prevent mass assignment
router.patch("/squads/:id", async (req, res) => {
  try {
    const id  = safeInt(req.params.id, 0, 1);
    if (!id) return res.status(400).json({ error: "ID inválido" });
    const raw = req.body as Record<string, unknown>;

    const allowed: Record<string, unknown> = {};
    if (raw.name !== undefined)        allowed.name        = sanitizeStr(raw.name, 50);
    if (raw.description !== undefined) allowed.description = sanitizeOptional(raw.description, 300);
    if (raw.emblem !== undefined)      allowed.emblem      = sanitizeStr(raw.emblem, 20);
    if (raw.memberCount !== undefined) allowed.memberCount = safeInt(raw.memberCount, 0, 0, 5000);
    if (raw.totalPoints !== undefined) allowed.totalPoints = safeInt(raw.totalPoints, 0, 0, 10_000_000);
    if (raw.wins !== undefined)        allowed.wins        = safeInt(raw.wins, 0, 0, 100_000);
    if (raw.losses !== undefined)      allowed.losses      = safeInt(raw.losses, 0, 0, 100_000);
    if (raw.level !== undefined)       allowed.level       = safeInt(raw.level, 1, 1, 10);

    if (Object.keys(allowed).length === 0) return res.status(400).json({ error: "Nada que actualizar" });

    const [updated] = await db.update(squadsTable).set(allowed as never).where(eq(squadsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// ── CTF Missions ─────────────────────────────────────────────────────────────
router.get("/squads/missions", async (req, res) => {
  try {
    const missions = await db.select().from(ctfMissionsTable).where(eq(ctfMissionsTable.isActive, true)).orderBy(ctfMissionsTable.difficulty);
    if (missions.length === 0) {
      const defaults = [
        { name: "Operación Aurora",    description: "Infiltra el servidor corporativo. Encuentra la flag oculta en los logs del sistema.", difficulty: "facil",   points: 100, targetIp: "10.10.1.1",  flagFormat: "SpettroWeb{aurora_...}",  hints: "Enumera los servicios. El puerto 8080 esconde algo interesante." },
        { name: "Proyecto Hydra",      description: "Dos cabezas crecen donde cae una. Explota una cadena de vulnerabilidades para escalar privilegios.", difficulty: "medio",   points: 200, targetIp: "10.10.1.5",  flagFormat: "SpettroWeb{hydra_...}",   hints: "LFI → RCE → Sudo misconfig" },
        { name: "Espejo Negro",        description: "Un servidor de IA ha sido comprometido. Recupera la flag antes de que destruya las evidencias.", difficulty: "dificil", points: 350, targetIp: "10.10.1.9",  flagFormat: "SpettroWeb{mirror_...}",  hints: "El modelo tiene una backdoor en el API endpoint." },
        { name: "Protocolo OMEGA",     description: "El servidor final. Solo los mejores llegan aquí. Active Directory + múltiples pivots.", difficulty: "insano",  points: 500, targetIp: "10.10.1.15", flagFormat: "SpettroWeb{omega_...}",   hints: "Kerberoasting → Pass the Hash → DCSync" },
      ];
      const seeded = await db.insert(ctfMissionsTable).values(defaults).returning();
      return res.json(seeded);
    }
    res.json(missions);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// ── CTF Battles ──────────────────────────────────────────────────────────────
router.get("/squads/battles", async (req, res) => {
  try {
    const battles = await db.select().from(ctfBattlesTable).orderBy(desc(ctfBattlesTable.createdAt));
    res.json(battles);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

router.get("/squads/battles/:id", async (req, res) => {
  try {
    const id = safeInt(req.params.id, 0, 1);
    if (!id) return res.status(400).json({ error: "ID inválido" });
    const [battle] = await db.select().from(ctfBattlesTable).where(eq(ctfBattlesTable.id, id));
    if (!battle) return res.status(404).json({ error: "Combate no encontrado" });

    let mission = null;
    if (battle.missionId) {
      const [m] = await db.select().from(ctfMissionsTable).where(eq(ctfMissionsTable.id, battle.missionId));
      mission = m || null;
    }

    let squad1 = null, squad2 = null;
    if (battle.squad1Id) {
      const [s] = await db.select().from(squadsTable).where(eq(squadsTable.id, battle.squad1Id));
      squad1 = s || null;
    }
    if (battle.squad2Id) {
      const [s] = await db.select().from(squadsTable).where(eq(squadsTable.id, battle.squad2Id));
      squad2 = s || null;
    }

    let botProgress = 0;
    let botSquadSide: "squad1" | "squad2" | null = null;
    const aiDiff = battle.aiDifficulty;
    if (squad1?.isBot) { botSquadSide = "squad1"; botProgress = computeBotProgress(battle.startedAt?.toISOString() ?? null, aiDiff); }
    else if (squad2?.isBot) { botSquadSide = "squad2"; botProgress = computeBotProgress(battle.startedAt?.toISOString() ?? null, aiDiff); }

    if (botProgress >= 100 && battle.status === "en_combate" && botSquadSide) {
      const botSq   = botSquadSide === "squad1" ? squad1 : squad2;
      const humanSq = botSquadSide === "squad1" ? squad2 : squad1;
      await db.update(ctfBattlesTable).set({
        winnerId: botSq!.id, winnerName: botSq!.name,
        status: "finalizado", endedAt: new Date(),
        ...(botSquadSide === "squad1" ? { squad1Score: 1 } : { squad2Score: 1 }),
      }).where(eq(ctfBattlesTable.id, battle.id));
      if (humanSq) {
        const [losSq] = await db.select().from(squadsTable).where(eq(squadsTable.id, humanSq.id));
        if (losSq) await db.update(squadsTable).set({ losses: losSq.losses + 1 }).where(eq(squadsTable.id, losSq.id));
      }
      const [updated] = await db.select().from(ctfBattlesTable).where(eq(ctfBattlesTable.id, battle.id));
      return res.json({ battle: updated, mission, squad1, squad2, botProgress: 100, botSquadSide });
    }

    res.json({ battle, mission, squad1, squad2, botProgress: Math.round(botProgress), botSquadSide });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

router.post("/squads/battles", async (req, res) => {
  try {
    const raw = req.body as Record<string, unknown>;
    const squad1Id   = safeInt(raw.squad1Id, 0, 1);
    const squad1Name = sanitizeStr(raw.squad1Name, 80);
    const squad2Id   = safeInt(raw.squad2Id, 0, 1);
    const squad2Name = sanitizeStr(raw.squad2Name, 80);
    const missionId  = safeInt(raw.missionId, 0, 1);
    const missionName = sanitizeStr(raw.missionName, 100);

    if (!squad1Id || !squad2Id || !missionId) return res.status(400).json({ error: "Faltan datos del combate" });
    if (squad1Id === squad2Id) return res.status(400).json({ error: "No puedes retarte a ti mismo" });

    const [mission] = await db.select().from(ctfMissionsTable).where(eq(ctfMissionsTable.id, missionId));
    const prizeSpc = (mission?.points ?? 100) * 5;

    const [battle] = await db.insert(ctfBattlesTable).values({
      squad1Id, squad1Name, squad2Id, squad2Name, missionId, missionName,
      prizeSpc, status: "en_combate", startedAt: new Date(),
    }).returning();
    res.status(201).json(battle);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// POST /api/squads/ai-battle
router.post("/squads/ai-battle", async (req, res) => {
  try {
    const raw = req.body as Record<string, unknown>;
    const playerSquadId   = safeInt(raw.playerSquadId, 0, 1);
    const playerSquadName = sanitizeStr(raw.playerSquadName, 80);
    const aiDifficulty    = sanitizeStr(raw.aiDifficulty, 20);
    const missionId       = safeInt(raw.missionId, 0, 1);
    const missionName     = sanitizeStr(raw.missionName, 100);

    if (!playerSquadId || !aiDifficulty || !missionId) {
      return res.status(400).json({ error: "Faltan datos" });
    }
    if (!ALLOWED_AI_DIFFICULTY.has(aiDifficulty)) {
      return res.status(400).json({ error: "Dificultad inválida" });
    }

    const bots = await db.select().from(squadsTable).where(eq(squadsTable.isBot, true));
    const bot  = bots.find(b => b.aiDifficulty === aiDifficulty);
    if (!bot) return res.status(404).json({ error: "Bot no encontrado para esa dificultad" });

    const [mission] = await db.select().from(ctfMissionsTable).where(eq(ctfMissionsTable.id, missionId));
    const prizeSpc = (mission?.points ?? 100) * 5;

    const [battle] = await db.insert(ctfBattlesTable).values({
      squad1Id: playerSquadId, squad1Name: playerSquadName,
      squad2Id: bot.id,        squad2Name: bot.name,
      missionId, missionName: missionName || mission?.name || "Misión IA",
      prizeSpc, status: "en_combate", startedAt: new Date(), aiDifficulty,
    }).returning();

    await db.insert(battleMessagesTable).values({
      battleId: battle.id, userId: null, username: "SISTEMA",
      message: `⚡ ENTRENAMIENTO IA INICIADO — Dificultad: ${aiDifficulty.toUpperCase()} · ${bot.name} tiene ${AI_TIMING[aiDifficulty]} minutos para capturar la flag. ¡Actúa rápido!`,
      type: "spectator",
    });

    res.status(201).json({ battle, bot });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error al iniciar batalla IA" }); }
});

// POST /api/squads/battles/:id/flag — submit a flag
router.post("/squads/battles/:id/flag", async (req, res) => {
  try {
    const battleId = safeInt(req.params.id, 0, 1);
    if (!battleId) return res.status(400).json({ error: "ID inválido" });
    const raw      = req.body as Record<string, unknown>;
    const flag     = sanitizeStr(raw.flag, 200);
    const userId   = safeInt(raw.userId, 0, 0);
    const username = sanitizeStr(raw.username, 50);
    const squadId  = safeInt(raw.squadId, 0, 0);
    const squadName = sanitizeStr(raw.squadName, 80);

    if (!flag) return res.status(400).json({ error: "Falta la flag" });

    const [battle] = await db.select().from(ctfBattlesTable).where(eq(ctfBattlesTable.id, battleId));
    if (!battle) return res.status(404).json({ error: "Combate no encontrado" });
    if (battle.status !== "en_combate") return res.status(400).json({ error: "El combate ya terminó" });

    const [mission] = battle.missionId
      ? await db.select().from(ctfMissionsTable).where(eq(ctfMissionsTable.id, battle.missionId))
      : [null];

    // Strict flag comparison only — no "looks like a flag" bypass
    const correctFlag = battle.flagValue || mission?.flagFormat?.replace("...", "pwned");
    const isCorrect   = !!correctFlag &&
      flag.toLowerCase().trim() === correctFlag.toLowerCase().trim();

    if (!isCorrect) {
      await db.insert(battleMessagesTable).values({
        battleId, userId: userId || null, username: username || "anon",
        message: `⚠️ Flag incorrecta enviada`,
        type: "squad", squadId: squadId || null, squadName: squadName || null,
      });
      return res.json({ correct: false, message: "Flag incorrecta. Sigue intentando." });
    }

    // Check if AI bot has already won
    const aiDiff = battle.aiDifficulty;
    if (aiDiff) {
      const botProgress = computeBotProgress(battle.startedAt?.toISOString() ?? null, aiDiff);
      if (botProgress >= 100) {
        const botSq = battle.squad2Id
          ? (await db.select().from(squadsTable).where(eq(squadsTable.id, battle.squad2Id)))[0]
          : null;
        if (botSq?.isBot) {
          await db.update(ctfBattlesTable).set({
            winnerId: botSq.id, winnerName: botSq.name,
            status: "finalizado", endedAt: new Date(), squad2Score: 1,
          }).where(eq(ctfBattlesTable.id, battleId));
          if (squadId) {
            const [humanSq] = await db.select().from(squadsTable).where(eq(squadsTable.id, squadId));
            if (humanSq) await db.update(squadsTable).set({ losses: humanSq.losses + 1 }).where(eq(squadsTable.id, humanSq.id));
          }
          return res.json({ correct: false, botWon: true, message: "La IA capturó la flag primero. ¡Practica más y vuelve a intentarlo!" });
        }
      }
    }

    // Human wins!
    const isSquad1  = squadId === battle.squad1Id;
    const winnerId  = isSquad1 ? battle.squad1Id! : battle.squad2Id!;
    const winnerName = isSquad1 ? battle.squad1Name : battle.squad2Name;
    const loserId   = isSquad1 ? battle.squad2Id! : battle.squad1Id!;

    const [updated] = await db.update(ctfBattlesTable).set({
      winnerId, winnerName, status: "finalizado", endedAt: new Date(),
      ...(isSquad1 ? { squad1Score: (battle.squad1Score || 0) + 1 } : { squad2Score: (battle.squad2Score || 0) + 1 }),
    }).where(eq(ctfBattlesTable.id, battleId)).returning();

    const pts = mission?.points ?? 100;
    const [winSq] = await db.select().from(squadsTable).where(eq(squadsTable.id, winnerId));
    if (winSq && !winSq.isBot) {
      const newPts  = winSq.totalPoints + pts;
      const newLevel = Math.min(10, Math.floor(newPts / 300) + 1);
      await db.update(squadsTable).set({ wins: winSq.wins + 1, totalPoints: newPts, level: newLevel }).where(eq(squadsTable.id, winSq.id));
    }
    const [losSq] = await db.select().from(squadsTable).where(eq(squadsTable.id, loserId));
    if (losSq && !losSq.isBot) {
      await db.update(squadsTable).set({ losses: losSq.losses + 1 }).where(eq(squadsTable.id, losSq.id));
    }

    if (userId) {
      await creditSpc(userId, battle.prizeSpc, `Combate ganado: ${battle.missionName} — FLAG CAPTURADA 🚩`);
    }

    await db.insert(battleMessagesTable).values({
      battleId, userId: userId || null, username: username || "anon",
      message: `🚩 FLAG CAPTURADA por @${username}! ¡${winnerName} GANA${aiDiff ? " EL ENTRENAMIENTO" : " EL COMBATE"}!`,
      type: "spectator",
    });

    res.json({ correct: true, battle: updated, message: `¡FLAG CORRECTA! ${winnerName} gana ${battle.prizeSpc} SPC` });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// PATCH /api/squads/battles/:id/resolve
router.patch("/squads/battles/:id/resolve", async (req, res) => {
  try {
    const id       = safeInt(req.params.id, 0, 1);
    if (!id) return res.status(400).json({ error: "ID inválido" });
    const raw      = req.body as Record<string, unknown>;
    const winnerId  = safeInt(raw.winnerId, 0, 1);
    const winnerName = sanitizeStr(raw.winnerName, 80);

    const [battle] = await db.select().from(ctfBattlesTable).where(eq(ctfBattlesTable.id, id));
    if (!battle) return res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(ctfBattlesTable).set({
      winnerId, winnerName, status: "finalizado", endedAt: new Date(),
    }).where(eq(ctfBattlesTable.id, id)).returning();

    const mission = await db.select().from(ctfMissionsTable).where(eq(ctfMissionsTable.id, battle.missionId!));
    const pts = mission[0]?.points ?? 100;

    const loserId = winnerId === battle.squad1Id ? battle.squad2Id : battle.squad1Id;
    const [winSq] = await db.select().from(squadsTable).where(eq(squadsTable.id, winnerId));
    if (winSq && !winSq.isBot) {
      const newPts  = winSq.totalPoints + pts;
      const newLevel = Math.min(10, Math.floor(newPts / 300) + 1);
      await db.update(squadsTable).set({ wins: winSq.wins + 1, totalPoints: newPts, level: newLevel }).where(eq(squadsTable.id, winSq.id));
    }
    if (loserId) {
      const [losSq] = await db.select().from(squadsTable).where(eq(squadsTable.id, loserId));
      if (losSq && !losSq.isBot) await db.update(squadsTable).set({ losses: losSq.losses + 1 }).where(eq(squadsTable.id, loserId));
    }
    res.json(updated);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

// ── Battle Chat ───────────────────────────────────────────────────────────────
router.get("/squads/battles/:id/messages", async (req, res) => {
  try {
    const battleId = safeInt(req.params.id, 0, 1);
    if (!battleId) return res.status(400).json({ error: "ID inválido" });
    const type = sanitizeStr(req.query.type, 20);
    const msgs = await db
      .select({
        id: battleMessagesTable.id,
        battleId: battleMessagesTable.battleId,
        userId: battleMessagesTable.userId,
        username: battleMessagesTable.username,
        message: battleMessagesTable.message,
        type: battleMessagesTable.type,
        squadId: battleMessagesTable.squadId,
        squadName: battleMessagesTable.squadName,
        createdAt: battleMessagesTable.createdAt,
        avatarUrl: usersTable.avatarUrl,
      })
      .from(battleMessagesTable)
      .leftJoin(usersTable, eq(battleMessagesTable.userId, usersTable.id))
      .where(eq(battleMessagesTable.battleId, battleId))
      .orderBy(asc(battleMessagesTable.createdAt))
      .limit(200);
    const result = type && type !== "all" ? msgs.filter(m => m.type === type) : msgs;
    res.json(result);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

router.post("/squads/battles/:id/messages", async (req, res) => {
  try {
    const battleId = safeInt(req.params.id, 0, 1);
    if (!battleId) return res.status(400).json({ error: "ID inválido" });
    const raw      = req.body as Record<string, unknown>;
    const userId   = safeInt(raw.userId, 0, 0);
    const username = sanitizeStr(raw.username, 50);
    const message  = sanitizeStr(raw.message, 300);
    const type     = sanitizeStr(raw.type, 20) || "spectator";
    const squadId  = safeInt(raw.squadId, 0, 0);
    const squadName = sanitizeOptional(raw.squadName, 80);

    if (!username || !message) return res.status(400).json({ error: "Faltan campos" });
    if (message.length > 300) return res.status(400).json({ error: "Mensaje demasiado largo" });

    const ALLOWED_MSG_TYPES = new Set(["spectator", "squad", "system"]);
    const safeType = ALLOWED_MSG_TYPES.has(type) ? type : "spectator";

    const [msg] = await db.insert(battleMessagesTable).values({
      battleId, userId: userId || null, username,
      message, type: safeType,
      squadId: squadId || null, squadName,
    }).returning();
    res.status(201).json(msg);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Error" }); }
});

export default router;
