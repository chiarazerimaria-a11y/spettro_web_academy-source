import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Swords, Trophy, Flag, Clock, ChevronLeft, Send, Coins,
  Shield, Target, Skull, Zap, Eye, MessageSquare, Lock,
  Crown, AlertTriangle, CheckCircle, Terminal, Wifi, Star,
  TrendingUp, X, Check, Flame, DollarSign
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const EMBLEMS: Record<string, string> = {
  skull: "💀", robot: "🤖", demon: "👹", spider: "🕷️", ghost: "👻",
  dragon: "🐉", virus: "🦠", ninja: "🥷", phantom: "👤", cyber: "🔮",
  wolf: "🐺", eye: "👁️", kraken: "🐙",
};

// ── AVATAR HELPERS ─────────────────────────────────────────────────────────────
const AVATAR_PALETTES = [
  { bg: "linear-gradient(135deg,#ff4db8,#9b55f9)", border: "#ff4db8", text: "#fff" },
  { bg: "linear-gradient(135deg,#f59e0b,#ef4444)", border: "#f59e0b", text: "#000" },
  { bg: "linear-gradient(135deg,#34d399,#06b6d4)", border: "#34d399", text: "#000" },
  { bg: "linear-gradient(135deg,#9b55f9,#3b82f6)", border: "#9b55f9", text: "#fff" },
  { bg: "linear-gradient(135deg,#ef4444,#f97316)", border: "#ef4444", text: "#fff" },
  { bg: "linear-gradient(135deg,#06b6d4,#3b82f6)", border: "#06b6d4", text: "#000" },
  { bg: "linear-gradient(135deg,#f97316,#eab308)", border: "#f97316", text: "#000" },
  { bg: "linear-gradient(135deg,#ec4899,#8b5cf6)", border: "#ec4899", text: "#fff" },
];

function usernameToIndex(username: string): number {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0;
  return h % AVATAR_PALETTES.length;
}

function ChatAvatar({ username, avatarUrl, size = 28 }: { username: string; avatarUrl?: string | null; size?: number }) {
  const palette = AVATAR_PALETTES[usernameToIndex(username)];
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={username}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, boxShadow: `0 0 8px ${palette.border}60, 0 0 0 2px ${palette.border}50` }} />
    );
  }
  return (
    <div className="rounded-full shrink-0 flex items-center justify-center font-mono font-black"
      style={{
        width: size, height: size,
        background: palette.bg,
        color: palette.text,
        fontSize: size * 0.38,
        boxShadow: `0 0 10px ${palette.border}50`,
        border: `1.5px solid ${palette.border}60`,
      }}>
      {username[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

const DIFF_CONFIG: Record<string, { label: string; color: string; glow: string }> = {
  facil: { label: "FÁCIL", color: "#34d399", glow: "rgba(52,211,153,0.3)" },
  medio: { label: "MEDIO", color: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
  dificil: { label: "DIFÍCIL", color: "#9b55f9", glow: "rgba(155,85,249,0.3)" },
  insano: { label: "INSANO", color: "#ef4444", glow: "rgba(239,68,68,0.3)" },
};

function useCountdown(startedAt: string | null, durationMs = 2 * 60 * 60 * 1000) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const tick = () => {
      const elapsed = Date.now() - new Date(startedAt).getTime();
      setRemaining(Math.max(0, durationMs - elapsed));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, durationMs]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { remaining, h, m, s, expired: remaining === 0 };
}

function SquadPanel({ squad, battle, side }: {
  squad: any; battle: any; side: "left" | "right";
}) {
  const isWinner = battle.winnerId === squad?.id;
  const score = side === "left" ? battle.squad1Score : battle.squad2Score;
  const isLeft = side === "left";
  const accentColor = isLeft ? "#ff4db8" : "#9b55f9";
  const glowColor = isLeft ? "rgba(255,77,184,0.15)" : "rgba(155,85,249,0.15)";

  return (
    <div className={`relative flex flex-col items-center p-6 rounded-2xl border transition-all
      ${isWinner ? "border-yellow-500/50 shadow-[0_0_40px_rgba(245,158,11,0.2)]" : "border-white/8"}
    `}
      style={{ background: `radial-gradient(ellipse at ${isLeft ? "top left" : "top right"}, ${glowColor} 0%, transparent 70%)` }}>

      {/* Winner crown */}
      {isWinner && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <Crown className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
          <span className="text-[10px] font-mono font-black text-yellow-400 tracking-widest mt-0.5">GANADOR</span>
        </div>
      )}

      {/* Emblem */}
      <div className="relative mb-4 mt-2">
        <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-6xl border-2 transition-all"
          style={{
            background: `linear-gradient(135deg, ${accentColor}15, transparent)`,
            borderColor: isWinner ? "#f59e0b" : `${accentColor}40`,
            boxShadow: battle.status === "en_combate" ? `0 0 30px ${accentColor}30` : undefined
          }}>
          {EMBLEMS[squad?.emblem] || "💀"}
        </div>
        {battle.status === "en_combate" && (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 animate-ping" />
        )}
        {/* Level badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full font-mono text-[9px] font-black"
          style={{ background: accentColor, color: "#000" }}>
          NVL {squad?.level || 1}
        </div>
      </div>

      {/* Squad name */}
      <h2 className="font-mono font-black text-xl text-center mb-1 leading-tight" style={{ color: accentColor }}>
        {squad?.name || (side === "left" ? battle.squad1Name : battle.squad2Name)}
      </h2>
      <p className="text-[10px] text-muted-foreground font-mono mb-4">cap. {squad?.captainName || "—"}</p>

      {/* Score */}
      <div className="mb-4 text-center">
        <div className="text-5xl font-mono font-black" style={{ color: accentColor }}>
          {score || 0}
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">FLAGS</div>
      </div>

      {/* Stats */}
      <div className="w-full space-y-2">
        {[
          { label: "VICTORIAS", value: squad?.wins || 0, color: "#34d399" },
          { label: "DERROTAS", value: squad?.losses || 0, color: "#ef4444" },
          { label: "PUNTOS", value: (squad?.totalPoints || 0).toLocaleString(), color: accentColor },
          { label: "MIEMBROS", value: squad?.memberCount || 1, color: "#9ca3af" },
        ].map(stat => (
          <div key={stat.label} className="flex justify-between items-center text-xs font-mono">
            <span className="text-muted-foreground text-[10px]">{stat.label}</span>
            <span className="font-bold" style={{ color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Level bar */}
      <div className="w-full mt-3 pt-3 border-t border-white/5">
        <div className="flex gap-0.5 justify-center">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-3 h-2 rounded-sm transition-all" style={{
              background: i < (squad?.level || 1) ? accentColor : "rgba(255,255,255,0.06)",
              boxShadow: i < (squad?.level || 1) ? `0 0 4px ${accentColor}80` : undefined,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MachineCenter({ battle, mission, onFlag, flagging }: {
  battle: any; mission: any; onFlag: (flag: string) => void; flagging: boolean;
}) {
  const [flagInput, setFlagInput] = useState("");
  const diff = DIFF_CONFIG[mission?.difficulty || "medio"] || DIFF_CONFIG.medio;
  const isDone = battle.status === "finalizado";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* VS badge */}
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border-2 border-red-500/50 bg-red-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <Swords className="h-9 w-9 text-red-400" />
        </div>
        <span className="absolute -bottom-4 font-mono font-black text-red-400 text-xs tracking-[0.4em]">VS</span>
      </div>

      {/* Machine card */}
      <div className="w-full rounded-2xl border overflow-hidden"
        style={{ borderColor: diff.color + "40", boxShadow: `0 0 30px ${diff.glow}` }}>
        {/* Header strip */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${diff.color}, transparent)` }} />

        <div className="p-6 bg-[#080810]">
          {/* Target visual */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: diff.color + "60", background: `radial-gradient(circle, ${diff.color}15, transparent)` }}>
                <Terminal className="h-10 w-10" style={{ color: diff.color }} />
              </div>
              {/* Scanning rings */}
              {!isDone && (
                <>
                  <div className="absolute inset-0 rounded-full border animate-ping"
                    style={{ borderColor: diff.color + "30", animationDuration: "2s" }} />
                  <div className="absolute -inset-3 rounded-full border animate-ping"
                    style={{ borderColor: diff.color + "15", animationDuration: "3s" }} />
                </>
              )}
            </div>
          </div>

          <h3 className="font-mono font-black text-xl text-center mb-1" style={{ color: diff.color }}>
            {mission?.name || battle.missionName}
          </h3>

          <div className="flex justify-center mb-4">
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold"
              style={{ background: diff.color + "22", color: diff.color, border: `1px solid ${diff.color}44` }}>
              {diff.label}
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center font-mono mb-5 leading-relaxed">
            {mission?.description || "Comprometela máquina. Captura la flag. Gana el combate."}
          </p>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { icon: <Wifi className="h-3 w-3" />, label: "TARGET IP", value: mission?.targetIp || "10.10.0.1" },
              { icon: <Flag className="h-3 w-3" />, label: "FLAG FORMAT", value: mission?.flagFormat || "SpettroWeb{...}" },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-2.5 border border-white/5 bg-white/2 font-mono">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[9px] mb-1">
                  {item.icon} {item.label}
                </div>
                <div className="text-xs font-bold text-foreground truncate">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Hint */}
          {mission?.hints && (
            <div className="mb-4 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-center gap-1.5 text-yellow-400 text-[10px] font-mono mb-1">
                <AlertTriangle className="h-3 w-3" /> HINT
              </div>
              <p className="text-xs text-muted-foreground font-mono">{mission.hints}</p>
            </div>
          )}

          {/* Prize pool */}
          <div className="mb-4 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-center">
            <div className="text-[10px] text-muted-foreground font-mono mb-1 tracking-widest">PREMIO DE BATALLA</div>
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <span className="font-mono font-black text-2xl text-yellow-400">
                {(battle.prizeSpc || 500).toLocaleString()} SPC
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mt-1">
              ≈ €{((battle.prizeSpc || 500) / 1000).toFixed(2)} EUR
            </div>
          </div>

          {/* Flag submit */}
          {!isDone ? (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-2">
                ENVIAR FLAG
              </label>
              <div className="flex gap-2">
                <input
                  value={flagInput}
                  onChange={e => setFlagInput(e.target.value)}
                  placeholder="SpettroWeb{...}"
                  onKeyDown={e => e.key === "Enter" && flagInput.trim() && onFlag(flagInput.trim())}
                  className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-green-400 placeholder:text-muted-foreground/30 focus:outline-none focus:border-green-500/50"
                />
                <Button
                  onClick={() => { if (flagInput.trim()) { onFlag(flagInput.trim()); setFlagInput(""); } }}
                  disabled={flagging || !flagInput.trim()}
                  className="font-mono text-[10px] px-4 font-bold gap-1"
                  style={{ background: "linear-gradient(135deg,#34d399,#059669)", color: "#000", border: "none" }}>
                  {flagging ? <span className="animate-pulse">...</span> : <><Flag className="h-3 w-3" />ENVIAR</>}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
              <CheckCircle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="font-mono font-bold text-yellow-400">COMBATE FINALIZADO</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                Ganador: <span className="text-primary">{battle.winnerName}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── STATUS CONFIG ─────────────────────────────────────────────────────────────
const BET_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  abierta:   { label: "ABIERTA",   color: "#34d399", bg: "rgba(52,211,153,0.08)"  },
  aceptada:  { label: "ACEPTADA",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  resuelta:  { label: "RESUELTA",  color: "#9b55f9", bg: "rgba(155,85,249,0.08)" },
  cancelada: { label: "CANCELADA", color: "#6b7280", bg: "rgba(107,114,128,0.05)" },
};

function BettingPanel({ battleId, battle }: { battleId: number; battle: any }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [amount, setAmount] = useState(100);
  const [isFree, setIsFree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: bets = [], isLoading } = useQuery<any[]>({
    queryKey: ["room-bets", battleId],
    queryFn: () => fetch(`${BASE}api/spc/bets/${battleId}`).then(r => r.json()),
    refetchInterval: 4000,
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ["room-bets", battleId] });

  const totalSpcLocked = bets
    .filter(b => b.status === "abierta" || b.status === "aceptada")
    .reduce((s, b) => s + b.amount, 0);

  const openBets  = bets.filter(b => b.status === "abierta");
  const activeBets = bets.filter(b => b.status === "aceptada");
  const doneBets  = bets.filter(b => b.status === "resuelta" || b.status === "cancelada");

  const createBet = async () => {
    if (!user) return;
    if (!prediction.trim()) { toast({ title: "Escribe tu predicción", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}api/spc/bets/${battleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: user.id, creatorUsername: user.username,
          amount: isFree ? 0 : amount,
          prediction: prediction.trim(), isFree,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: `Apuesta creada${isFree ? " (libre)" : ` · ${amount.toLocaleString()} SPC bloqueados`}` });
      setPrediction(""); setAmount(100); setShowForm(false);
      refetch();
      qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const acceptBet = async (betId: number) => {
    if (!user) { toast({ title: "Inicia sesión", variant: "destructive" }); return; }
    try {
      const r = await fetch(`${BASE}api/spc/bets/${betId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptorId: user.id, acceptorUsername: user.username }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: "Apuesta aceptada 🤝" });
      refetch(); qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const cancelBet = async (betId: number) => {
    if (!user) return;
    try {
      const r = await fetch(`${BASE}api/spc/bets/${betId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: "Apuesta cancelada — SPC reembolsados" });
      refetch(); qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const resolveBet = async (betId: number, winnerId: number, winnerName: string) => {
    try {
      const r = await fetch(`${BASE}api/spc/bets/${betId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: `${winnerName} gana la apuesta 🏆` });
      refetch(); qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const QUICK_PREDS = [
    { label: `🏆 ${battle.squad1Name}`, value: `Gana ${battle.squad1Name}` },
    { label: `🏆 ${battle.squad2Name}`, value: `Gana ${battle.squad2Name}` },
    { label: "⚡ Primera flag en 30min", value: "Primera flag en menos de 30 minutos" },
    { label: "💀 Sin flags (empate)", value: "Nadie captura la flag — empate técnico" },
  ];

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080810] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5"
        style={{ background: "linear-gradient(90deg, rgba(155,85,249,0.08), transparent)" }}>
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4" style={{ color: "#9b55f9" }} />
          <span className="font-mono font-black text-xs tracking-widest" style={{ color: "#9b55f9" }}>APUESTAS</span>
          {bets.length > 0 && (
            <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold"
              style={{ background: "rgba(155,85,249,0.2)", color: "#9b55f9", border: "1px solid rgba(155,85,249,0.3)" }}>
              {bets.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {totalSpcLocked > 0 && (
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <Coins className="h-3 w-3 text-yellow-400" />
              <span className="text-yellow-400 font-bold">{totalSpcLocked.toLocaleString()} SPC</span>
              <span className="text-muted-foreground">en juego</span>
            </div>
          )}
          {user && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all"
              style={{ background: showForm ? "rgba(155,85,249,0.3)" : "rgba(155,85,249,0.15)", border: "1px solid rgba(155,85,249,0.3)", color: "#9b55f9" }}>
              <DollarSign className="h-3 w-3" /> {showForm ? "CANCELAR" : "NUEVA APUESTA"}
            </button>
          )}
        </div>
      </div>

      {/* Create bet form */}
      {showForm && user && (
        <div className="border-b border-white/5 p-5 space-y-4"
          style={{ background: "linear-gradient(135deg, rgba(155,85,249,0.05), transparent)" }}>
          {/* Quick predictions */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">PREDICCIÓN RÁPIDA</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PREDS.map(q => (
                <button key={q.value} onClick={() => setPrediction(q.value)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] transition-all border ${
                    prediction === q.value
                      ? "border-violet-500/60 bg-violet-500/20 text-violet-300"
                      : "border-white/8 bg-white/3 text-muted-foreground hover:border-violet-500/30 hover:text-foreground"
                  }`}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom prediction */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1.5">O ESCRIBE TU PREDICCIÓN</p>
            <input
              value={prediction}
              onChange={e => setPrediction(e.target.value)}
              placeholder="Ej: Squad Alpha captura flag en menos de 1h..."
              maxLength={120}
              className="w-full bg-black/50 border border-white/8 rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-violet-500/40"
            />
          </div>

          {/* Amount + free toggle */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-mono text-muted-foreground tracking-widest">CANTIDAD SPC</p>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <div
                    onClick={() => setIsFree(v => !v)}
                    className={`w-7 h-3.5 rounded-full transition-all relative ${isFree ? "bg-violet-500" : "bg-white/10"}`}>
                    <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${isFree ? "left-3.5" : "left-0.5"}`} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Apuesta libre</span>
                </label>
              </div>
              {!isFree ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {[50, 100, 250, 500, 1000].map(v => (
                      <button key={v} onClick={() => setAmount(v)}
                        className={`flex-1 py-1 rounded font-mono text-[10px] font-bold transition-all border ${
                          amount === v
                            ? "border-yellow-500/60 bg-yellow-500/15 text-yellow-400"
                            : "border-white/8 bg-white/3 text-muted-foreground hover:border-yellow-500/30"
                        }`}>
                        {v >= 1000 ? `${v/1000}k` : v}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number" min={10} max={50000} step={10}
                    value={amount}
                    onChange={e => setAmount(Math.max(10, parseInt(e.target.value) || 10))}
                    className="w-full bg-black/50 border border-white/8 rounded-lg px-3 py-1.5 text-xs font-mono text-yellow-400 focus:outline-none focus:border-yellow-500/40"
                  />
                </div>
              ) : (
                <div className="py-2 px-3 rounded-lg border border-violet-500/20 bg-violet-500/5 text-[11px] font-mono text-muted-foreground">
                  Sin SPC — apuesta solo por honor 👑
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={createBet}
            disabled={submitting || !prediction.trim()}
            className="w-full font-mono text-[11px] font-black gap-2 h-9"
            style={{ background: "linear-gradient(135deg, #9b55f9, #6d28d9)", border: "none", color: "#fff" }}>
            {submitting ? <span className="animate-pulse">Procesando...</span>
              : <><Flame className="h-3.5 w-3.5" /> {isFree ? "CREAR APUESTA LIBRE" : `APOSTAR ${amount.toLocaleString()} SPC`}</>}
          </Button>
        </div>
      )}

      {/* Bets list */}
      <div className="divide-y divide-white/4 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="py-8 text-center font-mono text-xs text-muted-foreground animate-pulse">Cargando apuestas...</div>
        ) : bets.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <TrendingUp className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-[11px] text-muted-foreground font-mono text-center">
              Sin apuestas aún.<br/>
              {user ? "¡Sé la primera en apostar!" : "Inicia sesión para apostar."}
            </p>
          </div>
        ) : (
          <>
            {[...openBets, ...activeBets, ...doneBets].map(bet => {
              const st = BET_STATUS[bet.status] || BET_STATUS.abierta;
              const isCreator  = user?.id === bet.creatorId;
              const isAcceptor = user?.id === bet.acceptorId;
              const pot = bet.amount * 2;

              return (
                <div key={bet.id} className="px-5 py-4 transition-all hover:bg-white/2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Status + amount row */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold"
                          style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}>
                          {st.label}
                        </span>
                        {!bet.isFree && (
                          <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-yellow-400">
                            <Coins className="h-2.5 w-2.5" /> {bet.amount.toLocaleString()} SPC
                            {bet.acceptorId && <span className="text-muted-foreground font-normal">· bote {pot.toLocaleString()}</span>}
                          </span>
                        )}
                        {bet.isFree && <span className="font-mono text-[9px] text-muted-foreground">libre</span>}
                      </div>

                      {/* Prediction */}
                      <p className="font-mono text-[12px] text-foreground/90 leading-snug mb-1.5 truncate">
                        "{bet.prediction}"
                      </p>

                      {/* Participants */}
                      <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                        <span className="text-primary/80">{bet.creatorUsername}</span>
                        {bet.acceptorUsername && (
                          <>
                            <span className="text-white/20">vs</span>
                            <span className="text-violet-400/80">{bet.acceptorUsername}</span>
                          </>
                        )}
                        {!bet.acceptorUsername && bet.status === "abierta" && (
                          <span className="text-muted-foreground/40">· esperando contrincante</span>
                        )}
                        {bet.winnerId && (
                          <span className="text-yellow-400 ml-1">
                            · 🏆 {bet.winnerId === bet.creatorId ? bet.creatorUsername : bet.acceptorUsername}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {/* Accept: open bet, not creator */}
                      {bet.status === "abierta" && user && !isCreator && (
                        <button onClick={() => acceptBet(bet.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all"
                          style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                          <Check className="h-3 w-3" /> ACEPTAR
                        </button>
                      )}

                      {/* Cancel: open bet, is creator */}
                      {bet.status === "abierta" && isCreator && (
                        <button onClick={() => cancelBet(bet.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[10px] transition-all"
                          style={{ background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)", color: "#6b7280" }}>
                          <X className="h-3 w-3" /> CANCELAR
                        </button>
                      )}

                      {/* Resolve: accepted bet, is participant */}
                      {bet.status === "aceptada" && (isCreator || isAcceptor) && (
                        <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-mono text-muted-foreground text-center">¿Quién ganó?</p>
                          <button onClick={() => resolveBet(bet.id, bet.creatorId, bet.creatorUsername)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] font-bold transition-all"
                            style={{ background: "rgba(255,77,184,0.1)", border: "1px solid rgba(255,77,184,0.25)", color: "#ff4db8" }}>
                            <Trophy className="h-2.5 w-2.5" /> {bet.creatorUsername}
                          </button>
                          <button onClick={() => resolveBet(bet.id, bet.acceptorId, bet.acceptorUsername)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] font-bold transition-all"
                            style={{ background: "rgba(155,85,249,0.1)", border: "1px solid rgba(155,85,249,0.25)", color: "#9b55f9" }}>
                            <Trophy className="h-2.5 w-2.5" /> {bet.acceptorUsername}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

const QUICK_REACTIONS = ["🔥", "💀", "🎯", "⚡", "👏", "💎"];

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

function ChatPanel({ battleId, battle }: { battleId: number; battle: any }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [chatTab, setChatTab] = useState<"public" | "squad">("public");
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [reactions, setReactions] = useState<Record<number, Record<string, number>>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["battle-messages", battleId],
    queryFn: () => fetch(`${BASE}api/squads/battles/${battleId}/messages`).then(r => r.json()),
    refetchInterval: 3000,
  });

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const publicMsgs = messages.filter(m => m.type === "spectator");
  const squadMsgs = messages.filter(m => m.type === "squad");
  const filtered = chatTab === "public" ? publicMsgs : squadMsgs;

  // Count unique recent spectators (last 30 min)
  const cutoff = Date.now() - 30 * 60 * 1000;
  const onlineUsers = new Set(publicMsgs.filter(m => new Date(m.createdAt).getTime() > cutoff).map(m => m.username));
  const spectatorCount = Math.max(onlineUsers.size, battle.status === "en_combate" ? 3 : 1);

  const sendMessage = async () => {
    if (!user || !msgInput.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`${BASE}api/squads/battles/${battleId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id, username: user.username,
          message: msgInput.trim(),
          type: chatTab === "public" ? "spectator" : "squad",
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setMsgInput("");
      qc.invalidateQueries({ queryKey: ["battle-messages", battleId] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const addReaction = (msgId: number, emoji: string) => {
    setReactions(prev => ({
      ...prev,
      [msgId]: { ...(prev[msgId] || {}), [emoji]: ((prev[msgId] || {})[emoji] || 0) + 1 },
    }));
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080810] overflow-hidden flex flex-col">
      {/* Header with live count */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] font-black tracking-widest text-primary">CHAT PÚBLICO</span>
          {battle.status === "en_combate" && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[8px] font-bold"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span>{spectatorCount} viendo</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/5">
        <button onClick={() => setChatTab("public")}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] font-bold border-b-2 transition-all flex-1 justify-center
            ${chatTab === "public" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Eye className="h-3 w-3" /> PÚBLICO
          <span className="ml-1 px-1.5 rounded font-mono text-[8px]" style={{ background: "rgba(255,77,184,0.15)", color: "#ff4db8" }}>
            {publicMsgs.length}
          </span>
        </button>
        <button onClick={() => setChatTab("squad")}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] font-bold border-b-2 transition-all flex-1 justify-center
            ${chatTab === "squad" ? "border-yellow-400 text-yellow-400 bg-yellow-500/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Lock className="h-3 w-3" /> ESCUADRA
          <span className="ml-1 px-1.5 rounded font-mono text-[8px]" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
            {squadMsgs.length}
          </span>
        </button>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="h-72 overflow-y-auto p-3 space-y-2.5 flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-xl border border-white/5 bg-white/2 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono text-center">
              {chatTab === "public"
                ? "Sé el primero en comentar. Este chat es visible para todos."
                : "Canal privado. Solo tu escuadra puede leer estos mensajes."}
            </p>
          </div>
        ) : (
          filtered.map(msg => {
            const isMe = msg.username === user?.username;
            const palette = AVATAR_PALETTES[usernameToIndex(msg.username)];
            const msgReactions = reactions[msg.id] || {};
            return (
              <div key={msg.id} className={`group flex gap-2 items-end ${isMe ? "justify-end" : ""}`}>
                {!isMe && <ChatAvatar username={msg.username} avatarUrl={msg.avatarUrl} size={32} />}
                <div className={`max-w-[78%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 px-0.5">
                    <span className="text-[9px] font-mono font-bold" style={{ color: palette.border }}>{msg.username}</span>
                    <span className="text-[8px] text-muted-foreground/50 font-mono">{relativeTime(msg.createdAt)}</span>
                  </div>
                  <div className="relative">
                    <div className="px-3 py-2 rounded-xl text-[11px] font-mono leading-relaxed"
                      style={isMe
                        ? { background: `linear-gradient(135deg,${palette.border}20,${palette.border}12)`, border: `1px solid ${palette.border}35`, color: palette.border, borderBottomRightRadius: 4 }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", borderBottomLeftRadius: 4 }
                      }>
                      {msg.message}
                    </div>
                    {/* Quick reaction picker on hover */}
                    <div className={`absolute ${isMe ? "right-0" : "left-0"} -top-7 hidden group-hover:flex gap-0.5 bg-[#111118] border border-white/10 rounded-lg px-1.5 py-1 shadow-xl z-10`}>
                      {QUICK_REACTIONS.map(e => (
                        <button key={e} onClick={() => addReaction(msg.id, e)}
                          className="text-[14px] hover:scale-125 transition-transform w-6 h-6 flex items-center justify-center rounded">
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Reactions */}
                  {Object.keys(msgReactions).length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(msgReactions).map(([emoji, count]) => (
                        <button key={emoji} onClick={() => addReaction(msg.id, emoji)}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono transition-all hover:scale-110"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          {emoji} <span className="text-muted-foreground">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isMe && <ChatAvatar username={msg.username} avatarUrl={msg.avatarUrl} size={32} />}
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/5 p-3 flex gap-2 items-center">
        {user ? (
          <>
            <ChatAvatar username={user.username} size={24} />
            <input
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={chatTab === "squad" ? "Solo tu escuadra verá esto..." : "Comenta para todos…"}
              maxLength={300}
              className="flex-1 bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/40 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !msgInput.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={chatTab === "squad"
                ? { background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.35)", color: "#f59e0b" }
                : { background: "rgba(255,77,184,0.2)", border: "1px solid rgba(255,77,184,0.35)", color: "#ff4db8" }}>
              <Send className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-1.5 rounded-xl border border-white/5 bg-white/2">
            <Lock className="h-3 w-3 text-muted-foreground/40" />
            <p className="text-[10px] text-muted-foreground font-mono">Inicia sesión para chatear</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BattleArena() {
  const params = useParams<{ id: string }>();
  const battleId = parseInt(params.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [flagging, setFlagging] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["battle-arena", battleId],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/squads/battles/${battleId}`);
      if (!r.ok) throw new Error("Combate no encontrado");
      return r.json() as Promise<{ battle: any; mission: any; squad1: any; squad2: any; botProgress: number; botSquadSide: "squad1" | "squad2" | null }>;
    },
    refetchInterval: 5000,
    enabled: !!battleId,
  });

  const { battle, mission, squad1, squad2, botProgress = 0, botSquadSide } = data || {};
  const timer = useCountdown(battle?.startedAt || null);

  const submitFlag = async (flag: string) => {
    if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
    if (!battle) return;
    setFlagging(true);
    try {
      const r = await fetch(`${BASE}api/squads/battles/${battleId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flag, userId: user.id, username: user.username,
          squadId: battle.squad1Id, squadName: battle.squad1Name,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.correct) {
        toast({ title: "🚩 FLAG CORRECTA!", description: d.message });
        qc.invalidateQueries({ queryKey: ["battle-arena", battleId] });
        qc.invalidateQueries({ queryKey: ["wallet"] });
      } else {
        toast({ title: "Flag incorrecta", description: d.message, variant: "destructive" });
      }
      qc.invalidateQueries({ queryKey: ["battle-messages", battleId] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setFlagging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center font-mono">
            <Swords className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-primary animate-pulse">Cargando arena de batalla...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center font-mono">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">Combate no encontrado</p>
            <Link href="/escuadras"><Button variant="outline">Volver a Escuadras</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const isActive = battle.status === "en_combate";
  const isDone = battle.status === "finalizado";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />

      {/* Battle scanline background */}
      <div className="fixed inset-0 pointer-events-none opacity-3"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,77,184,0.03) 0px, rgba(255,77,184,0.03) 1px, transparent 1px, transparent 4px)" }} />

      {/* ── HEADER ── */}
      <div className="relative border-b overflow-hidden"
        style={{
          borderColor: isActive ? "rgba(239,68,68,0.3)" : isDone ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.05)",
          background: isActive
            ? "linear-gradient(135deg, rgba(239,68,68,0.05) 0%, transparent 50%, rgba(255,77,184,0.03) 100%)"
            : "rgba(8,8,16,0.8)"
        }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: back + title */}
            <div>
              <Link href="/escuadras"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-2">
                <ChevronLeft className="h-3.5 w-3.5" /> ESCUADRAS
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="font-mono font-black text-lg md:text-2xl text-foreground">
                  COMBATE <span className="text-primary">#{battleId}</span>
                </h1>
                <span className="font-mono text-sm text-muted-foreground">— {battle.missionName}</span>
                {isActive && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <Badge className="font-mono text-[10px] border-red-500/50 text-red-400 bg-red-500/10">EN VIVO</Badge>
                  </div>
                )}
                {isDone && (
                  <Badge className="font-mono text-[10px] border-yellow-500/50 text-yellow-400 bg-yellow-500/10">
                    <Trophy className="h-3 w-3 mr-1" />FINALIZADO
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: timer + prize */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground font-mono mb-0.5 tracking-widest">TIEMPO</div>
                <div className={`font-mono font-black text-2xl tabular-nums ${timer.expired ? "text-red-400" : isActive ? "text-yellow-400" : "text-muted-foreground"}`}>
                  {String(timer.h).padStart(2, "0")}:{String(timer.m).padStart(2, "0")}:{String(timer.s).padStart(2, "0")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground font-mono mb-0.5 tracking-widest">PREMIO</div>
                <div className="font-mono font-black text-2xl text-yellow-400 flex items-center gap-1">
                  <Coins className="h-5 w-5" /> {(battle.prizeSpc || 500).toLocaleString()} SPC
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN ARENA ── */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_1fr] gap-6 mb-8">
          {/* Squad 1 */}
          <SquadPanel squad={squad1} battle={battle} side="left" />

          {/* Machine / Center */}
          <MachineCenter
            battle={battle}
            mission={mission}
            onFlag={submitFlag}
            flagging={flagging}
          />

          {/* Squad 2 */}
          <SquadPanel squad={squad2} battle={battle} side="right" />
        </div>

        {/* ── AI TRAINING PROGRESS BAR ── */}
        {botSquadSide && isActive && (
          <div className="max-w-5xl mx-auto mb-6">
            <div className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: botProgress >= 80 ? "rgba(239,68,68,0.5)" : botProgress >= 50 ? "rgba(245,158,11,0.4)" : "rgba(155,85,249,0.3)",
                background: botProgress >= 80
                  ? "linear-gradient(135deg, rgba(239,68,68,0.08), transparent)"
                  : botProgress >= 50
                  ? "linear-gradient(135deg, rgba(245,158,11,0.06), transparent)"
                  : "linear-gradient(135deg, rgba(155,85,249,0.06), transparent)",
                boxShadow: botProgress >= 80 ? "0 0 30px rgba(239,68,68,0.15)" : undefined,
              }}>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-pulse">🤖</span>
                    <div>
                      <p className="font-mono font-black text-sm" style={{
                        color: botProgress >= 80 ? "#ef4444" : botProgress >= 50 ? "#f59e0b" : "#9b55f9"
                      }}>
                        {botProgress >= 100 ? "⚠️ IA CAPTURÓ LA FLAG" :
                         botProgress >= 80 ? "⚠️ IA MUY CERCA — ¡APRESÚRATE!" :
                         botProgress >= 50 ? "IA PROGRESANDO RÁPIDO" :
                         "PROGRESO DE LA IA"}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        {botSquadSide === "squad2" ? battle?.squad2Name : battle?.squad1Name} · Dificultad: {battle?.aiDifficulty?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="font-mono font-black text-2xl tabular-nums"
                    style={{ color: botProgress >= 80 ? "#ef4444" : botProgress >= 50 ? "#f59e0b" : "#9b55f9" }}>
                    {Math.round(botProgress)}%
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-4 rounded-full bg-white/5 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                    style={{
                      width: `${botProgress}%`,
                      background: botProgress >= 80
                        ? "linear-gradient(90deg, #ef4444, #ff4db8)"
                        : botProgress >= 50
                        ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                        : "linear-gradient(90deg, #9b55f9, #f59e0b)",
                      boxShadow: botProgress >= 80 ? "0 0 12px rgba(239,68,68,0.6)" : "0 0 8px rgba(155,85,249,0.4)",
                    }} />
                  {/* Scanline effect */}
                  {botProgress > 5 && botProgress < 100 && (
                    <div className="absolute inset-y-0 rounded-full animate-pulse"
                      style={{ left: `${botProgress - 2}%`, width: "4px", background: "#fff4", filter: "blur(2px)" }} />
                  )}
                </div>

                <div className="flex justify-between mt-2 font-mono text-[9px] text-muted-foreground">
                  <span>INICIO</span>
                  <span>— Captura la flag antes de que llegue al 100% —</span>
                  <span>IA GANA</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CHAT + APUESTAS ── */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs font-bold text-muted-foreground tracking-widest">COMUNICACIÓN</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <ChatPanel battleId={battleId} battle={battle} />
          </div>

          {/* Apuestas */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-4 w-4" style={{ color: "#9b55f9" }} />
              <span className="font-mono text-xs font-bold text-muted-foreground tracking-widest">SALA DE APUESTAS</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <BettingPanel battleId={battleId} battle={battle} />
          </div>
        </div>

        {/* Resolve buttons (for testing / admin) */}
        {isActive && user && (
          <div className="max-w-3xl mx-auto mt-4 p-4 rounded-xl border border-white/5 bg-white/2">
            <p className="text-[10px] text-muted-foreground font-mono mb-3 text-center tracking-widest">DECLARAR GANADOR (ADMIN)</p>
            <div className="flex gap-3">
              <Button
                className="flex-1 font-mono text-[10px] font-bold gap-2"
                style={{ background: "rgba(255,77,184,0.2)", border: "1px solid rgba(255,77,184,0.4)", color: "#ff4db8" }}
                onClick={async () => {
                  const r = await fetch(`${BASE}api/squads/battles/${battleId}/resolve`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ winnerId: battle.squad1Id, winnerName: battle.squad1Name }),
                  });
                  if (r.ok) { toast({ title: `${battle.squad1Name} declarado ganador` }); qc.invalidateQueries({ queryKey: ["battle-arena", battleId] }); }
                }}>
                <Trophy className="h-3 w-3" /> {battle.squad1Name}
              </Button>
              <Button
                className="flex-1 font-mono text-[10px] font-bold gap-2"
                style={{ background: "rgba(155,85,249,0.2)", border: "1px solid rgba(155,85,249,0.4)", color: "#9b55f9" }}
                onClick={async () => {
                  const r = await fetch(`${BASE}api/squads/battles/${battleId}/resolve`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ winnerId: battle.squad2Id, winnerName: battle.squad2Name }),
                  });
                  if (r.ok) { toast({ title: `${battle.squad2Name} declarado ganador` }); qc.invalidateQueries({ queryKey: ["battle-arena", battleId] }); }
                }}>
                <Trophy className="h-3 w-3" /> {battle.squad2Name}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
