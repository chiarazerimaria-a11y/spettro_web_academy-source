import { db, labMachinesTable, teamsTable, certificationsTable } from "@workspace/db";

const characters = ["skull", "robot", "demon", "spider", "ghost", "dragon", "virus", "ninja", "phantom", "cyber", "eye", "kraken"] as const;

const vulnerabilities = {
  facil: [
    "SQL Injection en panel de login — extracción de credenciales admin con sqlmap",
    "LFI (Local File Inclusion) — lectura de /etc/passwd y claves SSH",
    "Contraseña débil por defecto en servicio FTP — acceso como usuario privilegiado",
    "Directorio .git expuesto — reconstrucción de código fuente con credenciales en historial",
    "Panel WordPress desactualizado con plugin vulnerable — RCE via upload malicioso",
    "SUID binary mal configurado — escalada de privilegios a root con binario personalizado",
    "Credenciales hardcodeadas en archivo de configuración accesible por web",
    "Enumeración de usuarios SSH con tiempo de respuesta diferencial",
    "Servidor Samba con permisos anónimos — acceso a shares internos",
    "Base de datos MySQL sin contraseña expuesta en red local",
  ],
  medio: [
    "SSRF (Server-Side Request Forgery) — pivoting a servicios internos no expuestos",
    "Deserialización insegura en Java — ejecución de comandos como root",
    "XXE (XML External Entity) — exfiltración de archivos del sistema",
    "RCE via Server Template Injection en Jinja2 (Python/Flask)",
    "Buffer overflow en servicio custom en puerto alto — shellcode x86",
    "Command injection encadenado en parámetro de consulta DNS",
    "OAuth token theft via open redirect + session hijacking",
    "Escalada via sudo con restricciones bypass usando wildcards",
    "Redis sin autenticación expuesto — escritura de cron job malicioso",
    "Path traversal en API REST + escritura de webshell PHP",
  ],
  dificil: [
    "Active Directory: Kerberoasting + Pass-the-Hash + DCSync para volcar NTDS",
    "Race condition en asignación de permisos de archivo — TOCTOU exploit",
    "Return-Oriented Programming (ROP chain) en binario con ASLR y NX activados",
    "JWT algorithm confusion (RS256→HS256) — forja de tokens admin",
    "CVE-2021-3156 (Heap overflow en sudo) — privilege escalation sin contraseña",
    "SMB relay con Responder + ntlmrelayx en red de dominio Windows",
    "Prototype pollution en Node.js → RCE en servidor de producción",
    "Escape de contenedor Docker via mount de /proc del host",
    "Blind SQL injection time-based en campo oculto — dump completo de BD",
    "Bypas de 2FA via manipulación de respuesta HTTP interceptada con Burp",
  ],
  insano: [
    "Kernel exploit CVE-2022-0847 (Dirty Pipe) — escritura arbitraria en archivos root",
    "Explotación de hypervisor via VMESCAPE — escape de VM al host físico",
    "Zero-day en protocolo LDAP personalizado — fuzzing binario + exploit desarrollo",
    "Ataque de cadena de suministro en pipeline CI/CD — comprometer servidor de builds",
    "Evasión de EDR corporativo + persistencia en memoria (fileless malware)",
    "CVE-2023-23397 (Outlook NTLM theft) — captura de hash sin interacción",
    "Explotación de race condition en kernel Linux — escalada desde container",
    "Chained exploits: LFI→Log Poisoning→RCE→Kernel exploit en cadena completa",
    "Ataque SAML en SSO corporativo — forja de assertions XML firmadas",
    "Compromiso total de red corporativa: foothold→lateral movement→DA en 4 pasos",
  ],
};

const techniquesByDifficulty = {
  facil: ["nmap", "gobuster", "nikto", "sqlmap", "hydra", "netcat", "enum4linux", "wpscan"],
  medio: ["burpsuite", "metasploit", "chisel", "linpeas", "pspy64", "evil-winrm", "impacket", "ffuf"],
  dificil: ["bloodhound", "crackmapexec", "responder", "kerbrute", "mimikatz", "ghidra", "gdb-peda", "pwntools"],
  insano: ["ida-pro", "windbg", "volatility", "frida", "qemu-exploit", "kernel-debugging", "rop-gadgets", "heap-grooming"],
};

const machines = [
  // FACIL - Linux (40)
  { name: "Medusa", slug: "medusa", os: "Linux", difficulty: "facil", char: "demon", points: 20, solveCount: 1847, vuln: 0 },
  { name: "Pandora", slug: "pandora", os: "Linux", difficulty: "facil", char: "skull", points: 20, solveCount: 2103, vuln: 1 },
  { name: "ApiRoot", slug: "apiroot", os: "Linux", difficulty: "facil", char: "robot", points: 20, solveCount: 934, vuln: 2 },
  { name: "Gaara", slug: "gaara", os: "Linux", difficulty: "facil", char: "ninja", points: 20, solveCount: 1562, vuln: 3 },
  { name: "Chatty", slug: "chatty", os: "Linux", difficulty: "facil", char: "ghost", points: 20, solveCount: 789, vuln: 4 },
  { name: "Blocking", slug: "blocking", os: "Linux", difficulty: "facil", char: "cyber", points: 20, solveCount: 445, vuln: 5 },
  { name: "Botnet", slug: "botnet", os: "Linux", difficulty: "facil", char: "virus", points: 20, solveCount: 612, vuln: 6 },
  { name: "Comet", slug: "comet", os: "Linux", difficulty: "facil", char: "dragon", points: 20, solveCount: 388, vuln: 7 },
  { name: "Chimera", slug: "chimera", os: "Linux", difficulty: "facil", char: "spider", points: 20, solveCount: 723, vuln: 8 },
  { name: "Grillo", slug: "grillo", os: "Linux", difficulty: "facil", char: "eye", points: 20, solveCount: 519, vuln: 9 },
  { name: "Loly", slug: "loly", os: "Linux", difficulty: "facil", char: "skull", points: 20, solveCount: 1234, vuln: 0 },
  { name: "Media", slug: "media", os: "Linux", difficulty: "facil", char: "robot", points: 20, solveCount: 867, vuln: 1 },
  { name: "Nora", slug: "nora", os: "Linux", difficulty: "facil", char: "phantom", points: 20, solveCount: 654, vuln: 2 },
  { name: "Pablo", slug: "pablo", os: "Linux", difficulty: "facil", char: "ninja", points: 20, solveCount: 432, vuln: 3 },
  { name: "Rooftop", slug: "rooftop", os: "Linux", difficulty: "facil", char: "ghost", points: 20, solveCount: 298, vuln: 4 },
  { name: "Shocker", slug: "shocker", os: "Linux", difficulty: "facil", char: "virus", points: 20, solveCount: 1876, vuln: 5 },
  { name: "Skynet", slug: "skynet", os: "Linux", difficulty: "facil", char: "cyber", points: 20, solveCount: 2341, vuln: 6 },
  { name: "Teatime", slug: "teatime", os: "Linux", difficulty: "facil", char: "demon", points: 20, solveCount: 567, vuln: 7 },
  { name: "Terra", slug: "terra", os: "Linux", difficulty: "facil", char: "dragon", points: 20, solveCount: 789, vuln: 8 },
  { name: "Trollcave", slug: "trollcave", os: "Linux", difficulty: "facil", char: "kraken", points: 20, solveCount: 445, vuln: 9 },
  { name: "Eagleye", slug: "eagleye", os: "Linux", difficulty: "facil", char: "eye", points: 20, solveCount: 334, vuln: 0 },
  { name: "Eva", slug: "eva", os: "Linux", difficulty: "facil", char: "phantom", points: 20, solveCount: 678, vuln: 1 },
  { name: "GitHacker", slug: "githacker", os: "Linux", difficulty: "facil", char: "robot", points: 20, solveCount: 921, vuln: 2 },
  { name: "Heist", slug: "heist", os: "Linux", difficulty: "facil", char: "ninja", points: 20, solveCount: 543, vuln: 3 },
  { name: "Ice", slug: "ice", os: "Linux", difficulty: "facil", char: "skull", points: 20, solveCount: 765, vuln: 4 },
  { name: "Layer", slug: "layer", os: "Linux", difficulty: "facil", char: "spider", points: 20, solveCount: 234, vuln: 5 },
  { name: "Logan", slug: "logan", os: "Linux", difficulty: "facil", char: "demon", points: 20, solveCount: 876, vuln: 6 },
  { name: "Moment", slug: "moment", os: "Linux", difficulty: "facil", char: "ghost", points: 20, solveCount: 432, vuln: 7 },
  { name: "Nebula", slug: "nebula", os: "Linux", difficulty: "facil", char: "cyber", points: 20, solveCount: 654, vuln: 8 },
  { name: "Overflow", slug: "overflow", os: "Linux", difficulty: "facil", char: "kraken", points: 20, solveCount: 543, vuln: 9 },
  { name: "Joker", slug: "joker", os: "Linux", difficulty: "facil", char: "demon", points: 20, solveCount: 1432, vuln: 0 },
  { name: "Mirage", slug: "mirage", os: "Linux", difficulty: "facil", char: "phantom", points: 20, solveCount: 678, vuln: 1 },
  { name: "Registry", slug: "registry", os: "Linux", difficulty: "facil", char: "robot", points: 20, solveCount: 987, vuln: 2 },
  { name: "Seeker", slug: "seeker", os: "Linux", difficulty: "facil", char: "eye", points: 20, solveCount: 456, vuln: 3 },
  { name: "Silence", slug: "silence", os: "Linux", difficulty: "facil", char: "ghost", points: 20, solveCount: 765, vuln: 4 },
  { name: "Sneaky", slug: "sneaky", os: "Linux", difficulty: "facil", char: "ninja", points: 20, solveCount: 543, vuln: 5 },
  { name: "Unika", slug: "unika", os: "Linux", difficulty: "facil", char: "skull", points: 20, solveCount: 876, vuln: 6 },
  { name: "Vault", slug: "vault", os: "Linux", difficulty: "facil", char: "virus", points: 20, solveCount: 234, vuln: 7 },
  { name: "Walthrough", slug: "walthrough", os: "Linux", difficulty: "facil", char: "spider", points: 20, solveCount: 345, vuln: 8 },
  { name: "Zero", slug: "zero", os: "Linux", difficulty: "facil", char: "cyber", points: 20, solveCount: 1123, vuln: 9 },
  // MEDIO - Linux + Windows (30)
  { name: "Xerxes", slug: "xerxes", os: "Linux", difficulty: "medio", char: "demon", points: 30, solveCount: 567, vuln: 0 },
  { name: "Thor", slug: "thor", os: "Linux", difficulty: "medio", char: "skull", points: 30, solveCount: 432, vuln: 1 },
  { name: "Temptation", slug: "temptation", os: "Linux", difficulty: "medio", char: "phantom", points: 30, solveCount: 298, vuln: 2 },
  { name: "Cmspit", slug: "cmspit", os: "Linux", difficulty: "medio", char: "robot", points: 30, solveCount: 387, vuln: 3 },
  { name: "Codeshell", slug: "codeshell", os: "Linux", difficulty: "medio", char: "virus", points: 30, solveCount: 456, vuln: 4 },
  { name: "Database", slug: "database", os: "Linux", difficulty: "medio", char: "kraken", points: 30, solveCount: 543, vuln: 5 },
  { name: "Darkdump", slug: "darkdump", os: "Linux", difficulty: "medio", char: "ghost", points: 30, solveCount: 234, vuln: 6 },
  { name: "Paradise", slug: "paradise", os: "Linux", difficulty: "medio", char: "dragon", points: 30, solveCount: 345, vuln: 7 },
  { name: "Pwned", slug: "pwned", os: "Linux", difficulty: "medio", char: "ninja", points: 30, solveCount: 678, vuln: 8 },
  { name: "Revenge", slug: "revenge", os: "Linux", difficulty: "medio", char: "eye", points: 30, solveCount: 432, vuln: 9 },
  { name: "Sickos", slug: "sickos", os: "Linux", difficulty: "medio", char: "virus", points: 30, solveCount: 321, vuln: 0 },
  { name: "Solidstate", slug: "solidstate", os: "Linux", difficulty: "medio", char: "robot", points: 30, solveCount: 876, vuln: 1 },
  { name: "Solt", slug: "solt", os: "Linux", difficulty: "medio", char: "skull", points: 30, solveCount: 234, vuln: 2 },
  { name: "Subzone", slug: "subzone", os: "Linux", difficulty: "medio", char: "cyber", points: 30, solveCount: 456, vuln: 3 },
  { name: "Symfonos", slug: "symfonos", os: "Linux", difficulty: "medio", char: "demon", points: 30, solveCount: 789, vuln: 4 },
  { name: "Traverxec", slug: "traverxec", os: "Linux", difficulty: "medio", char: "spider", points: 30, solveCount: 654, vuln: 5 },
  { name: "Undercover", slug: "undercover", os: "Linux", difficulty: "medio", char: "phantom", points: 30, solveCount: 345, vuln: 6 },
  { name: "Val", slug: "val", os: "Linux", difficulty: "medio", char: "ghost", points: 30, solveCount: 234, vuln: 7 },
  { name: "Villainous", slug: "villainous", os: "Linux", difficulty: "medio", char: "kraken", points: 30, solveCount: 123, vuln: 8 },
  { name: "Yellowface", slug: "yellowface", os: "Linux", difficulty: "medio", char: "eye", points: 30, solveCount: 456, vuln: 9 },
  { name: "Sauna", slug: "sauna", os: "Windows", difficulty: "medio", char: "skull", points: 30, solveCount: 987, vuln: 0 },
  { name: "Resolute", slug: "resolute", os: "Windows", difficulty: "medio", char: "robot", points: 30, solveCount: 765, vuln: 1 },
  { name: "Reel", slug: "reel", os: "Windows", difficulty: "medio", char: "demon", points: 30, solveCount: 543, vuln: 2 },
  { name: "Monteverde", slug: "monteverde", os: "Windows", difficulty: "medio", char: "phantom", points: 30, solveCount: 432, vuln: 3 },
  { name: "Cascade", slug: "cascade", os: "Windows", difficulty: "medio", char: "ghost", points: 30, solveCount: 654, vuln: 4 },
  { name: "Blackfield", slug: "blackfield", os: "Windows", difficulty: "medio", char: "ninja", points: 30, solveCount: 345, vuln: 5 },
  { name: "Remote", slug: "remote", os: "Windows", difficulty: "medio", char: "virus", points: 30, solveCount: 876, vuln: 6 },
  { name: "Nest", slug: "nest", os: "Windows", difficulty: "medio", char: "spider", points: 30, solveCount: 432, vuln: 7 },
  { name: "Fuse", slug: "fuse", os: "Windows", difficulty: "medio", char: "cyber", points: 30, solveCount: 234, vuln: 8 },
  { name: "Multimaster", slug: "multimaster", os: "Windows", difficulty: "medio", char: "kraken", points: 30, solveCount: 123, vuln: 9 },
  // DIFICIL - Linux + Windows (20)
  { name: "Minotaur", slug: "minotaur", os: "Linux", difficulty: "dificil", char: "kraken", points: 40, solveCount: 123, vuln: 0 },
  { name: "Cerberus", slug: "cerberus", os: "Linux", difficulty: "dificil", char: "demon", points: 40, solveCount: 87, vuln: 1 },
  { name: "Hades", slug: "hades", os: "Linux", difficulty: "dificil", char: "skull", points: 40, solveCount: 65, vuln: 2 },
  { name: "Olympus", slug: "olympus", os: "Linux", difficulty: "dificil", char: "dragon", points: 40, solveCount: 98, vuln: 3 },
  { name: "Phoenix", slug: "phoenix", os: "Linux", difficulty: "dificil", char: "phantom", points: 40, solveCount: 145, vuln: 4 },
  { name: "Chimera2", slug: "chimera2", os: "Linux", difficulty: "dificil", char: "spider", points: 40, solveCount: 67, vuln: 5 },
  { name: "Tartarus", slug: "tartarus", os: "Linux", difficulty: "dificil", char: "virus", points: 40, solveCount: 54, vuln: 6 },
  { name: "Styx", slug: "styx", os: "Linux", difficulty: "dificil", char: "ghost", points: 40, solveCount: 89, vuln: 7 },
  { name: "Elysium", slug: "elysium", os: "Linux", difficulty: "dificil", char: "eye", points: 40, solveCount: 76, vuln: 8 },
  { name: "Morpheus", slug: "morpheus", os: "Linux", difficulty: "dificil", char: "robot", points: 40, solveCount: 123, vuln: 9 },
  { name: "Hecate", slug: "hecate", os: "Linux", difficulty: "dificil", char: "ninja", points: 40, solveCount: 45, vuln: 0 },
  { name: "Kronos", slug: "kronos", os: "Linux", difficulty: "dificil", char: "cyber", points: 40, solveCount: 87, vuln: 1 },
  { name: "Atlas", slug: "atlas", os: "Windows", difficulty: "dificil", char: "kraken", points: 40, solveCount: 67, vuln: 2 },
  { name: "Prometheus", slug: "prometheus", os: "Windows", difficulty: "dificil", char: "demon", points: 40, solveCount: 54, vuln: 3 },
  { name: "Poseidon", slug: "poseidon", os: "Windows", difficulty: "dificil", char: "skull", points: 40, solveCount: 98, vuln: 4 },
  { name: "Ares", slug: "ares", os: "Windows", difficulty: "dificil", char: "dragon", points: 40, solveCount: 76, vuln: 5 },
  { name: "Athena", slug: "athena", os: "Windows", difficulty: "dificil", char: "phantom", points: 40, solveCount: 45, vuln: 6 },
  { name: "Apollo", slug: "apollo", os: "Windows", difficulty: "dificil", char: "ghost", points: 40, solveCount: 89, vuln: 7 },
  { name: "Hermes", slug: "hermes", os: "Windows", difficulty: "dificil", char: "eye", points: 40, solveCount: 67, vuln: 8 },
  { name: "Dionysus", slug: "dionysus", os: "Windows", difficulty: "dificil", char: "virus", points: 40, solveCount: 34, vuln: 9 },
  // INSANO (10)
  { name: "Abyssal", slug: "abyssal", os: "Linux", difficulty: "insano", char: "kraken", points: 60, solveCount: 12, vuln: 0 },
  { name: "Nightmare", slug: "nightmare", os: "Linux", difficulty: "insano", char: "demon", points: 60, solveCount: 8, vuln: 1 },
  { name: "Oblivion", slug: "oblivion", os: "Linux", difficulty: "insano", char: "skull", points: 60, solveCount: 15, vuln: 2 },
  { name: "Vortex", slug: "vortex", os: "Linux", difficulty: "insano", char: "ghost", points: 60, solveCount: 21, vuln: 3 },
  { name: "Entropy", slug: "entropy", os: "Linux", difficulty: "insano", char: "virus", points: 60, solveCount: 7, vuln: 4 },
  { name: "Paradox", slug: "paradox", os: "Windows", difficulty: "insano", char: "robot", points: 60, solveCount: 18, vuln: 5 },
  { name: "Eclipse", slug: "eclipse", os: "Windows", difficulty: "insano", char: "phantom", points: 60, solveCount: 9, vuln: 6 },
  { name: "Singularity", slug: "singularity", os: "Windows", difficulty: "insano", char: "eye", points: 60, solveCount: 6, vuln: 7 },
  { name: "Cipher", slug: "cipher", os: "Linux", difficulty: "insano", char: "cyber", points: 60, solveCount: 11, vuln: 8 },
  { name: "Apophis", slug: "apophis", os: "Linux", difficulty: "insano", char: "dragon", points: 60, solveCount: 4, vuln: 9 },
];

const descriptions: Record<string, string> = {
  facil: "Máquina de nivel introductorio ideal para practicar reconocimiento básico, enumeración de servicios y explotación de vulnerabilidades conocidas. Perfecta para preparar la eJPTv2.",
  medio: "Nivel intermedio que requiere encadenar varias técnicas. Necesitarás enumerar con profundidad, explotar la vulnerabilidad y escalar privilegios de forma no trivial.",
  dificil: "Máquina avanzada con múltiples vectores de ataque y pivoting. Requiere conocimientos sólidos de Active Directory, explotación binaria o técnicas de post-explotación complejas.",
  insano: "La élite de SpettroWeb. Solo los mejores hackers del mundo han completado estas máquinas. Requiere desarrollo de exploits personalizados y conocimiento profundo de sistemas.",
};

async function seed() {
  console.log("Seeding lab machines...");

  await db.delete(labMachinesTable);

  const rows = machines.map((m) => {
    const vulnList = vulnerabilities[m.difficulty as keyof typeof vulnerabilities];
    const techList = techniquesByDifficulty[m.difficulty as keyof typeof techniquesByDifficulty];
    return {
      name: m.name,
      slug: m.slug,
      os: m.os,
      difficulty: m.difficulty,
      characterType: m.char,
      points: m.points,
      description: descriptions[m.difficulty],
      vulnerability: vulnList[m.vuln % vulnList.length],
      techniques: techList.slice(0, 4).join(", "),
      hints: `Empieza con un escaneo nmap completo. Presta atención a los puertos poco comunes. La escalada de privilegios tiene una pista en los archivos de configuración.`,
      downloadUrl: `https://vulnyx.com/machines/${m.slug}.ova`,
      writeupUrl: null,
      videoUrl: null,
      solveCount: m.solveCount,
      isActive: true,
    };
  });

  await db.insert(labMachinesTable).values(rows);
  console.log(`Inserted ${rows.length} lab machines`);

  // Seed teams
  await db.delete(teamsTable);
  const teamRows = [
    { name: "Shadow Wolves", slug: "shadow-wolves", description: "Equipo de élite especializado en AD y explotación Windows", memberCount: 5, totalPoints: 3420, rank: "Elite" },
    { name: "Null Pointers", slug: "null-pointers", description: "Expertos en reversing y explotación binaria", memberCount: 3, totalPoints: 1870, rank: "Pro" },
    { name: "Red Storm", slug: "red-storm", description: "Especialistas en web hacking y bug bounty", memberCount: 7, totalPoints: 4120, rank: "Elite" },
    { name: "Phantom Gate", slug: "phantom-gate", description: "Equipo de CTF competitivo, campeones regionales 2024", memberCount: 4, totalPoints: 2890, rank: "Pro" },
    { name: "Byte Bandits", slug: "byte-bandits", description: "Novatos que aprenden rápido — siempre buscando miembros", memberCount: 6, totalPoints: 980, rank: "Rookie" },
    { name: "CipherPunks", slug: "cipherpunks", description: "Cryptography y hardware hacking lovers", memberCount: 2, totalPoints: 1240, rank: "Intermediate" },
    { name: "Ghost Protocol", slug: "ghost-protocol", description: "Pentesters profesionales que entrenan juntos los fines de semana", memberCount: 8, totalPoints: 5670, rank: "Legend" },
    { name: "Zero Day Club", slug: "zero-day-club", description: "Solo para los que han completado al menos 1 máquina Insana", memberCount: 3, totalPoints: 3100, rank: "Elite" },
  ];
  await db.insert(teamsTable).values(teamRows);
  console.log(`Inserted ${teamRows.length} teams`);

  // Seed certifications
  await db.delete(certificationsTable);
  const certRows = [
    { name: "Infiltrador Novato", code: "SPN-01", level: "principiante", description: "Primer paso en el mundo del hacking ético. Demuestra que dominas el reconocimiento y la enumeración básica.", requirements: "Completa 5 máquinas de nivel Fácil y obtén 100 puntos", machinesNeeded: 5, pointsNeeded: 100, badgeColor: "#00ffff", isActive: true },
    { name: "Hacker Junior", code: "SPN-02", level: "principiante", description: "Has demostrado capacidad para explotar vulnerabilidades web comunes y escalar privilegios en entornos Linux.", requirements: "Completa 15 máquinas (10 Fácil + 5 Medio) y obtén 350 puntos", machinesNeeded: 15, pointsNeeded: 350, badgeColor: "#00ff88", isActive: true },
    { name: "SpettroWeb eJPT Ready", code: "SPW-eJPT", level: "principiante", description: "Certificación oficial de SpettroWeb que valida tu preparación total para superar el examen eJPTv2 de INE Security.", requirements: "Completa el curso eJPTv2 + 20 máquinas + examen práctico en plataforma", machinesNeeded: 20, pointsNeeded: 500, badgeColor: "#ff00ff", isActive: true },
    { name: "Red Team Operative", code: "SPN-03", level: "intermedio", description: "Nivel intermedio. Dominas técnicas de post-explotación, pivoting y ataque a entornos Active Directory básicos.", requirements: "Completa 30 máquinas (incluye 10 Medio) y obtén 800 puntos", machinesNeeded: 30, pointsNeeded: 800, badgeColor: "#ff6600", isActive: true },
    { name: "SpettroWeb OSCP Ready", code: "SPW-OSCP", level: "intermedio", description: "Preparación validada para el OSCP de OffSec. Demuestra que puedes completar un pentest completo con documentación profesional.", requirements: "Completa 40 máquinas (incluye 15 Difícil) + laboratorio de red completo", machinesNeeded: 40, pointsNeeded: 1400, badgeColor: "#ff3333", isActive: true },
    { name: "Ghost Operator", code: "SPN-04", level: "avanzado", description: "Élite de SpettroWeb. Has demostrado habilidades avanzadas en explotación binaria, Active Directory y evasión de defensas.", requirements: "Completa 60 máquinas (incluye 5 Insano) y obtén 2500 puntos", machinesNeeded: 60, pointsNeeded: 2500, badgeColor: "#cc00ff", isActive: true },
    { name: "SpettroWeb Legend", code: "SPW-LEG", level: "avanzado", description: "El trofeo más alto de la plataforma. Solo los mejores hackers del mundo ostentan esta certificación.", requirements: "Completa TODAS las máquinas Insano + ranking top 10 global", machinesNeeded: 100, pointsNeeded: 5000, badgeColor: "#ffd700", isActive: true },
  ];
  await db.insert(certificationsTable).values(certRows);
  console.log(`Inserted ${certRows.length} certifications`);

  console.log("Lab seeding complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
