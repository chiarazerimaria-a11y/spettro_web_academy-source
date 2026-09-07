import { useState, useEffect, useRef } from "react";
import { PublicNav } from "@/components/PublicNav";
import { Link, useLocation } from "wouter";
import { ChevronLeft, Swords, Shield, Trophy, Zap, Crown, Users, Target, Plus, AlertTriangle, CheckCircle, Clock, Flame, Star, ExternalLink, Bot, Cpu, Send, MessageSquare, Eye, Lock, TrendingUp, Coins, DollarSign, X, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

type Squad = {
  id: number;
  name: string;
  slug: string;
  captainName: string;
  description: string | null;
  emblem: string;
  memberCount: number;
  totalPoints: number;
  level: number;
  wins: number;
  losses: number;
  status: string;
};

type Mission = {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  points: number;
  targetIp: string;
  flagFormat: string;
  hints: string | null;
};

type Battle = {
  id: number;
  missionName: string;
  squad1Id: number;
  squad1Name: string;
  squad2Id: number;
  squad2Name: string;
  winnerId: number | null;
  winnerName: string | null;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

const EMBLEMS: Record<string, string> = {
  skull: "💀", robot: "🤖", demon: "👹", spider: "🕷️", ghost: "👻",
  dragon: "🐉", virus: "🦠", ninja: "🥷", phantom: "👤", cyber: "🔮",
  wolf: "🐺", eye: "👁️", kraken: "🐙",
};

const diffColor: Record<string, string> = {
  facil: "#ff4db8", medio: "#f59e0b", dificil: "#9b55f9", insano: "#ef4444",
};

function LevelBar({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-muted-foreground">NVL</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`w-2 h-3 rounded-sm ${i < level ? "bg-primary shadow-[0_0_4px_rgba(255,77,184,0.6)]" : "bg-border/30"}`}/>
        ))}
      </div>
      <span className="font-mono text-xs font-bold text-primary">{level}</span>
    </div>
  );
}

function SquadCard({ squad, rank, onChallenge }: { squad: Squad; rank: number; onChallenge: (s: Squad) => void }) {
  const isTop = rank <= 3;
  const rankColors = ["#f59e0b", "#9ca3af", "#cd7f32"];

  return (
    <div className={`relative rounded-xl border bg-[#0d0d14] overflow-hidden group hover:border-primary/40 transition-all ${isTop ? "border-primary/20" : "border-border/30"}`}>
      {rank === 1 && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"/>}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Rank + Emblem */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-xl bg-background border border-border/40 flex items-center justify-center text-3xl shadow-inner">
              {EMBLEMS[squad.emblem] || "💀"}
            </div>
            <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-black"
              style={{ background: isTop ? rankColors[rank - 1] : "#1a1a2e", color: isTop ? "#000" : "#666", border: `1px solid ${isTop ? rankColors[rank - 1] : "#333"}` }}>
              {rank}
            </div>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-mono font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{squad.name}</h3>
              {rank === 1 && <Crown className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0"/>}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
              <Crown className="h-2.5 w-2.5"/>cap. {squad.captainName}
            </p>
            <LevelBar level={squad.level}/>
          </div>
          {/* Points */}
          <div className="text-right flex-shrink-0">
            <div className="font-mono font-black text-xl text-primary">{squad.totalPoints.toLocaleString()}</div>
            <div className="text-[10px] font-mono text-muted-foreground">PUNTOS</div>
          </div>
        </div>

        {squad.description && (
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">{squad.description}</p>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="flex items-center gap-1 text-primary"><Zap className="h-3 w-3"/>W: {squad.wins}</span>
            <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-3 w-3"/>L: {squad.losses}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3"/>{squad.memberCount}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => onChallenge(squad)}
            className="border-primary/30 text-primary hover:bg-primary/10 font-mono text-[10px] h-7 px-3">
            <Swords className="h-3 w-3 mr-1"/>RETAR
          </Button>
        </div>
      </div>
    </div>
  );
}

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
        style={{ width: size, height: size, boxShadow: `0 0 8px ${palette.border}60, 0 0 0 2px ${palette.border}60` }} />
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

// ── LIVE CHAT PANEL ────────────────────────────────────────────────────────────
function LiveChatPanel({ battleId }: { battleId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["squad-room-chat", battleId],
    queryFn: () => fetch(`${BASE}api/squads/battles/${battleId}/messages`).then(r => r.json()),
    refetchInterval: 3000,
  });

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const spectatorMsgs = messages.filter((m: any) => m.type === "spectator");

  const sendMessage = async () => {
    if (!user || !msgInput.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`${BASE}api/squads/battles/${battleId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username: user.username, message: msgInput.trim(), type: "spectator" }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setMsgInput("");
      qc.invalidateQueries({ queryKey: ["squad-room-chat", battleId] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "rgba(4,4,10,0.6)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0"
        style={{ background: "linear-gradient(90deg, rgba(255,77,184,0.12), rgba(155,85,249,0.06), transparent)" }}>
        <div className="relative">
          <Eye className="h-3.5 w-3.5 text-primary" />
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"/>
        </div>
        <span className="font-mono text-[10px] font-black tracking-widest text-primary">CHAT EN VIVO</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded font-mono text-[8px] font-bold bg-primary/20 text-primary border border-primary/30">
            {spectatorMsgs.length} msgs
          </span>
          <span className="flex items-center gap-1 font-mono text-[8px] text-green-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"/>EN VIVO
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {spectatorMsgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ background: "rgba(255,77,184,0.08)", border: "1px solid rgba(255,77,184,0.15)" }}>
              <MessageSquare className="h-5 w-5 text-primary/40" />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono text-center leading-relaxed">
              Sin mensajes aún<br/>
              <span className="text-primary/60">¡Sé el primero en comentar!</span>
            </p>
          </div>
        ) : (
          spectatorMsgs.map((msg: any) => {
            const isMe = msg.username === user?.username;
            const palette = AVATAR_PALETTES[usernameToIndex(msg.username)];
            const timeStr = new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

            return (
              <div key={msg.id} className={`flex gap-2 items-end ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <ChatAvatar
                  username={msg.username}
                  avatarUrl={msg.avatarUrl ?? null}
                  size={32}
                />

                {/* Bubble */}
                <div className={`flex flex-col max-w-[78%] ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <span className="font-mono text-[9px] font-bold" style={{ color: palette.border }}>
                      {msg.username}
                    </span>
                    <span className="font-mono text-[8px] text-muted-foreground/50">{timeStr}</span>
                  </div>
                  <div className="relative px-3 py-2 rounded-2xl text-[11px] leading-relaxed font-mono"
                    style={isMe ? {
                      background: `linear-gradient(135deg, rgba(255,77,184,0.25), rgba(155,85,249,0.18))`,
                      border: "1px solid rgba(255,77,184,0.35)",
                      color: "#fce7f3",
                      borderBottomRightRadius: 4,
                      boxShadow: "0 2px 12px rgba(255,77,184,0.15)",
                    } : {
                      background: `linear-gradient(135deg, ${palette.border}14, ${palette.border}08)`,
                      border: `1px solid ${palette.border}25`,
                      color: "#e2e8f0",
                      borderBottomLeftRadius: 4,
                      boxShadow: `0 2px 8px ${palette.border}10`,
                    }}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t shrink-0 p-3"
        style={{ borderColor: "rgba(255,77,184,0.12)", background: "rgba(0,0,0,0.4)" }}>
        {user ? (
          <div className="flex items-center gap-2">
            <ChatAvatar username={user.username} avatarUrl={user.avatarUrl} size={28} />
            <input
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Comenta la batalla..."
              maxLength={200}
              className="flex-1 rounded-xl px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,77,184,0.2)",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(255,77,184,0.5)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,77,184,0.2)"}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !msgInput.trim()}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff4db8,#9b55f9)", boxShadow: "0 0 12px rgba(255,77,184,0.3)" }}>
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1">
            <Lock className="h-3 w-3 text-muted-foreground/40" />
            <p className="text-[10px] text-muted-foreground font-mono">
              Inicia sesión para chatear
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MINI BETTING PANEL ─────────────────────────────────────────────────────────
function MiniBettingPanel({ battleId, battle }: { battleId: number; battle: Battle }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [amount, setAmount] = useState(100);
  const [isFree, setIsFree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: bets = [] } = useQuery<any[]>({
    queryKey: ["squad-room-bets", battleId],
    queryFn: () => fetch(`${BASE}api/spc/bets/${battleId}`).then(r => r.json()),
    refetchInterval: 4000,
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ["squad-room-bets", battleId] });

  const totalSpc = bets.filter((b: any) => b.status === "abierta" || b.status === "aceptada").reduce((s: number, b: any) => s + b.amount, 0);
  const openBets = bets.filter((b: any) => b.status === "abierta");

  const createBet = async () => {
    if (!user) return;
    if (!prediction.trim()) { toast({ title: "Escribe tu predicción", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}api/spc/bets/${battleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: user.id, creatorUsername: user.username, amount: isFree ? 0 : amount, prediction: prediction.trim(), isFree }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: `Apuesta creada${isFree ? " (libre)" : ` · ${amount.toLocaleString()} SPC`}` });
      setPrediction(""); setAmount(100); setShowForm(false);
      refetch(); qc.invalidateQueries({ queryKey: ["wallet"] });
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

  const QUICK = [
    { label: `🏆 ${battle.squad1Name}`, value: `Gana ${battle.squad1Name}` },
    { label: `🏆 ${battle.squad2Name}`, value: `Gana ${battle.squad2Name}` },
    { label: "⚡ Flag < 30min", value: "Primera flag en menos de 30 minutos" },
    { label: "💀 Empate técnico", value: "Nadie captura la flag — empate" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0"
        style={{ background: "linear-gradient(90deg, rgba(155,85,249,0.06), transparent)" }}>
        <TrendingUp className="h-3.5 w-3.5" style={{ color: "#9b55f9" }} />
        <span className="font-mono text-[10px] font-bold tracking-widest" style={{ color: "#9b55f9" }}>APUESTAS</span>
        {bets.length > 0 && (
          <span className="px-1.5 py-0.5 rounded font-mono text-[8px] font-bold" style={{ background: "rgba(155,85,249,0.2)", color: "#9b55f9", border: "1px solid rgba(155,85,249,0.3)" }}>
            {bets.length}
          </span>
        )}
        {totalSpc > 0 && (
          <div className="ml-auto flex items-center gap-1 font-mono text-[9px]">
            <Coins className="h-3 w-3 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{totalSpc.toLocaleString()} SPC</span>
          </div>
        )}
        {user && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="ml-2 flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] font-bold transition-all"
            style={{ background: "rgba(155,85,249,0.15)", border: "1px solid rgba(155,85,249,0.3)", color: "#9b55f9" }}>
            <DollarSign className="h-2.5 w-2.5" /> {showForm ? "✕" : "APOSTAR"}
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && user && (
        <div className="border-b border-white/5 p-3 space-y-3" style={{ background: "rgba(155,85,249,0.04)" }}>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map(q => (
              <button key={q.value} onClick={() => setPrediction(q.value)}
                className={`px-2 py-1 rounded font-mono text-[9px] transition-all border ${
                  prediction === q.value
                    ? "border-violet-500/60 bg-violet-500/20 text-violet-300"
                    : "border-white/8 bg-white/3 text-muted-foreground hover:border-violet-500/30 hover:text-foreground"
                }`}>
                {q.label}
              </button>
            ))}
          </div>
          <input
            value={prediction}
            onChange={e => setPrediction(e.target.value)}
            placeholder="O escribe tu predicción..."
            maxLength={120}
            className="w-full bg-black/50 border border-white/8 rounded-lg px-3 py-2 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-violet-500/40"
          />
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {[50, 100, 250, 500].map(v => (
                <button key={v} onClick={() => { setAmount(v); setIsFree(false); }}
                  className={`flex-1 py-1 rounded font-mono text-[9px] font-bold transition-all border ${
                    amount === v && !isFree
                      ? "border-yellow-500/60 bg-yellow-500/15 text-yellow-400"
                      : "border-white/8 bg-white/3 text-muted-foreground"
                  }`}>
                  {v}
                </button>
              ))}
              <button onClick={() => setIsFree(v => !v)}
                className={`px-2 py-1 rounded font-mono text-[9px] font-bold transition-all border ${
                  isFree ? "border-violet-500/60 bg-violet-500/15 text-violet-400" : "border-white/8 bg-white/3 text-muted-foreground"
                }`}>
                LIBRE
              </button>
            </div>
          </div>
          <Button onClick={createBet} disabled={submitting || !prediction.trim()}
            className="w-full font-mono text-[10px] font-black gap-1.5 h-8"
            style={{ background: "linear-gradient(135deg, #9b55f9, #6d28d9)", border: "none", color: "#fff" }}>
            {submitting ? <span className="animate-pulse">...</span>
              : <><Flame className="h-3 w-3" /> {isFree ? "APUESTA LIBRE" : `APOSTAR ${amount} SPC`}</>}
          </Button>
        </div>
      )}

      {/* Bets list */}
      <div className="flex-1 p-3 space-y-2">
        {bets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <TrendingUp className="h-6 w-6 text-muted-foreground/15 mb-2" />
            <p className="text-[10px] text-muted-foreground font-mono text-center">
              Sin apuestas aún.<br/>¡Sé el primero en apostar!
            </p>
          </div>
        ) : (
          bets.map((bet: any) => {
            const statusColors: Record<string, string> = {
              abierta: "#34d399", aceptada: "#f59e0b", resuelta: "#9b55f9", cancelada: "#6b7280"
            };
            const col = statusColors[bet.status] || "#fff";
            return (
              <div key={bet.id} className="rounded-lg border p-2.5 text-[10px] font-mono"
                style={{ borderColor: col + "25", background: col + "08" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-foreground/80 flex-1 leading-relaxed">{bet.prediction}</span>
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold"
                    style={{ background: col + "20", color: col, border: `1px solid ${col}30` }}>
                    {bet.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{bet.creatorUsername}</span>
                  {bet.amount > 0 ? (
                    <span className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Coins className="h-2.5 w-2.5" />{bet.amount.toLocaleString()} SPC
                    </span>
                  ) : (
                    <span className="text-violet-400">Libre</span>
                  )}
                </div>
                {bet.status === "abierta" && user && bet.creatorId !== user.id && (
                  <button onClick={() => acceptBet(bet.id)}
                    className="mt-1.5 w-full py-1 rounded font-mono text-[9px] font-bold transition-all"
                    style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                    ACEPTAR APUESTA
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Link to full arena */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <Link href={`/batalla/${battleId}`}>
          <Button size="sm" className="w-full font-mono text-[10px] font-bold gap-1.5"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            <ExternalLink className="h-3 w-3" /> ABRIR ARENA COMPLETA
          </Button>
        </Link>
      </div>
    </div>
  );
}

function BattleCard({ battle, squads, onResolve }: { battle: Battle; squads: Squad[]; onResolve: (b: Battle, winnerId: number, winnerName: string) => void }) {
  const isActive = battle.status === "en_combate";
  const isDone = battle.status === "finalizado";

  return (
    <div className={`rounded-xl border bg-[#0d0d14] overflow-hidden group ${isActive ? "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.08)]" : isDone ? "border-border/20 opacity-80" : "border-border/30"}`}>
      {isActive && <div className="h-0.5 w-full bg-gradient-to-r from-primary via-red-500 to-secondary" />}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping flex-shrink-0"/>}
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
            {isActive ? "🔴 EN COMBATE" : isDone ? "✓ FINALIZADO" : "ESPERANDO"}
          </span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">{battle.missionName}</span>
        </div>

        {/* VS row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex-1 text-center">
            <div className={`font-mono font-bold text-sm ${isDone && battle.winnerName === battle.squad1Name ? "text-primary" : "text-foreground"}`}>
              {isDone && battle.winnerName === battle.squad1Name && <Trophy className="h-3 w-3 text-yellow-500 inline mr-1"/>}
              {battle.squad1Name}
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center">
            <Swords className="h-5 w-5 text-red-400"/>
            <span className="font-mono text-[10px] text-muted-foreground mt-0.5">VS</span>
          </div>
          <div className="flex-1 text-center">
            <div className={`font-mono font-bold text-sm ${isDone && battle.winnerName === battle.squad2Name ? "text-primary" : "text-foreground"}`}>
              {isDone && battle.winnerName === battle.squad2Name && <Trophy className="h-3 w-3 text-yellow-500 inline mr-1"/>}
              {battle.squad2Name}
            </div>
          </div>
        </div>

        {isDone && battle.winnerName && (
          <div className="mb-3 text-center">
            <span className="font-mono text-xs text-yellow-400"><Trophy className="h-3 w-3 inline mr-1"/>GANADOR: {battle.winnerName}</span>
          </div>
        )}

        {/* ABRIR ARENA button — always visible */}
        <Link href={`/batalla/${battle.id}`}>
          <Button size="sm"
            className="w-full font-mono text-[10px] font-bold gap-2 mb-2"
            style={isActive
              ? { background: "linear-gradient(135deg,rgba(239,68,68,0.3),rgba(255,77,184,0.2))", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444" }
              : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
            <ExternalLink className="h-3 w-3" />
            {isActive ? "⚔️ ABRIR ARENA EN VIVO" : "VER ARENA"}
          </Button>
        </Link>

        {isActive && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onResolve(battle, battle.squad1Id, battle.squad1Name)}
              className="flex-1 bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 font-mono text-[9px] h-7">
              🏆 {battle.squad1Name}
            </Button>
            <Button size="sm" onClick={() => onResolve(battle, battle.squad2Id, battle.squad2Name)}
              className="flex-1 bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 font-mono text-[9px] h-7">
              🏆 {battle.squad2Name}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const AI_BOTS = [
  {
    difficulty: "facil",
    label: "PRINCIPIANTE",
    color: "#34d399",
    glow: "rgba(52,211,153,0.15)",
    border: "rgba(52,211,153,0.3)",
    icon: "🟢",
    emoji: "👻",
    timeMin: 90,
    desc: "Técnicas básicas de enumeración. Perfecta para tus primeras prácticas.",
    skills: ["Nmap scan", "HTTP enum", "Bruteforce básico"],
    level: 2,
  },
  {
    difficulty: "medio",
    label: "INTERMEDIO",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.3)",
    icon: "🟡",
    emoji: "👹",
    timeMin: 50,
    desc: "Escalada de privilegios y movimiento lateral. Requiere experiencia real.",
    skills: ["LFI → RCE", "Sudo misconfig", "Privesc Linux"],
    level: 4,
  },
  {
    difficulty: "dificil",
    label: "AVANZADO",
    color: "#9b55f9",
    glow: "rgba(155,85,249,0.15)",
    border: "rgba(155,85,249,0.3)",
    icon: "🟣",
    emoji: "👤",
    timeMin: 30,
    desc: "Cadenas de vulnerabilidades complejas. Solo para hackers con experiencia.",
    skills: ["Buffer overflow", "AD attacks", "Container escape"],
    level: 7,
  },
  {
    difficulty: "insano",
    label: "ÉLITE",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.3)",
    icon: "🔴",
    emoji: "🤖",
    timeMin: 15,
    desc: "Active Directory + pivoting + evasión. Para las mejores del mundo.",
    skills: ["Kerberoasting", "Pass-the-Hash", "DCSync"],
    level: 10,
  },
];

export default function Squads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  const [tab, setTab] = useState<"ranking" | "battles" | "missions" | "ia">("ranking");
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<Squad | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<Squad | null>(null);

  // Live room state
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // AI Training state
  const [aiDifficulty, setAiDifficulty] = useState<string | null>(null);
  const [aiSquad, setAiSquad] = useState<Squad | null>(null);
  const [aiMission, setAiMission] = useState<Mission | null>(null);

  const [squadForm, setSquadForm] = useState({ name: "", captainName: user?.username || "", description: "", emblem: "skull" });

  // Keep captainName in sync if user logs in after component mounts
  const prevUserRef = useRef(user?.username);
  useEffect(() => {
    if (user?.username && user.username !== prevUserRef.current) {
      prevUserRef.current = user.username;
      setSquadForm(p => ({ ...p, captainName: p.captainName || user.username }));
    }
  }, [user?.username]);

  const { data: squads = [], isLoading: squadsLoading } = useQuery<Squad[]>({
    queryKey: ["squads"],
    queryFn: () => fetch(`${BASE}api/squads`).then(r => r.json()),
  });

  const { data: missions = [] } = useQuery<Mission[]>({
    queryKey: ["ctf-missions"],
    queryFn: () => fetch(`${BASE}api/squads/missions`).then(r => r.json()),
  });

  const { data: battles = [] } = useQuery<Battle[]>({
    queryKey: ["ctf-battles"],
    queryFn: () => fetch(`${BASE}api/squads/battles`).then(r => r.json()),
    refetchInterval: 10000,
  });

  const createSquadMutation = useMutation({
    mutationFn: async (data: typeof squadForm) => {
      const r = await fetch(`${BASE}api/squads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json() as Promise<Squad>;
    },
    onSuccess: (squad) => {
      qc.invalidateQueries({ queryKey: ["squads"] });
      setShowCreateSquad(false);
      toast({ title: "¡Escuadra creada!", description: `${squad.name} está lista para el combate.` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const challengeMutation = useMutation({
    mutationFn: async ({ squad1, squad2, mission }: { squad1: Squad; squad2: Squad; mission: Mission }) => {
      const r = await fetch(`${BASE}api/squads/battles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squad1Id: squad1.id, squad1Name: squad1.name, squad2Id: squad2.id, squad2Name: squad2.name, missionId: mission.id, missionName: mission.name }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ctf-battles"] });
      setShowChallenge(false);
      setChallengeTarget(null);
      setSelectedMission(null);
      setSelectedAttacker(null);
      setTab("battles");
      toast({ title: "¡Combate iniciado!", description: "El campo de batalla está listo. ¡Que comience la guerra!" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ battleId, winnerId, winnerName }: { battleId: number; winnerId: number; winnerName: string }) => {
      const r = await fetch(`${BASE}api/squads/battles/${battleId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId, winnerName }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["ctf-battles"] });
      qc.invalidateQueries({ queryKey: ["squads"] });
      toast({ title: "¡Combate resuelto!", description: `${vars.winnerName} sube de nivel y recibe la siguiente misión.` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const aiBattleMutation = useMutation({
    mutationFn: async ({ playerSquadId, playerSquadName, aiDiff, missionId, missionName }: {
      playerSquadId: number; playerSquadName: string; aiDiff: string; missionId: number; missionName: string;
    }) => {
      const r = await fetch(`${BASE}api/squads/ai-battle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerSquadId, playerSquadName, aiDifficulty: aiDiff, missionId, missionName }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json() as Promise<{ battle: any; bot: any }>;
    },
    onSuccess: ({ battle }) => {
      qc.invalidateQueries({ queryKey: ["ctf-battles"] });
      toast({ title: "⚡ ¡Entrenamiento iniciado!", description: "La IA ya está ejecutando exploits. ¡Date prisa!" });
      navigate(`/batalla/${battle.id}`);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const activeBattles = battles.filter(b => b.status === "en_combate");
  const finishedBattles = battles.filter(b => b.status === "finalizado");

  const handleChallenge = (target: Squad) => {
    setSelectedAttacker(null);
    setSelectedMission(null);
    setChallengeTarget(target);
    setShowChallenge(true);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <PublicNav />

      {/* HERO */}
      <div className="relative w-full pt-12 pb-10 border-b border-red-500/20 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(239,68,68,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.07) 1px, transparent 1px)", backgroundSize: "40px 40px" }}/>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.05)_0,transparent_65%)]"/>
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="h-3.5 w-3.5"/><span className="tracking-widest">INICIO</span>
            </Link>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2 font-mono text-[10px] text-red-400/70 tracking-[0.4em]">
              <Swords className="h-3 w-3"/>MODO ESCUADRA — SERVIDOR CTF DE COMBATE<Swords className="h-3 w-3"/>
            </div>
            <h1 className="font-mono font-black text-4xl md:text-6xl leading-none">
              <span className="text-foreground">&gt; </span>
              <span className="text-red-400">ESCUADRAS</span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm md:text-base">
              Forma tu escuadra de ataque. Reta a otros equipos en el <span className="text-red-400 font-semibold">servidor CTF</span>. El ganador sube de nivel y recibe una nueva misión.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground"><Users className="h-3.5 w-3.5 text-red-400"/>{squads.length} escuadras activas</div>
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground"><Flame className="h-3.5 w-3.5 text-red-400"/>{activeBattles.length} combates en curso</div>
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground"><Trophy className="h-3.5 w-3.5 text-red-400"/>{finishedBattles.length} batallas finalizadas</div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowCreateSquad(true)} className="bg-red-500 hover:bg-red-600 text-white font-mono font-bold shadow-[0_0_14px_rgba(239,68,68,0.3)]">
                <Plus className="h-4 w-4 mr-2"/>CREAR ESCUADRA
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-border/30 bg-[#0a0a0f]">
        <div className="container mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {[
              { key: "ranking", label: "RANKING", icon: <Trophy className="h-3.5 w-3.5"/> },
              { key: "battles", label: `COMBATES${activeBattles.length > 0 ? ` (${activeBattles.length})` : ""}`, icon: <Swords className="h-3.5 w-3.5"/> },
              { key: "missions", label: "MISIONES", icon: <Target className="h-3.5 w-3.5"/> },
              { key: "ia", label: "ENTRENAR vs IA", icon: <Bot className="h-3.5 w-3.5"/> },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`flex items-center gap-1.5 px-5 py-4 font-mono text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  tab === t.key
                    ? t.key === "ia" ? "border-violet-400 text-violet-400" : "border-red-400 text-red-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* RANKING TAB — exclude bots */}
        {tab === "ranking" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-mono font-bold text-sm text-muted-foreground tracking-widest">TABLA DE CLASIFICACIÓN</h2>
              <span className="font-mono text-xs text-muted-foreground">{squads.filter((s: any) => !s.isBot).length} escuadras</span>
            </div>
            {squadsLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-[#0d0d14] border border-border/30 animate-pulse"/>)}
              </div>
            ) : squads.filter((s: any) => !s.isBot).length === 0 ? (
              <div className="text-center py-20 text-muted-foreground font-mono">
                <Swords className="h-12 w-12 mx-auto mb-4 text-red-400/30"/>
                <p className="text-lg font-bold text-red-400 mb-2">Sin escuadras todavía</p>
                <p className="text-sm mb-6">Sé el primero en crear tu escuadra de ataque</p>
                <Button onClick={() => setShowCreateSquad(true)} className="bg-red-500 hover:bg-red-600 text-white font-mono">CREAR PRIMERA ESCUADRA</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {squads.filter((s: any) => !s.isBot).map((s, i) => <SquadCard key={s.id} squad={s} rank={i + 1} onChallenge={handleChallenge}/>)}
              </div>
            )}
          </div>
        )}

        {/* IA TRAINING TAB */}
        {tab === "ia" && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center pt-4">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Bot className="h-8 w-8 text-violet-400" />
                <h2 className="font-mono font-black text-2xl text-violet-400">MODO ENTRENAMIENTO IA</h2>
                <Bot className="h-8 w-8 text-violet-400" />
              </div>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Practica contra equipos virtuales controlados por IA. Cada bot tiene un nivel de habilidad y un tiempo límite real para capturar la flag.
              </p>
              <div className="flex items-center justify-center gap-6 mt-4 font-mono text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-violet-400"/>Oponente simulado</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-yellow-400"/>Tiempo real de captura</span>
                <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary"/>SPC reales en juego</span>
              </div>
            </div>

            {/* Step 1: Choose difficulty */}
            <div>
              <p className="font-mono text-xs font-bold text-muted-foreground tracking-widest mb-4">
                PASO 1 — ELIGE LA DIFICULTAD DEL OPONENTE IA
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AI_BOTS.map(bot => (
                  <button key={bot.difficulty}
                    onClick={() => { setAiDifficulty(bot.difficulty); setAiSquad(null); setAiMission(null); }}
                    className="relative text-left rounded-2xl border p-5 transition-all group"
                    style={{
                      borderColor: aiDifficulty === bot.difficulty ? bot.border : "rgba(255,255,255,0.06)",
                      background: aiDifficulty === bot.difficulty
                        ? `radial-gradient(ellipse at top left, ${bot.glow} 0%, transparent 70%)`
                        : "rgba(13,13,20,0.8)",
                      boxShadow: aiDifficulty === bot.difficulty ? `0 0 20px ${bot.glow}` : undefined,
                    }}>
                    {aiDifficulty === bot.difficulty && (
                      <CheckCircle className="absolute top-4 right-4 h-4 w-4" style={{ color: bot.color }} />
                    )}
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{bot.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-black text-sm" style={{ color: bot.color }}>
                            {bot.icon} {bot.label}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: bot.color + "20", color: bot.color, border: `1px solid ${bot.color}30` }}>
                            NVL {bot.level}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{bot.desc}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {bot.skills.map(s => (
                            <span key={s} className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/8 text-muted-foreground bg-white/3">
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <Clock className="h-3 w-3" style={{ color: bot.color }} />
                          <span style={{ color: bot.color }} className="font-bold">{bot.timeMin} min</span>
                          <span className="text-muted-foreground">para que la IA capture la flag</span>
                        </div>
                      </div>
                    </div>
                    {/* Level bar */}
                    <div className="flex gap-0.5 mt-4">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex-1 h-1.5 rounded-sm transition-all"
                          style={{ background: i < bot.level ? bot.color : "rgba(255,255,255,0.05)" }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Choose your squad */}
            {aiDifficulty && (
              <div>
                <p className="font-mono text-xs font-bold text-muted-foreground tracking-widest mb-4">
                  PASO 2 — ELIGE TU ESCUADRA
                </p>
                {squads.filter((s: any) => !s.isBot).length === 0 ? (
                  <div className="rounded-xl border border-white/8 bg-[#0d0d14] p-6 text-center">
                    <Shield className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="font-mono text-sm text-muted-foreground mb-3">Necesitas crear una escuadra primero</p>
                    <Button onClick={() => setShowCreateSquad(true)} className="bg-red-500 hover:bg-red-600 text-white font-mono text-xs">
                      <Plus className="h-3.5 w-3.5 mr-2" /> CREAR ESCUADRA
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {squads.filter((s: any) => !s.isBot).map((s: any) => (
                      <button key={s.id} onClick={() => setAiSquad(s)}
                        className="flex items-center gap-3 p-4 rounded-xl border text-left transition-all"
                        style={{
                          borderColor: aiSquad?.id === s.id ? "rgba(155,85,249,0.5)" : "rgba(255,255,255,0.06)",
                          background: aiSquad?.id === s.id ? "rgba(155,85,249,0.1)" : "rgba(13,13,20,0.8)",
                        }}>
                        <div className="text-3xl">{EMBLEMS[s.emblem] || "💀"}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-foreground truncate">{s.name}</span>
                            {aiSquad?.id === s.id && <CheckCircle className="h-3.5 w-3.5 text-violet-400 shrink-0" />}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            cap. {s.captainName} · Nvl {s.level} · {s.wins}W {s.losses}L
                          </div>
                        </div>
                        <div className="font-mono font-black text-sm text-primary">{s.totalPoints.toLocaleString()} pts</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Choose mission */}
            {aiDifficulty && aiSquad && (
              <div>
                <p className="font-mono text-xs font-bold text-muted-foreground tracking-widest mb-4">
                  PASO 3 — ELIGE LA MISIÓN
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {missions.map(m => (
                    <button key={m.id} onClick={() => setAiMission(m)}
                      className="flex items-start gap-3 p-4 rounded-xl border text-left transition-all"
                      style={{
                        borderColor: aiMission?.id === m.id ? "rgba(155,85,249,0.5)" : "rgba(255,255,255,0.06)",
                        background: aiMission?.id === m.id ? "rgba(155,85,249,0.08)" : "rgba(13,13,20,0.8)",
                      }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-sm text-foreground">{m.name}</span>
                          {aiMission?.id === m.id && <CheckCircle className="h-3.5 w-3.5 text-violet-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className="font-mono text-[10px] border px-1.5 py-0"
                            style={{ color: diffColor[m.difficulty] || "#fff", borderColor: diffColor[m.difficulty] + "40", background: diffColor[m.difficulty] + "12" }}>
                            {m.difficulty.toUpperCase()}
                          </Badge>
                          <span className="font-mono text-xs text-primary font-bold">+{m.points} pts</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{m.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Launch button */}
            {aiDifficulty && aiSquad && aiMission && (
              <div className="rounded-2xl border p-6 text-center"
                style={{ borderColor: "rgba(155,85,249,0.3)", background: "linear-gradient(135deg, rgba(155,85,249,0.08), transparent)" }}>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl mb-1">{EMBLEMS[aiSquad.emblem] || "💀"}</div>
                    <div className="font-mono text-xs text-primary font-bold">{aiSquad.name}</div>
                  </div>
                  <div className="text-center px-4">
                    <Swords className="h-8 w-8 text-violet-400 mx-auto" />
                    <div className="font-mono text-[10px] text-violet-400 mt-1">VS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">{AI_BOTS.find(b => b.difficulty === aiDifficulty)?.emoji}</div>
                    <div className="font-mono text-xs text-violet-400 font-bold">
                      IA · {AI_BOTS.find(b => b.difficulty === aiDifficulty)?.label}
                    </div>
                  </div>
                </div>
                <p className="font-mono text-xs text-muted-foreground mb-5">
                  Misión: <span className="text-foreground">{aiMission.name}</span> ·
                  La IA tiene <span className="text-yellow-400 font-bold">{AI_BOTS.find(b => b.difficulty === aiDifficulty)?.timeMin} min</span> para ganar
                </p>
                <Button
                  onClick={() => aiBattleMutation.mutate({
                    playerSquadId: aiSquad.id,
                    playerSquadName: aiSquad.name,
                    aiDiff: aiDifficulty,
                    missionId: aiMission.id,
                    missionName: aiMission.name,
                  })}
                  disabled={aiBattleMutation.isPending}
                  className="font-mono font-black text-sm gap-2 px-8 h-12"
                  style={{ background: "linear-gradient(135deg, #9b55f9, #6d28d9)", border: "none", color: "#fff" }}>
                  {aiBattleMutation.isPending ? (
                    <span className="animate-pulse">Iniciando batalla...</span>
                  ) : (
                    <><Bot className="h-4 w-4" /> ⚡ INICIAR ENTRENAMIENTO</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* BATTLES TAB — live rooms */}
        {tab === "battles" && (
          <div>
            {/* Header with new battle button */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-mono font-bold text-sm text-muted-foreground tracking-widest">SALAS DE COMBATE CTF</h2>
                <p className="font-mono text-xs text-muted-foreground/60 mt-0.5">
                  {activeBattles.length > 0
                    ? `${activeBattles.length} batalla${activeBattles.length > 1 ? "s" : ""} en curso · ${finishedBattles.length} finalizada${finishedBattles.length !== 1 ? "s" : ""}`
                    : `${finishedBattles.length} batallla${finishedBattles.length !== 1 ? "s" : ""} en historial`}
                </p>
              </div>
              <Button onClick={() => setTab("ranking")}
                className="font-mono text-xs font-bold gap-1.5 shrink-0"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}>
                <Swords className="h-3.5 w-3.5"/> NUEVO COMBATE
              </Button>
            </div>

            {battles.length === 0 ? (
              <div className="text-center py-20 font-mono text-muted-foreground">
                <Swords className="h-12 w-12 mx-auto mb-4 text-red-400/30"/>
                <p className="text-lg font-bold text-red-400 mb-2">Sin salas todavía</p>
                <p className="text-sm mb-5">Ve al Ranking, elige una escuadra y lanza un reto para abrir la primera sala.</p>
                <Button onClick={() => setTab("ranking")} className="bg-red-500 hover:bg-red-600 text-white font-mono font-bold">
                  <Trophy className="h-4 w-4 mr-2"/> VER RANKING
                </Button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-4" style={{ minHeight: "600px" }}>

                {/* Left: room list */}
                <div className="w-full md:w-72 shrink-0 flex flex-col gap-2">
                  <p className="font-mono text-[10px] font-bold text-muted-foreground tracking-widest mb-1 flex items-center gap-2">
                    <Radio className="h-3 w-3 text-red-400"/>
                    SALAS EN VIVO
                    <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25 text-[8px]">
                      {activeBattles.length} ACTIVAS
                    </span>
                  </p>

                  {/* Active rooms */}
                  {activeBattles.map(b => (
                    <button key={b.id} onClick={() => setSelectedRoomId(b.id === selectedRoomId ? null : b.id)}
                      className="text-left rounded-xl border p-3 transition-all group"
                      style={{
                        borderColor: b.id === selectedRoomId ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.15)",
                        background: b.id === selectedRoomId
                          ? "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(255,77,184,0.06))"
                          : "rgba(13,13,20,0.8)",
                        boxShadow: b.id === selectedRoomId ? "0 0 20px rgba(239,68,68,0.1)" : undefined,
                      }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0"/>
                        <span className="font-mono text-[9px] text-red-400 font-bold">EN VIVO</span>
                        <span className="ml-auto font-mono text-[8px] text-muted-foreground truncate max-w-[80px]">{b.missionName}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[11px] font-bold text-foreground truncate">{b.squad1Name}</div>
                          <div className="font-mono text-[9px] text-muted-foreground">VS</div>
                          <div className="font-mono text-[11px] font-bold text-foreground truncate">{b.squad2Name}</div>
                        </div>
                        {b.id === selectedRoomId
                          ? <X className="h-3.5 w-3.5 text-red-400 shrink-0"/>
                          : <Eye className="h-3.5 w-3.5 text-muted-foreground group-hover:text-red-400 shrink-0 transition-colors"/>
                        }
                      </div>
                      {b.id === selectedRoomId && (
                        <div className="mt-2 pt-2 border-t border-red-500/15 flex gap-2">
                          <button onClick={e => { e.stopPropagation(); resolveMutation.mutate({ battleId: b.id, winnerId: b.squad1Id, winnerName: b.squad1Name }); }}
                            className="flex-1 py-1 rounded font-mono text-[8px] font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all">
                            🏆 {b.squad1Name}
                          </button>
                          <button onClick={e => { e.stopPropagation(); resolveMutation.mutate({ battleId: b.id, winnerId: b.squad2Id, winnerName: b.squad2Name }); }}
                            className="flex-1 py-1 rounded font-mono text-[8px] font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all">
                            🏆 {b.squad2Name}
                          </button>
                        </div>
                      )}
                    </button>
                  ))}

                  {/* Finished rooms */}
                  {finishedBattles.length > 0 && (
                    <>
                      <p className="font-mono text-[10px] font-bold text-muted-foreground tracking-widest mt-3 mb-1">HISTORIAL</p>
                      {finishedBattles.map(b => (
                        <button key={b.id} onClick={() => setSelectedRoomId(b.id === selectedRoomId ? null : b.id)}
                          className="text-left rounded-xl border p-3 transition-all group opacity-70 hover:opacity-100"
                          style={{
                            borderColor: b.id === selectedRoomId ? "rgba(155,85,249,0.4)" : "rgba(255,255,255,0.06)",
                            background: b.id === selectedRoomId ? "rgba(155,85,249,0.08)" : "rgba(10,10,16,0.6)",
                          }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <CheckCircle className="h-2.5 w-2.5 text-green-400 shrink-0"/>
                            <span className="font-mono text-[9px] text-green-400 font-bold">FINALIZADO</span>
                            <span className="ml-auto font-mono text-[8px] text-muted-foreground truncate max-w-[80px]">{b.missionName}</span>
                          </div>
                          <div className="font-mono text-[11px] font-bold text-muted-foreground">
                            {b.winnerName ? <><Trophy className="h-3 w-3 text-yellow-500 inline mr-1"/>{b.winnerName}</> : `${b.squad1Name} vs ${b.squad2Name}`}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>

                {/* Right: live room panel */}
                <div className="flex-1 min-w-0">
                  {selectedRoomId === null ? (
                    <div className="h-full flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#080810]">
                      <Radio className="h-12 w-12 text-red-400/20 mb-4"/>
                      <p className="font-mono font-bold text-muted-foreground mb-1">Selecciona una sala</p>
                      <p className="font-mono text-sm text-muted-foreground/50">Haz clic en una sala para ver el chat en vivo y apostar</p>
                    </div>
                  ) : (() => {
                    const roomBattle = battles.find(b => b.id === selectedRoomId);
                    if (!roomBattle) return null;
                    const isLive = roomBattle.status === "en_combate";
                    return (
                      <div className="h-full rounded-2xl border overflow-hidden flex flex-col"
                        style={{
                          borderColor: isLive ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)",
                          background: "#080810",
                          boxShadow: isLive ? "0 0 40px rgba(239,68,68,0.06)" : undefined,
                        }}>
                        {/* Room header */}
                        <div className="shrink-0 px-5 py-4 border-b flex items-center gap-4"
                          style={{
                            borderColor: isLive ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                            background: isLive
                              ? "linear-gradient(90deg, rgba(239,68,68,0.06), rgba(255,77,184,0.03), transparent)"
                              : "transparent",
                          }}>
                          {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0"/>}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-black text-sm text-foreground truncate">{roomBattle.squad1Name}</span>
                              <Swords className="h-4 w-4 text-red-400 shrink-0"/>
                              <span className="font-mono font-black text-sm text-foreground truncate">{roomBattle.squad2Name}</span>
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                              Misión: {roomBattle.missionName} · {isLive ? "🔴 En combate" : "✓ Finalizado"}
                              {roomBattle.winnerName && ` · Ganador: ${roomBattle.winnerName}`}
                            </div>
                          </div>
                          <Link href={`/batalla/${selectedRoomId}`}>
                            <Button size="sm" className="shrink-0 font-mono text-[10px] gap-1.5"
                              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                              <ExternalLink className="h-3 w-3"/> ARENA COMPLETA
                            </Button>
                          </Link>
                        </div>

                        {/* Chat + Bets 2-col */}
                        <div className="flex-1 grid grid-cols-2 min-h-0 divide-x divide-white/5">
                          <LiveChatPanel battleId={selectedRoomId} />
                          <MiniBettingPanel battleId={selectedRoomId} battle={roomBattle} />
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}
          </div>
        )}

        {/* MISSIONS TAB */}
        {tab === "missions" && (
          <div className="space-y-4">
            <h2 className="font-mono font-bold text-sm text-muted-foreground tracking-widest mb-5">MISIONES CTF DISPONIBLES</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {missions.map(m => (
                <div key={m.id} className="rounded-xl border border-border/30 bg-[#0d0d14] p-5 hover:border-primary/30 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-mono font-bold text-sm text-foreground group-hover:text-primary transition-colors">{m.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="font-mono text-[10px] border px-2 py-0" style={{ color: diffColor[m.difficulty] || "#fff", borderColor: diffColor[m.difficulty] + "40", background: diffColor[m.difficulty] + "12" }}>
                          {m.difficulty.toUpperCase()}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3 text-primary"/>{m.points} pts</span>
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground bg-background border border-border/30 rounded px-2 py-1">
                      {m.targetIp}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{m.description}</p>
                  <div className="text-[10px] font-mono text-primary/60 bg-primary/5 border border-primary/15 rounded px-2 py-1 mb-3">
                    FLAG: <span className="text-primary">{m.flagFormat}</span>
                  </div>
                  {m.hints && (
                    <div className="text-[10px] font-mono text-yellow-500/70 flex items-start gap-1.5">
                      <Zap className="h-3 w-3 flex-shrink-0 mt-0.5"/>
                      <span>PISTA: {m.hints}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE SQUAD MODAL ── */}
      {showCreateSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateSquad(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"/>
          <div className="relative z-10 bg-[#0d0d14] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_40px_rgba(239,68,68,0.15)]" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono font-bold text-lg text-red-400 mb-1">CREAR ESCUADRA</h3>
            <p className="text-sm text-muted-foreground mb-5">Forma tu equipo de ataque y conquista el servidor CTF.</p>

            {!user ? (
              <div className="text-center py-6">
                <Shield className="h-10 w-10 text-red-400/40 mx-auto mb-3"/>
                <p className="font-mono text-sm text-foreground mb-1">Inicia sesión para crear tu escuadra</p>
                <p className="font-mono text-xs text-muted-foreground mb-5">Necesitas una cuenta para ser capitán de una escuadra.</p>
                <Link href="/login">
                  <Button className="bg-red-500 hover:bg-red-600 text-white font-mono font-bold w-full">ACCEDER / REGISTRARSE</Button>
                </Link>
              </div>
            ) : (
            <>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">NOMBRE DE LA ESCUADRA <span className="text-red-400">*</span></label>
                <input value={squadForm.name} onChange={e => setSquadForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Shadow Wolves, Neon Phantoms..."
                  autoFocus
                  className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-red-400/60"/>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">NOMBRE DEL CAPITÁN <span className="text-red-400">*</span></label>
                <input value={squadForm.captainName} onChange={e => setSquadForm(p => ({ ...p, captainName: e.target.value }))}
                  placeholder="Tu nombre de hacker"
                  className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-red-400/60"/>
                {!squadForm.captainName && (
                  <p className="font-mono text-[10px] text-yellow-500/80 mt-1">⚠ Escribe el nombre del capitán para continuar</p>
                )}
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">EMBLEMA</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {Object.entries(EMBLEMS).map(([key, emoji]) => (
                    <button key={key} onClick={() => setSquadForm(p => ({ ...p, emblem: key }))}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xl transition-all ${squadForm.emblem === key ? "bg-red-500/20 border-2 border-red-400 scale-110" : "bg-background border border-border/30 hover:border-red-400/40"}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">DESCRIPCIÓN (OPCIONAL)</label>
                <textarea value={squadForm.description} onChange={e => setSquadForm(p => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="La misión de tu escuadra..."
                  className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-red-400/60 resize-none"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateSquad(false)} className="flex-1 border-border/40 font-mono">CANCELAR</Button>
              <Button onClick={() => createSquadMutation.mutate(squadForm)} disabled={createSquadMutation.isPending || !squadForm.name || !squadForm.captainName}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-mono font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                {createSquadMutation.isPending ? "CREANDO..." : "FUNDAR ESCUADRA"}
              </Button>
            </div>
            </>
            )}
          </div>
        </div>
      )}

      {/* ── CHALLENGE MODAL ── */}
      {showChallenge && challengeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowChallenge(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"/>
          <div className="relative z-10 bg-[#0d0d14] border border-red-500/30 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_40px_rgba(239,68,68,0.2)]" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono font-bold text-lg text-red-400 mb-1">⚔️ DECLARAR COMBATE</h3>
            <p className="text-xs text-muted-foreground mb-5">Selecciona tu escuadra, elige una misión y lanza el reto.</p>

            {/* VS display */}
            <div className="flex items-center justify-between my-4 p-4 rounded-xl bg-background border border-border/30">
              <div className="flex-1 text-center">
                {selectedAttacker ? (
                  <>
                    <div className="text-2xl mb-1">{EMBLEMS[selectedAttacker.emblem] || "💀"}</div>
                    <div className="font-mono text-xs font-bold text-primary">{selectedAttacker.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">TU ESCUADRA</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl mb-1 opacity-30">❓</div>
                    <div className="font-mono text-[10px] text-muted-foreground">SELECCIONA</div>
                  </>
                )}
              </div>
              <div className="text-center px-4 flex-shrink-0">
                <Swords className="h-8 w-8 text-red-400 mx-auto"/>
                <div className="font-mono text-[10px] text-red-400 mt-1">VS</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl mb-1">{EMBLEMS[challengeTarget.emblem] || "💀"}</div>
                <div className="font-mono text-xs font-bold text-foreground">{challengeTarget.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">OBJETIVO</div>
              </div>
            </div>

            {/* Step 1: Pick your squad */}
            <div className="mb-4">
              <label className="font-mono text-xs text-muted-foreground mb-2 block font-bold tracking-widest">
                PASO 1 — TU ESCUADRA
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {squads.filter(s => s.id !== challengeTarget.id).map(s => (
                  <button key={s.id} onClick={() => setSelectedAttacker(s)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all font-mono text-left ${selectedAttacker?.id === s.id ? "border-red-400 bg-red-500/15" : "border-border/30 bg-background/50 hover:border-red-400/40"}`}>
                    <span className="text-lg flex-shrink-0">{EMBLEMS[s.emblem] || "💀"}</span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-foreground truncate">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">Nvl {s.level} · {s.wins}W</div>
                    </div>
                    {selectedAttacker?.id === s.id && <CheckCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 ml-auto"/>}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Pick mission */}
            <div className="mb-5">
              <label className="font-mono text-xs text-muted-foreground mb-2 block font-bold tracking-widest">
                PASO 2 — MISIÓN
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {missions.map(m => (
                  <button key={m.id} onClick={() => setSelectedMission(m)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all font-mono ${selectedMission?.id === m.id ? "border-red-400 bg-red-500/10" : "border-border/30 bg-background/50 hover:border-red-400/40"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: diffColor[m.difficulty] }}>{m.difficulty.toUpperCase()}</span>
                        <span className="text-[10px] text-primary font-bold">+{m.points}pts</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowChallenge(false)} className="flex-1 border-border/40 font-mono">CANCELAR</Button>
              <Button
                disabled={!selectedMission || !selectedAttacker || challengeMutation.isPending}
                onClick={() => {
                  if (selectedMission && selectedAttacker) {
                    challengeMutation.mutate({ squad1: selectedAttacker, squad2: challengeTarget, mission: selectedMission });
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-mono font-bold">
                {challengeMutation.isPending ? "INICIANDO..." : "⚔️ ¡COMBATE!"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
