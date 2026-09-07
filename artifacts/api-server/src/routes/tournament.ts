import { Router } from "express";
import { db } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { tournamentRoomsTable, tournamentChatMessagesTable } from "@workspace/db/schema";

const router = Router();

// GET /api/tournament/rooms
router.get("/tournament/rooms", async (req, res) => {
  try {
    const rooms = await db.select().from(tournamentRoomsTable)
      .orderBy(desc(tournamentRoomsTable.createdAt));
    res.json(rooms);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// GET /api/tournament/rooms/:id
router.get("/tournament/rooms/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "id inválido" });
    const [room] = await db.select().from(tournamentRoomsTable)
      .where(eq(tournamentRoomsTable.id, id));
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    res.json(room);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// GET /api/tournament/rooms/:id/chat
router.get("/tournament/rooms/:id/chat", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "id inválido" });
    const since = req.query.since as string | undefined;
    let msgs;
    if (since) {
      msgs = await db.select().from(tournamentChatMessagesTable)
        .where(eq(tournamentChatMessagesTable.roomId, id))
        .orderBy(desc(tournamentChatMessagesTable.createdAt))
        .limit(80);
    } else {
      msgs = await db.select().from(tournamentChatMessagesTable)
        .where(eq(tournamentChatMessagesTable.roomId, id))
        .orderBy(desc(tournamentChatMessagesTable.createdAt))
        .limit(80);
    }
    res.json(msgs.reverse());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// POST /api/tournament/rooms/:id/chat
router.post("/tournament/rooms/:id/chat", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "id inválido" });
    const { username, message, userColor, userId } = req.body;
    if (!message?.trim() || !username?.trim()) {
      return res.status(400).json({ error: "Mensaje y usuario requeridos" });
    }
    const [msg] = await db.insert(tournamentChatMessagesTable).values({
      roomId: id,
      userId: userId ? parseInt(userId) : undefined,
      username: username.trim().slice(0, 30),
      userColor: userColor || "text-primary",
      message: message.trim().slice(0, 500),
      isSystem: false,
    }).returning();
    res.json(msg);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// POST /api/tournament/rooms/:id/join
router.post("/tournament/rooms/:id/join", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "id inválido" });
    const [room] = await db.select().from(tournamentRoomsTable)
      .where(eq(tournamentRoomsTable.id, id));
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    const newCount = Math.min(room.currentParticipants + 1, room.maxParticipants);
    const [updated] = await db.update(tournamentRoomsTable)
      .set({ currentParticipants: newCount })
      .where(eq(tournamentRoomsTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// GET /api/tournament/rooms/:id/vpn-config — download .ovpn config
router.get("/tournament/rooms/:id/vpn-config", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "id inválido" });
    const [room] = await db.select().from(tournamentRoomsTable)
      .where(eq(tournamentRoomsTable.id, id));
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });

    const username = (req.query.username as string) || "hacker";
    const safeUser = username.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 20);
    const timestamp = Date.now();

    const ovpnContent = `# SpettroWeb Lab VPN — Torneo ${room.tournamentName}
# Sala: ${room.round} | Máquina: ${room.machineName}
# Usuario: ${safeUser} | Generado: ${new Date().toISOString()}
# ATENCIÓN: Solo ataca la IP asignada (${room.machineIp}). Prohibido escanear el resto de la red.

client
dev tun
proto udp
remote vpn.spettroweb.io 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA512
tls-client
tls-version-min 1.2
verb 3
mute 20
keepalive 10 120
compress lz4-v2

<ca>
-----BEGIN CERTIFICATE-----
MIIBszCCAVmgAwIBAgIUSpettroWebLabCA2026xX==
# [Certificate Authority SpettroWeb — DEMO]
# En producción este bloque contiene el certificado CA real.
-----END CERTIFICATE-----
</ca>

<cert>
-----BEGIN CERTIFICATE-----
MIIBpTCCAUugAwIBAgIU${safeUser}${timestamp}==
# [Certificado de cliente — ${safeUser}]
# Válido solo para: ${room.tournamentName} / ${room.round}
-----END CERTIFICATE-----
</cert>

<key>
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC
# [Clave privada del cliente — DEMO]
# NO compartir este archivo con nadie.
-----END PRIVATE KEY-----
</key>

<tls-auth>
-----BEGIN OpenVPN Static key V1-----
# [TLS Auth Key — SpettroWeb Lab]
-----END OpenVPN Static key V1-----
</tls-auth>
`;

    res.setHeader("Content-Type", "application/x-openvpn-profile");
    res.setHeader("Content-Disposition", `attachment; filename="spettroweb_lab_${safeUser}.ovpn"`);
    res.send(ovpnContent);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error generando config VPN" });
  }
});

// POST /api/tournament/rooms/:id/vpn-check — simulate VPN connectivity check
router.post("/tournament/rooms/:id/vpn-check", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "id inválido" });
    const [room] = await db.select().from(tournamentRoomsTable)
      .where(eq(tournamentRoomsTable.id, id));
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    // Simulate a check — in production this would ping the VPN gateway
    const latency = Math.floor(Math.random() * 30) + 8;
    res.json({
      connected: true,
      vpnIp: `10.8.${id}.${Math.floor(Math.random() * 200) + 50}`,
      targetIp: room.machineIp,
      latencyMs: latency,
      gateway: "vpn.spettroweb.io:1194",
      message: `VPN activa · latencia ${latency}ms · máquina alcanzable`,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

export default router;
