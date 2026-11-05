import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Lock, Unlock, Zap } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

export type Rarity = "Común" | "Raro" | "Épico" | "Legendario";

export interface ProfileStatsData {
  user: {
    id: number;
    username: string;
    joinedAt: string;
    totalPoints: number;
    machinesSolved: number;
    flagsCaptured: number;
    globalRank: number;
  };
  skills: {
    id: string;
    label: string;
    color: string;
    pct: number;
    solved: number;
    total: number;
    earnedPoints: number;
    maxPoints: number;
  }[];
  trophies: {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    current: number;
    target: number;
    unlocked: boolean;
    date: string | null;
  }[];
  certifications: {
    id: number;
    code: string;
    name: string;
    level: string;
    badgeColor: string;
    pointsNeeded: number;
    machinesNeeded: number;
    progress: number;
    unlocked: boolean;
  }[];
  activity: { type: "pwn" | "fail"; text: string; pts: number | null; at: string }[];
  milestones: { id: string; label: string; current: number; target: number; done: boolean }[];
}

type Trophy = ProfileStatsData["trophies"][number];

/** Datos reales del perfil (habilidades, trofeos, certificaciones, actividad, hitos). */
export function useProfileStats(userId?: number) {
  return useQuery<ProfileStatsData>({
    queryKey: ["profile-stats", userId],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/profile/${userId}/stats`);
      if (!r.ok) throw new Error("No se pudieron cargar las estadisticas");
      return r.json();
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

const RARITY: Record<string, { border: string; glow: string; textColor: string; icon: string; bg: string }> = {
  Común:      { border: "border-gray-600/30",   glow: "#6b7280", textColor: "text-gray-400",   icon: "🏅", bg: "bg-gray-800/10" },
  Raro:       { border: "border-blue-500/50",   glow: "#3b82f6", textColor: "text-blue-400",   icon: "💎", bg: "bg-blue-900/10" },
  Épico:      { border: "border-purple-500/60", glow: "#a855f7", textColor: "text-purple-400", icon: "🔮", bg: "bg-purple-900/10" },
  Legendario: { border: "border-yellow-500/70", glow: "#eab308", textColor: "text-yellow-400", icon: "⭐", bg: "bg-yellow-900/10" },
};

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-ES") : "");

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("es-ES");
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

const Loading = ({ text }: { text: string }) => (
  <div className="font-mono text-xs text-muted-foreground border border-white/5 p-4 rounded-xl bg-white/[0.02]">{text}</div>
);

// ── Arbol de habilidades ──────────────────────────────────────────────────────
export function SkillTree({ stats }: { stats?: ProfileStatsData }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h2 className="text-base font-mono font-bold mb-4 text-primary flex items-center gap-2">
        <span className="text-secondary">&gt;</span> ÁRBOL_DE_HABILIDADES
      </h2>
      {!stats ? (
        <Loading text="Cargando habilidades..." />
      ) : (
        <div className="rounded-xl border border-white/8 bg-[#060610] p-5 space-y-4">
          {stats.skills.map((s, idx) => {
            const soon = s.total === 0;
            const filled = Math.round(s.pct / 20);
            return (
              <div key={s.id} className={soon ? "opacity-40" : ""}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono text-xs text-muted-foreground">{s.label}</span>
                  <div className="flex items-center gap-2">
                    {soon ? (
                      <span className="font-mono text-[10px] text-muted-foreground">PRÓXIMAMENTE</span>
                    ) : (
                      <>
                        <span className="font-mono text-[10px] text-muted-foreground/60">{s.solved}/{s.total} máquinas</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="w-2 h-2 rounded-sm"
                              style={{ background: i < filled ? s.color : "rgba(255,255,255,0.06)", boxShadow: i < filled ? `0 0 4px ${s.color}` : "none" }} />
                          ))}
                        </div>
                        <span className="font-mono text-xs font-bold w-8 text-right" style={{ color: s.color }}>{s.pct}%</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 1, delay: 0.3 + idx * 0.07, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${s.color}40, ${s.color})`, boxShadow: `0 0 8px ${s.color}60` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}

// ── Sala de trofeos ───────────────────────────────────────────────────────────
function TrophyCard({ trophy, index }: { trophy: Trophy; index: number }) {
  const r = RARITY[trophy.rarity] || RARITY["Común"];
  const pct = trophy.target > 0 ? Math.round((trophy.current / trophy.target) * 100) : 0;

  if (!trophy.unlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07, duration: 0.4 }}
        title={trophy.description}
        className="relative rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col items-center text-center gap-1.5 overflow-hidden opacity-60"
      >
        <span className="text-2xl grayscale">🔒</span>
        <span className="font-mono text-xs font-bold text-muted-foreground">{trophy.name}</span>
        <span className="font-mono text-[9px] text-muted-foreground/70 leading-tight">{trophy.description}</span>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-white/30" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-[9px] text-muted-foreground">{trophy.current}/{trophy.target}</span>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-white/10 text-muted-foreground opacity-70">{trophy.rarity}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.4 }} whileHover={{ y: -6, scale: 1.06 }}
      title={trophy.description}
      className={`relative rounded-xl border ${r.border} ${r.bg} p-4 flex flex-col items-center text-center gap-1.5 overflow-hidden`}
      style={{ boxShadow: `0 0 10px ${r.glow}20` }}
    >
      <span className="text-2xl">{r.icon}</span>
      <span className={`font-mono text-xs font-bold ${r.textColor}`}>{trophy.name}</span>
      <span className="font-mono text-[9px] text-muted-foreground">{fmtDate(trophy.date)}</span>
      <span className={`font-mono text-[9px] px-2 py-0.5 rounded border ${r.border} ${r.textColor} opacity-70`}>{trophy.rarity}</span>
    </motion.div>
  );
}

export function TrophyHall({ stats }: { stats?: ProfileStatsData }) {
  const unlocked = stats ? stats.trophies.filter((t) => t.unlocked).length : 0;
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
      <h2 className="text-base font-mono font-bold mb-4 text-primary flex items-center gap-2">
        <span className="text-secondary">&gt;</span> SALA_DE_TROFEOS
        {stats && (
          <span className="ml-auto text-xs text-muted-foreground font-normal">{unlocked} de {stats.trophies.length} desbloqueados</span>
        )}
      </h2>
      {!stats ? (
        <Loading text="Cargando trofeos..." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.trophies.map((t, i) => <TrophyCard key={t.id} trophy={t} index={i} />)}
        </div>
      )}
    </motion.section>
  );
}

// ── Progreso de certificaciones ───────────────────────────────────────────────
export function CertificationProgress({ stats }: { stats?: ProfileStatsData }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <h2 className="text-base font-mono font-bold mb-4 text-primary flex items-center gap-2">
        <span className="text-secondary">&gt;</span> PROGRESO_CERTIFICACIONES
      </h2>
      {!stats ? (
        <Loading text="Cargando certificaciones..." />
      ) : stats.certifications.length === 0 ? (
        <Loading text="Todavía no hay certificaciones disponibles." />
      ) : (
        <div className="space-y-2">
          {stats.certifications.map((cert, i) => (
            <div key={cert.id}
              className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${cert.unlocked ? "border-primary/25 bg-primary/[0.04]" : "border-white/5 bg-white/[0.015]"}`}>
              <div className={`p-2.5 rounded-lg shrink-0 ${cert.unlocked ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                {cert.unlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`font-mono text-sm font-bold truncate ${cert.unlocked ? "text-white" : "text-muted-foreground"}`}>
                    {cert.code} — {cert.name}
                  </span>
                  <span className="font-mono text-xs ml-3 shrink-0" style={{ color: cert.progress > 0 ? "#ff4db8" : undefined }}>
                    {cert.progress}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cert.progress}%` }}
                    transition={{ duration: 1.2, delay: i * 0.15 }}
                    className="h-full rounded-full"
                    style={{
                      background: cert.progress > 0 ? "linear-gradient(90deg,#ff4db860,#ff4db8)" : "transparent",
                      boxShadow: cert.progress > 0 ? "0 0 10px #ff4db8" : "none",
                    }} />
                </div>
                <p className="font-mono text-[9px] text-muted-foreground/60 mt-1">
                  {cert.pointsNeeded} puntos · {cert.machinesNeeded} máquinas
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

// ── Misiones de nivel (hitos reales) ──────────────────────────────────────────
export function LevelMilestones({ stats, hasSquad, level }: { stats?: ProfileStatsData; hasSquad: boolean; level: number }) {
  const items = [
    ...(stats ? stats.milestones : []),
    { id: "squad", label: "Únete a un equipo", current: hasSquad ? 1 : 0, target: 1, done: hasSquad },
  ];
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
      <div className="rounded-xl border border-white/8 bg-[#060610] p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-mono font-bold text-primary flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4" /> MISIONES DE NIVEL
          </h3>
          <span className="text-xs font-mono text-muted-foreground">→ Nivel {level + 1}</span>
        </div>
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 font-mono text-[10px] ${m.done ? "bg-primary/20 border-primary text-primary" : "border-white/20"}`}>
                {m.done && "✓"}
              </div>
              <span className={`text-sm font-mono flex-1 ${m.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{m.label}</span>
              <span className={`text-xs font-mono ${m.done ? "text-primary/50" : "text-secondary"}`}>{m.current}/{m.target}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ── Lineas de la terminal de actividad ────────────────────────────────────────
export function ActivityLines({ stats }: { stats?: ProfileStatsData }) {
  if (!stats) return <div className="text-muted-foreground/60">cargando actividad...</div>;
  if (stats.activity.length === 0) {
    return <div className="text-muted-foreground/60">sin actividad todavía — resuelve tu primera máquina</div>;
  }
  return (
    <>
      {stats.activity.map((act, i) => (
        <div key={i} className="flex gap-2 items-start group">
          <span className="text-muted-foreground/30 shrink-0 text-[9px] leading-5">[{fmtWhen(act.at)}]</span>
          <span className={`shrink-0 leading-5 ${act.type === "pwn" ? "text-primary" : "text-red-400"}`}>{act.type === "pwn" ? "▶▶" : "✕"}</span>
          <span className="text-foreground/75 flex-1 group-hover:text-foreground/95 transition-colors">{act.text}</span>
          {act.pts ? <span className="text-primary shrink-0 font-bold">+{act.pts}pts</span> : null}
        </div>
      ))}
    </>
  );
}
