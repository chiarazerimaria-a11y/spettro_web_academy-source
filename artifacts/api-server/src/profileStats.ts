// Estadisticas reales del perfil: habilidades, trofeos, certificaciones, actividad e hitos.
// Es una funcion pura (no toca la base de datos) para poder probarla facilmente.

export interface UserRow {
  id: number;
  username: string;
  totalPoints: number;
  machinesSolved: number;
  createdAt: Date;
}
export interface MachineRow {
  slug: string;
  name: string;
  os: string;
  difficulty: string;
  points: number;
  vulnerability: string;
  techniques: string;
  isActive: boolean;
}
export interface SubmissionRow {
  machineSlug: string;
  flagType: string;
  isCorrect: boolean;
  submittedAt: Date;
}
export interface CertRow {
  id: number;
  code: string;
  name: string;
  level: string;
  pointsNeeded: number;
  machinesNeeded: number;
  badgeColor: string;
}
export interface SessionRow {
  machineSlug: string;
  spawnedAt: Date;
}

export interface ProfileInput {
  user: UserRow;
  machines: MachineRow[];
  submissions: SubmissionRow[];
  certifications: CertRow[];
  sessions: SessionRow[];
  usersAhead: number; // usuarios con mas puntos que este
}

export type Rarity = "Común" | "Raro" | "Épico" | "Legendario";

export interface Skill {
  id: string;
  label: string;
  color: string;
  pct: number;
  solved: number;
  total: number;
  earnedPoints: number;
  maxPoints: number;
}
export interface Trophy {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  current: number;
  target: number;
  unlocked: boolean;
  date: string | null;
}
export interface CertProgress {
  id: number;
  code: string;
  name: string;
  level: string;
  badgeColor: string;
  pointsNeeded: number;
  machinesNeeded: number;
  progress: number; // 0-100
  unlocked: boolean;
}
export interface ActivityItem {
  type: "pwn" | "fail";
  text: string;
  pts: number | null;
  at: string;
}
export interface Milestone {
  id: string;
  label: string;
  current: number;
  target: number;
  done: boolean;
}
export interface ProfileStats {
  user: {
    id: number;
    username: string;
    joinedAt: string;
    totalPoints: number;
    machinesSolved: number;
    flagsCaptured: number;
    globalRank: number;
  };
  skills: Skill[];
  trophies: Trophy[];
  certifications: CertProgress[];
  activity: ActivityItem[];
  milestones: Milestone[];
}

// ─── Categorias del arbol de habilidades ─────────────────────────────────────
// Una maquina cuenta para una categoria si su "vulnerability" o "techniques"
// contiene alguna de estas palabras (sin tildes, en minusculas).
// Puedes ajustar las listas cuando quieras.
export const CATEGORIES: { id: string; label: string; color: string; keywords: string[] }[] = [
  {
    id: "web", label: "Web Exploitation", color: "#ff4db8",
    keywords: ["sql", "sqli", "xss", "lfi", "rfi", "ssrf", "csrf", "xxe", "idor", "ssti", "rce",
      "injection", "inyeccion", "upload", "web", "php", "wordpress", "joomla", "drupal", "http",
      "cms", "deserialization", "traversal", "cookie", "jwt", "api", "burp", "gobuster", "nikto",
      "tomcat", "flask"],
  },
  {
    id: "network", label: "Network & Pivoting", color: "#ff4db8",
    keywords: ["smb", "samba", "ftp", "ssh", "nfs", "snmp", "dns", "ldap", "kerberos",
      "active directory", "rdp", "pivot", "tunnel", "network", "smtp", "telnet", "rpc", "nmap",
      "vpn", "port forwarding", "proxychains", "chisel", "ligolo", "winrm"],
  },
  {
    id: "binary", label: "Binary / Reversing", color: "#9b55f9",
    keywords: ["buffer", "overflow", "binary", "binario", "reverse engineering", "reversing",
      "ingenieria inversa", "rop", "pwn", "format string", "assembly", "shellcode", "gdb", "ghidra",
      "elf", "stack", "heap", "ret2libc"],
  },
  {
    id: "crypto", label: "Criptografía", color: "#9b55f9",
    keywords: ["crypto", "cripto", "rsa", "aes", "hash", "cipher", "cifrad", "descifr", "base64",
      "xor", "encrypt", "decrypt"],
  },
  {
    id: "forensic", label: "Forense Digital", color: "#ff4db8",
    keywords: ["forens", "memory dump", "volatility", "pcap", "wireshark", "steg", "esteg",
      "autopsy", "disk image", "logs", "evidence", "evidencia", "malware analysis"],
  },
  {
    id: "osint", label: "OSINT", color: "#facc15",
    keywords: ["osint", "whois", "dork", "exif", "shodan", "social engineering", "ingenieria social",
      "footprint", "maltego", "theharvester"],
  },
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matches(text: string, words: string[], kw: string): boolean {
  if (kw.includes(" ")) return text.includes(kw);
  if (kw.length <= 3) return words.includes(kw);
  return words.some((w) => w.startsWith(kw));
}

export function categoriesOf(vulnerability: string, techniques: string): string[] {
  const text = normalize(`${vulnerability} ${techniques}`);
  const words = text.split(/[^a-z0-9]+/).filter(Boolean);
  return CATEGORIES.filter((c) => c.keywords.some((k) => matches(text, words, k))).map((c) => c.id);
}

const DAY_MS = 86_400_000;
const SPEED_LIMIT_MS = 60 * 60 * 1000;

export function streakInfo(dates: Date[], target: number): { longest: number; reachedOn: string | null } {
  const days = Array.from(new Set(dates.map((d) => d.toISOString().slice(0, 10)))).sort();
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  let reachedOn: string | null = null;
  for (const d of days) {
    const t = Date.parse(`${d}T00:00:00Z`);
    run = prev !== null && t - prev === DAY_MS ? run + 1 : 1;
    prev = t;
    if (run > longest) longest = run;
    if (run === target && !reachedOn) reachedOn = `${d}T00:00:00.000Z`;
  }
  return { longest, reachedOn };
}

function countTrophy(
  id: string, name: string, description: string, rarity: Rarity, target: number, dates: Date[],
): Trophy {
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const unlocked = sorted.length >= target;
  return {
    id, name, description, rarity, target, unlocked,
    current: Math.min(sorted.length, target),
    date: unlocked ? sorted[target - 1].toISOString() : null,
  };
}

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: "Fácil", medio: "Medio", dificil: "Difícil", insano: "Insano",
};

export function buildProfileStats(input: ProfileInput): ProfileStats {
  const { user, machines, submissions, certifications, sessions, usersAhead } = input;

  const bySlug = new Map(machines.map((m) => [m.slug, m]));
  const catsBySlug = new Map(machines.map((m) => [m.slug, categoriesOf(m.vulnerability, m.techniques)]));

  const correct = submissions.filter((s) => s.isCorrect);
  const rootSubs = correct.filter((s) => s.flagType === "root");
  const userSubs = correct.filter((s) => s.flagType === "user");
  const rootSlugs = new Set(rootSubs.map((s) => s.machineSlug));
  const userSlugs = new Set(userSubs.map((s) => s.machineSlug));

  // ── Arbol de habilidades ───────────────────────────────────────────────────
  const activeMachines = machines.filter((m) => m.isActive);
  const skills: Skill[] = CATEGORIES.map((cat) => {
    const inCat = activeMachines.filter((m) => catsBySlug.get(m.slug)?.includes(cat.id));
    let maxPoints = 0;
    let earnedPoints = 0;
    let solved = 0;
    for (const m of inCat) {
      const half = Math.floor(m.points / 2);
      maxPoints += m.points + half;
      if (rootSlugs.has(m.slug)) { earnedPoints += m.points; solved += 1; }
      if (userSlugs.has(m.slug)) earnedPoints += half;
    }
    return {
      id: cat.id, label: cat.label, color: cat.color,
      pct: maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0,
      solved, total: inCat.length, earnedPoints, maxPoints,
    };
  });

  // ── Trofeos ────────────────────────────────────────────────────────────────
  const dateOf = (s: SubmissionRow) => s.submittedAt;
  const linuxRoots = rootSubs.filter((s) => bySlug.get(s.machineSlug)?.os.toLowerCase() === "linux");
  const webRoots = rootSubs.filter((s) => catsBySlug.get(s.machineSlug)?.includes("web"));
  const speedRoots = rootSubs.filter((s) =>
    sessions.some((x) =>
      x.machineSlug === s.machineSlug &&
      s.submittedAt.getTime() >= x.spawnedAt.getTime() &&
      s.submittedAt.getTime() - x.spawnedAt.getTime() <= SPEED_LIMIT_MS,
    ),
  );
  const STREAK_TARGET = 10;
  const streak = streakInfo(correct.map(dateOf), STREAK_TARGET);

  const trophies: Trophy[] = [
    countTrophy("first_flag", "Iniciado VulnYX", "Consigue tu primera flag", "Común", 1, correct.map(dateOf)),
    countTrophy("first_pwn", "Primer Pwn", "Consigue la flag root de una máquina", "Común", 1, rootSubs.map(dateOf)),
    countTrophy("linux", "Master de Linux", "Domina 5 máquinas Linux", "Raro", 5, linuxRoots.map(dateOf)),
    countTrophy("speed", "Speed Hacker", "Consigue root en menos de 60 minutos desde que inicias la máquina", "Épico", 1, speedRoots.map(dateOf)),
    {
      id: "streak", name: "10 días seguidos", description: "Consigue flags 10 días seguidos", rarity: "Épico",
      target: STREAK_TARGET, current: Math.min(streak.longest, STREAK_TARGET),
      unlocked: streak.longest >= STREAK_TARGET, date: streak.reachedOn,
    },
    countTrophy("web", "Web Wizard", "Domina 8 máquinas web", "Legendario", 8, webRoots.map(dateOf)),
    countTrophy("hunter", "Cazador de Flags", "Consigue 30 flags", "Legendario", 30, correct.map(dateOf)),
  ];

  // ── Certificaciones ────────────────────────────────────────────────────────
  const certs: CertProgress[] = certifications.map((c) => {
    const pointsRatio = c.pointsNeeded > 0 ? user.totalPoints / c.pointsNeeded : 1;
    const machinesRatio = c.machinesNeeded > 0 ? user.machinesSolved / c.machinesNeeded : 1;
    const progress = Math.floor(Math.min(1, pointsRatio, machinesRatio) * 100);
    return {
      id: c.id, code: c.code, name: c.name, level: c.level, badgeColor: c.badgeColor,
      pointsNeeded: c.pointsNeeded, machinesNeeded: c.machinesNeeded,
      progress, unlocked: progress >= 100,
    };
  });

  // ── Actividad reciente ─────────────────────────────────────────────────────
  const activity: ActivityItem[] = [...submissions]
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
    .slice(0, 10)
    .map((s) => {
      const m = bySlug.get(s.machineSlug);
      const name = m?.name ?? s.machineSlug;
      if (!s.isCorrect) {
        return { type: "fail" as const, text: `intentó: ${name} — fail`, pts: null, at: s.submittedAt.toISOString() };
      }
      if (s.flagType === "root") {
        const diff = m ? DIFFICULTY_LABEL[m.difficulty] ?? m.difficulty : "";
        return {
          type: "pwn" as const, text: `pwned: ${name}${diff ? ` (${diff})` : ""}`,
          pts: m ? m.points : null, at: s.submittedAt.toISOString(),
        };
      }
      return {
        type: "pwn" as const, text: `user flag: ${name}`,
        pts: m ? Math.floor(m.points / 2) : null, at: s.submittedAt.toISOString(),
      };
    });

  // ── Hitos ──────────────────────────────────────────────────────────────────
  const mk = (id: string, label: string, current: number, target: number): Milestone => ({
    id, label, current: Math.min(current, target), target, done: current >= target,
  });
  const milestones: Milestone[] = [
    mk("first_machine", "Resuelve tu primera máquina", rootSlugs.size, 1),
    mk("five_machines", "Resuelve 5 máquinas", rootSlugs.size, 5),
    mk("ten_flags", "Consigue 10 flags", correct.length, 10),
    mk("points_500", "Alcanza 500 puntos", user.totalPoints, 500),
  ];

  return {
    user: {
      id: user.id, username: user.username, joinedAt: user.createdAt.toISOString(),
      totalPoints: user.totalPoints, machinesSolved: user.machinesSolved,
      flagsCaptured: correct.length, globalRank: usersAhead + 1,
    },
    skills, trophies, certifications: certs, activity, milestones,
  };
}
