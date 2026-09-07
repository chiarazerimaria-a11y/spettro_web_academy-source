import { Router, type IRouter } from "express";
import { db, labMachinesTable, teamsTable, certificationsTable, userVpnSessionsTable, usersTable, flagSubmissionsTable, machineNotesTable, spettroWalletsTable, spettroTransactionsTable } from "@workspace/db";
import { eq, ilike, and, sql, or } from "drizzle-orm";
import { sanitizeStr, safeInt, ALLOWED_DIFFICULTIES, ALLOWED_OS } from "../middleware/sanitize";
import { execSync } from "child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const router: IRouter = Router();

// ─── VPN Certificate Infrastructure ──────────────────────────────────────────
interface CaBundle { cert: string; key: string; }
let _ca: CaBundle | null = null;

function getOrCreateCa(): CaBundle {
  if (_ca) return _ca;
  const dir = join(tmpdir(), "spettroweb-vpn-ca");
  mkdirSync(dir, { recursive: true });
  execSync(`openssl genrsa -out "${dir}/ca.key" 2048 2>/dev/null`);
  execSync(`openssl req -new -x509 -days 3650 -key "${dir}/ca.key" -out "${dir}/ca.crt" -subj "/CN=SpettroWeb-CA/O=SpettroWebAcademy/C=ES" 2>/dev/null`);
  _ca = {
    key:  readFileSync(join(dir, "ca.key"),  "utf-8"),
    cert: readFileSync(join(dir, "ca.crt"), "utf-8"),
  };
  return _ca;
}

function generateClientBundle(username: string): { cert: string; key: string; caCert: string } {
  const ca  = getOrCreateCa();
  const dir = join(tmpdir(), `spw-${username}-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  try {
    writeFileSync(join(dir, "ca.key"),  ca.key);
    writeFileSync(join(dir, "ca.crt"), ca.cert);
    execSync(`openssl genrsa -out "${dir}/client.key" 2048 2>/dev/null`);
    execSync(`openssl req -new -key "${dir}/client.key" -out "${dir}/client.csr" -subj "/CN=${username}/O=SpettroWebAcademy/C=ES" 2>/dev/null`);
    execSync(`openssl x509 -req -days 825 -in "${dir}/client.csr" -CA "${dir}/ca.crt" -CAkey "${dir}/ca.key" -CAcreateserial -out "${dir}/client.crt" 2>/dev/null`);
    return {
      caCert: ca.cert,
      cert:   readFileSync(join(dir, "client.crt"), "utf-8"),
      key:    readFileSync(join(dir, "client.key"),  "utf-8"),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// GET /api/lab/machines
router.get("/lab/machines", async (req, res) => {
  try {
    const q = req.query as Record<string, unknown>;
    const difficulty = sanitizeStr(q.difficulty, 20);
    const os         = sanitizeStr(q.os, 20);
    const search     = sanitizeStr(q.search, 100);
    const limit      = safeInt(q.limit, 500, 1, 500);
    const offset     = safeInt(q.offset,  0, 0, 50_000);

    const conditions = [eq(labMachinesTable.isActive, true)];

    if (difficulty && difficulty !== "all") {
      if (!ALLOWED_DIFFICULTIES.has(difficulty)) {
        res.status(400).json({ error: "Dificultad inválida" }); return;
      }
      conditions.push(eq(labMachinesTable.difficulty, difficulty));
    }
    if (os && os !== "all") {
      if (!ALLOWED_OS.has(os)) {
        res.status(400).json({ error: "SO inválido" }); return;
      }
      conditions.push(eq(labMachinesTable.os, os));
    }
    if (search) {
      conditions.push(
        or(
          ilike(labMachinesTable.name, `%${search}%`),
          ilike(labMachinesTable.vulnerability, `%${search}%`),
          ilike(labMachinesTable.techniques, `%${search}%`)
        )!
      );
    }

    const rows = await db
      .select()
      .from(labMachinesTable)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
    res.json(rows);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/lab/machines/:slug
router.get("/lab/machines/:slug", async (req, res) => {
  try {
    const slug = sanitizeStr(req.params.slug, 100);
    if (!slug) return res.status(400).json({ error: "Slug inválido" });
    const row = await db
      .select()
      .from(labMachinesTable)
      .where(eq(labMachinesTable.slug, slug))
      .limit(1);
    if (!row[0]) return res.status(404).json({ error: "Not found" });
    res.json(row[0]);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/lab/stats
router.get("/lab/stats", async (req, res) => {
  try {
    const total  = await db.select({ count: sql<number>`count(*)` }).from(labMachinesTable).where(eq(labMachinesTable.isActive, true));
    const byDiff = await db.select({ difficulty: labMachinesTable.difficulty, count: sql<number>`count(*)` }).from(labMachinesTable).where(eq(labMachinesTable.isActive, true)).groupBy(labMachinesTable.difficulty);
    const byOs   = await db.select({ os: labMachinesTable.os, count: sql<number>`count(*)` }).from(labMachinesTable).where(eq(labMachinesTable.isActive, true)).groupBy(labMachinesTable.os);
    res.json({ total: Number(total[0].count), byDifficulty: byDiff, byOs });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/lab/teams
router.get("/lab/teams", async (req, res) => {
  try {
    const rows = await db.select().from(teamsTable).orderBy(sql`total_points DESC`);
    res.json(rows);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/lab/teams
router.post("/lab/teams", async (req, res) => {
  try {
    const raw = req.body as Record<string, unknown>;
    const name        = sanitizeStr(raw.name, 80);
    const description = sanitizeStr(raw.description, 500);
    if (!name) return res.status(400).json({ error: "name required" });
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);
    const row = await db.insert(teamsTable).values({
      name, slug, description, memberCount: 1, totalPoints: 0, rank: "Rookie",
    }).returning();
    res.status(201).json(row[0]);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/lab/certifications
router.get("/lab/certifications", async (req, res) => {
  try {
    const rows = await db.select().from(certificationsTable).where(eq(certificationsTable.isActive, true)).orderBy(certificationsTable.pointsNeeded);
    res.json(rows);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/lab/vpn-server-status — tells the frontend whether VPN_SERVER_HOST is configured
router.get("/lab/vpn-server-status", (_req, res) => {
  const host = process.env.VPN_SERVER_HOST ?? "";
  const port = process.env.VPN_SERVER_PORT ?? "1194";
  const configured = host.length > 0 && host !== "CONFIGURAR_VPN_SERVER_HOST";
  res.json({ configured, host: configured ? host : null, port });
});

// GET /api/lab/vpn-connect-script?userId=X  — returns a ready-to-run bash script
router.get("/lab/vpn-connect-script", async (req, res) => {
  try {
    const userId = safeInt(req.query.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(401).json({ error: "userId requerido" });

    const user = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user[0]) return res.status(404).json({ error: "Usuario no encontrado" });

    const username = user[0].username;
    const proto    = req.headers["x-forwarded-proto"] ?? "https";
    const host     = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
    const baseUrl  = `${proto}://${host}`;

    const vpnHost = process.env.VPN_SERVER_HOST ?? "CONFIGURAR_VPN_SERVER_HOST";
    const vpnPort = process.env.VPN_SERVER_PORT ?? "1194";
    const serverConfigured = vpnHost !== "CONFIGURAR_VPN_SERVER_HOST";

    const script = `#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════╗
# ║   SpettroWeb — Auto-Conexión VPN de Laboratorio      ║
# ║   Usuario : ${username.padEnd(40)}║
# ╚══════════════════════════════════════════════════════╝
set -euo pipefail
COLOR_GREEN="\\033[0;32m"; COLOR_YELLOW="\\033[1;33m"
COLOR_RED="\\033[0;31m"; COLOR_RESET="\\033[0m"; COLOR_CYAN="\\033[0;36m"
COLOR_MAGENTA="\\033[0;35m"; BOLD="\\033[1m"

echo -e "\\n\${BOLD}\${COLOR_CYAN}[*] SpettroWeb VPN — Conectando como '\${COLOR_GREEN}${username}\${COLOR_RESET}\${COLOR_CYAN}'...\${COLOR_RESET}\\n"

VPN_HOST="${vpnHost}"
VPN_PORT="${vpnPort}"

# 0. Verificar que el servidor VPN está configurado
if [ "\$VPN_HOST" = "CONFIGURAR_VPN_SERVER_HOST" ]; then
  echo -e "\${BOLD}\${COLOR_RED}╔══════════════════════════════════════════════════════╗\${COLOR_RESET}"
  echo -e "\${BOLD}\${COLOR_RED}║  ERROR: Servidor VPN no configurado todavía          ║\${COLOR_RESET}"
  echo -e "\${BOLD}\${COLOR_RED}╚══════════════════════════════════════════════════════╝\${COLOR_RESET}"
  echo -e ""
  echo -e "\${COLOR_YELLOW}La plataforma necesita un servidor OpenVPN real.\${COLOR_RESET}"
  echo -e "\${COLOR_YELLOW}El administrador debe configurar la variable:\${COLOR_RESET}"
  echo -e "\${COLOR_MAGENTA}  VPN_SERVER_HOST=<ip-o-dominio-del-servidor>\${COLOR_RESET}"
  echo -e "\${COLOR_MAGENTA}  VPN_SERVER_PORT=1194\${COLOR_RESET}"
  echo -e ""
  echo -e "\${COLOR_CYAN}Opciones para el admin:\${COLOR_RESET}"
  echo -e "  1. Despliega un servidor OpenVPN en un VPS (DigitalOcean, Hetzner...)"
  echo -e "  2. Usa: curl -fsSL https://install.pivpn.io | bash"
  echo -e "  3. Configura VPN_SERVER_HOST en las variables de entorno de la plataforma"
  exit 1
fi

# 1. Verificar resolución DNS del servidor
echo -e "\${COLOR_CYAN}[*] Verificando servidor VPN \${VPN_HOST}:\${VPN_PORT}...\${COLOR_RESET}"
if ! host "\$VPN_HOST" &>/dev/null && ! nslookup "\$VPN_HOST" &>/dev/null; then
  echo -e "\${COLOR_RED}[-] No se puede resolver '\${VPN_HOST}'\${COLOR_RESET}"
  echo -e "\${COLOR_YELLOW}    Comprueba que VPN_SERVER_HOST es correcto y el servidor está en línea.\${COLOR_RESET}"
  exit 1
fi
echo -e "\${COLOR_GREEN}[✓] Servidor accesible\${COLOR_RESET}"

# 2. Verificar / instalar openvpn
if ! command -v openvpn &>/dev/null; then
  echo -e "\${COLOR_YELLOW}[+] openvpn no encontrado — instalando...\${COLOR_RESET}"
  if command -v apt-get &>/dev/null; then
    sudo apt-get update -qq && sudo apt-get install -y openvpn
  elif command -v pacman &>/dev/null; then
    sudo pacman -Sy --noconfirm openvpn
  elif command -v brew &>/dev/null; then
    brew install openvpn
  else
    echo -e "\${COLOR_RED}[-] Instala openvpn manualmente y vuelve a ejecutar.\${COLOR_RESET}" && exit 1
  fi
fi

# 3. Descargar el .ovpn personalizado
OVPN_FILE="$HOME/spettroweb-${username}.ovpn"
echo -e "\${COLOR_CYAN}[*] Descargando config VPN personalizado...\${COLOR_RESET}"
curl -fsSL "${baseUrl}/api/lab/vpn-config?userId=${userId}" -o "\$OVPN_FILE"
echo -e "\${COLOR_GREEN}[✓] Config guardado: \$OVPN_FILE\${COLOR_RESET}"

# 4. Conectar
echo -e "\\n\${COLOR_CYAN}[*] Iniciando túnel VPN hacia \${VPN_HOST}:\${VPN_PORT}...\${COLOR_RESET}"
echo -e "\${COLOR_YELLOW}    (Ctrl+C para desconectar)\${COLOR_RESET}\\n"
sudo openvpn --config "\$OVPN_FILE"
`;

    // Also expose whether VPN server is configured in header so frontend can show warning
    res.setHeader("X-Vpn-Configured", serverConfigured ? "true" : "false");

    res.setHeader("Content-Type", "text/x-sh");
    res.setHeader("Content-Disposition", `attachment; filename="spettroweb-connect-${username}.sh"`);
    res.send(script);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/lab/vpn-config?userId=X
router.get("/lab/vpn-config", async (req, res) => {
  try {
    const userId = safeInt(req.query.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(401).json({ error: "userId requerido" });

    const user = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user[0]) return res.status(404).json({ error: "Usuario no encontrado" });

    const username  = user[0].username;
    const clientIp  = `10.8.0.${(userId % 200) + 10}`;
    const vpnHost   = process.env.VPN_SERVER_HOST ?? "CONFIGURAR_VPN_SERVER_HOST";
    const vpnPort   = process.env.VPN_SERVER_PORT ?? "1194";
    const bundle    = generateClientBundle(username);
    const ovpn = `# SpettroWeb Academia de Hacking — VPN Config
# Usuario: ${username}
# IP de laboratorio asignada: ${clientIp}
# Generado: ${new Date().toISOString()}
# Uso: sudo openvpn --config spettroweb-${username}.ovpn
#
# NOTA: Para que funcione se necesita un servidor OpenVPN corriendo en:
#   ${vpnHost}:${vpnPort}
# Configura VPN_SERVER_HOST y VPN_SERVER_PORT en las variables de entorno.

client
dev tun
proto udp
remote ${vpnHost} ${vpnPort}
resolv-retry 5
nobind
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA256
verb 3
mute 5
keepalive 10 60
tun-mtu 1500
connect-retry-max 3
route 10.10.0.0 255.255.0.0

<ca>
${bundle.caCert.trim()}
</ca>

<cert>
${bundle.cert.trim()}
</cert>

<key>
${bundle.key.trim()}
</key>
`;
    res.setHeader("Content-Type", "application/x-openvpn-profile");
    res.setHeader("Content-Disposition", `attachment; filename="spettroweb-${username}.ovpn"`);
    res.send(ovpn);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PATCH /api/lab/machines/:slug/ip
router.patch("/lab/machines/:slug/ip", async (req, res) => {
  try {
    const slug = sanitizeStr(req.params.slug, 100);
    if (!slug) return res.status(400).json({ error: "Slug inválido" });
    const ip = sanitizeStr((req.body as Record<string, unknown>).ip, 45);
    await db.update(labMachinesTable).set({ ip: ip || null }).where(eq(labMachinesTable.slug, slug));
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /api/lab/machines/:slug/spawn
router.post("/lab/machines/:slug/spawn", async (req, res) => {
  try {
    const raw      = req.body as Record<string, unknown>;
    const userId   = safeInt(raw.userId, 0, 1, 1_000_000);
    const username = sanitizeStr(raw.username, 50);
    if (!userId || !username) return res.status(400).json({ error: "userId y username requeridos" });

    const slug = sanitizeStr(req.params.slug, 100);
    if (!slug) return res.status(400).json({ error: "Slug inválido" });

    // Verify user actually exists to prevent spoofed userId
    const userRow = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!userRow[0]) return res.status(403).json({ error: "Usuario no encontrado" });

    const machine = await db.select().from(labMachinesTable).where(eq(labMachinesTable.slug, slug)).limit(1);
    if (!machine[0]) return res.status(404).json({ error: "Máquina no encontrada" });

    await db.update(userVpnSessionsTable)
      .set({ status: "stopped", stoppedAt: new Date() })
      .where(and(eq(userVpnSessionsTable.userId, userId), eq(userVpnSessionsTable.machineSlug, slug), eq(userVpnSessionsTable.status, "active")));

    // Use the admin-configured IP if set; otherwise generate a placeholder
    const assignedIp = (machine[0] as any).ip || `10.10.${machine[0].id % 200 + 10}.${(userId % 200) + 10}`;

    const session = await db.insert(userVpnSessionsTable).values({
      userId, username, machineSlug: slug,
      machineName: machine[0].name, assignedIp, status: "active",
    }).returning();
    res.status(201).json(session[0]);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE /api/lab/machines/:slug/spawn
router.delete("/lab/machines/:slug/spawn", async (req, res) => {
  try {
    const userId = safeInt(req.query.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(400).json({ error: "userId requerido" });
    const slug = sanitizeStr(req.params.slug, 100);
    await db.update(userVpnSessionsTable)
      .set({ status: "stopped", stoppedAt: new Date() })
      .where(and(eq(userVpnSessionsTable.userId, userId), eq(userVpnSessionsTable.machineSlug, slug), eq(userVpnSessionsTable.status, "active")));
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/lab/my-sessions?userId=X
router.get("/lab/my-sessions", async (req, res) => {
  try {
    const userId = safeInt(req.query.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(400).json({ error: "userId requerido" });
    const sessions = await db.select().from(userVpnSessionsTable)
      .where(and(eq(userVpnSessionsTable.userId, userId), eq(userVpnSessionsTable.status, "active")))
      .orderBy(sql`spawned_at DESC`);
    res.json(sessions);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/lab/machines/:slug/submit-flag
router.post("/lab/machines/:slug/submit-flag", async (req, res) => {
  try {
    const raw      = req.body as Record<string, unknown>;
    const userId   = safeInt(raw.userId, 0, 1, 1_000_000);
    const flagType = sanitizeStr(raw.flagType, 10); // 'user' | 'root'
    const flag     = sanitizeStr(raw.flag, 200);
    if (!userId || !flag || (flagType !== "user" && flagType !== "root"))
      return res.status(400).json({ error: "userId, flagType y flag son requeridos" });

    const slug = sanitizeStr(req.params.slug, 100);
    if (!slug) return res.status(400).json({ error: "Slug inválido" });

    const machine = await db.select().from(labMachinesTable).where(eq(labMachinesTable.slug, slug)).limit(1);
    if (!machine[0]) return res.status(404).json({ error: "Máquina no encontrada" });

    const correctFlag = flagType === "user" ? machine[0].userFlag : machine[0].rootFlag;
    const isCorrect   = flag.trim().toLowerCase() === (correctFlag ?? "").toLowerCase();

    if (isCorrect) {
      // Check BEFORE upsert if user already had this flag correct
      const prev = await db.select({ isCorrect: flagSubmissionsTable.isCorrect })
        .from(flagSubmissionsTable)
        .where(and(eq(flagSubmissionsTable.userId, userId), eq(flagSubmissionsTable.machineSlug, slug), eq(flagSubmissionsTable.flagType, flagType)))
        .limit(1);
      const alreadyHad = prev.length > 0 && prev[0].isCorrect;

      if (!alreadyHad) {
        const pts = flagType === "root" ? machine[0].points : Math.floor(machine[0].points / 2);

        // Update user total points
        await db.update(usersTable)
          .set({ totalPoints: sql`total_points + ${pts}` })
          .where(eq(usersTable.id, userId));

        // Increment machinesSolved on root flag
        if (flagType === "root") {
          await db.update(usersTable)
            .set({ machinesSolved: sql`machines_solved + 1` })
            .where(eq(usersTable.id, userId));
          // Increment machine solve count
          await db.update(labMachinesTable)
            .set({ solveCount: sql`solve_count + 1` })
            .where(eq(labMachinesTable.slug, slug));
        }

        // Give SPC to wallet
        await db.update(spettroWalletsTable)
          .set({ balance: sql`balance + ${pts}`, totalEarned: sql`total_earned + ${pts}`, updatedAt: new Date() })
          .where(eq(spettroWalletsTable.userId, userId));

        // Record SPC transaction
        await db.insert(spettroTransactionsTable).values({
          userId, amount: pts, type: "earned",
          description: `${flagType === "root" ? "Root" : "User"} flag — ${machine[0].name}`,
          referenceId: `${slug}:${flagType}`,
        });
      }
    }

    // Upsert submission (AFTER rewarding to avoid race condition)
    await db.execute(sql`
      INSERT INTO flag_submissions (user_id, machine_slug, flag_type, is_correct, submitted_at)
      VALUES (${userId}, ${slug}, ${flagType}, ${isCorrect}, now())
      ON CONFLICT (user_id, machine_slug, flag_type)
      DO UPDATE SET is_correct = EXCLUDED.is_correct, submitted_at = EXCLUDED.submitted_at
    `);

    res.json({ correct: isCorrect, flagType, message: isCorrect ? "¡Flag correcta! 🎉" : "Flag incorrecta. Sigue intentando." });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/lab/machines/:slug/my-flags?userId=X
router.get("/lab/machines/:slug/my-flags", async (req, res) => {
  try {
    const userId = safeInt(req.query.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(400).json({ error: "userId requerido" });
    const slug = sanitizeStr(req.params.slug, 100);
    if (!slug) return res.status(400).json({ error: "Slug inválido" });

    const rows = await db.select().from(flagSubmissionsTable)
      .where(and(eq(flagSubmissionsTable.userId, userId), eq(flagSubmissionsTable.machineSlug, slug)));

    const userOwned = rows.find(r => r.flagType === "user" && r.isCorrect);
    const rootOwned = rows.find(r => r.flagType === "root" && r.isCorrect);
    res.json({ userOwned: !!userOwned, rootOwned: !!rootOwned });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/lab/machines/:slug/notes?userId=X
router.get("/lab/machines/:slug/notes", async (req, res) => {
  try {
    const userId = safeInt(req.query.userId, 0, 1, 1_000_000);
    if (!userId) return res.status(400).json({ error: "userId requerido" });
    const slug = sanitizeStr(req.params.slug, 100);
    if (!slug) return res.status(400).json({ error: "Slug inválido" });

    const rows = await db.select().from(machineNotesTable)
      .where(and(eq(machineNotesTable.userId, userId), eq(machineNotesTable.machineSlug, slug)));
    res.json({ content: rows[0]?.content ?? "" });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/lab/machines/:slug/notes
router.put("/lab/machines/:slug/notes", async (req, res) => {
  try {
    const raw    = req.body as Record<string, unknown>;
    const userId  = safeInt(raw.userId, 0, 1, 1_000_000);
    const content = sanitizeStr(raw.content, 20000) ?? "";
    if (!userId) return res.status(400).json({ error: "userId requerido" });
    const slug = sanitizeStr(req.params.slug, 100);
    if (!slug) return res.status(400).json({ error: "Slug inválido" });

    await db.execute(sql`
      INSERT INTO machine_notes (user_id, machine_slug, content, updated_at)
      VALUES (${userId}, ${slug}, ${content}, now())
      ON CONFLICT (user_id, machine_slug)
      DO UPDATE SET content = EXCLUDED.content, updated_at = EXCLUDED.updated_at
    `);
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
