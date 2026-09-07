import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Swords, Users, Activity, Send, MessageSquare,
  Shield, Skull, Clock, Wifi, ChevronLeft, Crown,
  Radio, Zap, AlertTriangle, CheckCircle2, Download,
  MonitorDown, Apple, Monitor, Smartphone, RefreshCw,
  Lock, Eye, EyeOff, Network, Cpu, CircleDot,
  Coins, ArrowRightLeft, Flame, Trophy, Plus, X, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

const COLORS = [
  "text-primary", "text-secondary", "text-green-400",
  "text-purple-400", "text-amber-400", "text-blue-400", "text-red-400"
];

function pickColor(username: string) {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

function ElapsedTimer({ startedAt }: { startedAt: string | null }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <span className="font-mono tabular-nums">
      {m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "en_curso") return (
    <Badge className="bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse gap-1">
      <Radio className="h-3 w-3" /> EN CURSO
    </Badge>
  );
  if (status === "finalizado") return (
    <Badge className="bg-green-500/20 border-green-500 text-green-400 gap-1">
      <CheckCircle2 className="h-3 w-3" /> FINALIZADO
    </Badge>
  );
  return (
    <Badge className="bg-gray-500/20 border-gray-500 text-gray-400 gap-1">
      <Clock className="h-3 w-3" /> ESPERANDO
    </Badge>
  );
}

function DifficultyBadge({ d }: { d: string }) {
  const map: Record<string, string> = {
    facil: "border-green-500 text-green-400",
    medio: "border-amber-500 text-amber-400",
    "difícil": "border-red-500 text-red-400",
    dificil: "border-red-500 text-red-400",
    experto: "border-secondary text-secondary",
  };
  return (
    <Badge variant="outline" className={map[d] ?? "border-gray-500 text-gray-400"}>
      {d.toUpperCase()}
    </Badge>
  );
}

export default function TournamentRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [joined, setJoined] = useState(false);
  const [online, setOnline] = useState(0);
  const lastMsgId = useRef(0);

  // Bets state
  const [bets, setBets] = useState<any[]>([]);
  const [betTab, setBetTab] = useState<"list"|"create"|"send">("list");
  const [betPrediction, setBetPrediction] = useState("");
  const [betAmount, setBetAmount] = useState(100);
  const [betFree, setBetFree] = useState(false);
  const [betSending, setBetSending] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState(50);
  const [sendNote, setSendNote] = useState("");
  const [sendingCoins, setSendingCoins] = useState(false);

  // VPN state
  const [vpnStatus, setVpnStatus] = useState<"idle"|"checking"|"connected"|"error">("idle");
  const [vpnInfo, setVpnInfo] = useState<any>(null);
  const [vpnTab, setVpnTab] = useState<"linux"|"macos"|"windows"|"android">("linux");
  const [downloading, setDownloading] = useState(false);

  // Load room
  useEffect(() => {
    fetch(`${BASE}api/tournament/rooms/${id}`)
      .then(r => r.json())
      .then(d => { setRoom(d); setOnline(d.currentParticipants || 1); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  // Join room
  useEffect(() => {
    if (!room || joined) return;
    fetch(`${BASE}api/tournament/rooms/${id}/join`, { method: "POST" })
      .then(r => r.json())
      .then(d => { setOnline(d.currentParticipants); setJoined(true); });
  }, [room]);

  // Poll chat every 2.5s
  useEffect(() => {
    const fetchChat = () => {
      fetch(`${BASE}api/tournament/rooms/${id}/chat`)
        .then(r => r.json())
        .then((data: any[]) => {
          if (!Array.isArray(data)) return;
          const newMsgs = data.filter(m => m.id > lastMsgId.current);
          if (newMsgs.length > 0) {
            lastMsgId.current = data[data.length - 1]?.id ?? 0;
            setMsgs(data);
          } else if (lastMsgId.current === 0 && data.length > 0) {
            lastMsgId.current = data[data.length - 1]?.id ?? 0;
            setMsgs(data);
          }
        })
        .catch(() => {});
    };
    fetchChat();
    const iv = setInterval(fetchChat, 2500);
    return () => clearInterval(iv);
  }, [id]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || sending) return;
    setSending(true);
    const username = user?.username ?? "Spectator_" + Math.floor(Math.random() * 99);
    const userColor = pickColor(username);
    try {
      const r = await fetch(`${BASE}api/tournament/rooms/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, message: text, userColor, userId: user?.id }),
      });
      if (r.ok) {
        setChatInput("");
        inputRef.current?.focus();
      } else {
        toast({ title: "Error al enviar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Sin conexión", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // Poll bets every 5s
  useEffect(() => {
    const load = () => {
      fetch(`${BASE}api/spc/bets/${id}`)
        .then(r => r.json()).then(d => { if (Array.isArray(d)) setBets(d); }).catch(() => {});
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [id]);

  const createBet = async () => {
    if (!user) { toast({ title: "Inicia sesión para apostar", variant: "destructive" }); return; }
    if (!betPrediction.trim()) { toast({ title: "Escribe tu predicción", variant: "destructive" }); return; }
    setBetSending(true);
    try {
      const r = await fetch(`${BASE}api/spc/bets/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: user.id, creatorUsername: user.username, amount: betFree ? 0 : betAmount, prediction: betPrediction, isFree: betFree }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setBets(prev => [d, ...prev]);
      setBetPrediction("");
      setBetTab("list");
      toast({ title: betFree ? "Apuesta gratis creada" : `Apuesta de ${betAmount} SPC creada`, description: `"${d.prediction}"` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBetSending(false);
    }
  };

  const acceptBet = async (betId: number) => {
    if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
    try {
      const r = await fetch(`${BASE}api/spc/bets/${betId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptorId: user.id, acceptorUsername: user.username }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setBets(prev => prev.map(b => b.id === betId ? d : b));
      toast({ title: "Apuesta aceptada", description: `"${d.prediction}"` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
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
      setBets(prev => prev.map(b => b.id === betId ? d : b));
      toast({ title: "Apuesta cancelada y reembolsada" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const sendCoins = async () => {
    if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
    if (!sendTo.trim() || sendAmount < 1) { toast({ title: "Rellena todos los campos", variant: "destructive" }); return; }
    setSendingCoins(true);
    try {
      const r = await fetch(`${BASE}api/spc/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: user.id, toUsername: sendTo.trim(), amount: sendAmount, note: sendNote || undefined, roomId: parseInt(id!) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSendTo(""); setSendNote(""); setSendAmount(50);
      setBetTab("list");
      toast({ title: `✓ ${sendAmount} SPC enviados a ${d.to}`, description: sendNote || undefined });
    } catch (err: any) {
      toast({ title: "Error al enviar SPC", description: err.message, variant: "destructive" });
    } finally {
      setSendingCoins(false);
    }
  };

  const checkVpn = async () => {
    setVpnStatus("checking");
    try {
      const r = await fetch(`${BASE}api/tournament/rooms/${id}/vpn-check`, { method: "POST" });
      if (r.ok) {
        const data = await r.json();
        setVpnInfo(data);
        setVpnStatus("connected");
      } else {
        setVpnStatus("error");
      }
    } catch {
      setVpnStatus("error");
    }
  };

  const downloadOvpn = async () => {
    if (!room) return;
    setDownloading(true);
    const username = user?.username ?? "hacker";
    try {
      const r = await fetch(`${BASE}api/tournament/rooms/${id}/vpn-config?username=${encodeURIComponent(username)}`);
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `spettroweb_lab_${username}.ovpn`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Config VPN descargada", description: "Importa el archivo en tu cliente OpenVPN." });
      } else {
        toast({ title: "Error al descargar", variant: "destructive" });
      }
    } catch {
      toast({ title: "Sin conexión", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-mono text-primary">
      <Terminal className="h-6 w-6 animate-pulse mr-3" /> Conectando a la sala...
    </div>
  );

  if (!room || room.error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 font-mono">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <p className="text-muted-foreground">Sala no encontrada o acceso denegado.</p>
      <Link href="/equipos"><Button variant="outline" className="font-mono">← VOLVER</Button></Link>
    </div>
  );

  const isLive = room.status === "en_curso";
  const isFinished = room.status === "finalizado";

  return (
    <div className="min-h-screen font-sans bg-background flex flex-col">

      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/equipos" className="text-primary hover:text-primary/70 transition-colors flex items-center gap-1.5 font-mono text-sm">
            <ChevronLeft className="h-4 w-4" /> EQUIPOS
          </Link>
          <span className="text-border">/</span>
          <span className="font-mono text-sm text-muted-foreground">{room.tournamentName}</span>
          <span className="text-border">/</span>
          <span className="font-mono text-sm text-primary font-bold">{room.round}</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {online} online
            </div>
            <StatusBadge status={room.status} />
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid lg:grid-cols-[1fr_380px] gap-6">

        {/* LEFT: Match + Info */}
        <div className="space-y-5">

          {/* SCOREBOARD */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl border border-primary/20 bg-card/30"
          >
            {isLive && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            )}
            <div className="p-6">
              <div className="text-center mb-4">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">{room.tournamentName}</p>
                <p className="font-mono text-sm font-bold text-secondary tracking-widest">{room.round}</p>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                {/* Squad 1 */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto">
                    <Skull className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-mono font-bold text-primary text-sm">{room.squad1Name}</p>
                </div>

                {/* Score */}
                <div className="text-center px-4">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className={`text-5xl font-mono font-black ${isLive ? "text-primary" : "text-foreground"}`}>
                      {room.squad1Score}
                    </span>
                    <span className="text-2xl font-mono text-muted-foreground">:</span>
                    <span className={`text-5xl font-mono font-black ${isLive ? "text-red-400" : "text-foreground"}`}>
                      {room.squad2Score}
                    </span>
                  </div>
                  {isLive && room.startedAt && (
                    <div className="flex items-center justify-center gap-1.5 text-amber-400 font-mono text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      <ElapsedTimer startedAt={room.startedAt} />
                    </div>
                  )}
                  {isFinished && room.winnerName && (
                    <div className="flex items-center justify-center gap-1.5 text-amber-400 font-mono text-xs">
                      <Crown className="h-3.5 w-3.5" /> {room.winnerName}
                    </div>
                  )}
                  {!isLive && !isFinished && (
                    <div className="text-muted-foreground font-mono text-xs">VS</div>
                  )}
                </div>

                {/* Squad 2 */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto">
                    <Swords className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="font-mono font-bold text-red-400 text-sm">{room.squad2Name}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* MISSION DETAILS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/20 border-border">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="font-mono text-sm text-primary flex items-center gap-2">
                  <Activity className="h-4 w-4" /> MISIÓN ACTIVA
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 font-mono text-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs uppercase">Máquina</span>
                    <span className="font-bold text-foreground">{room.machineName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs uppercase">Target IP</span>
                    <span className="text-primary">{room.machineIp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs uppercase">Dificultad</span>
                    <DifficultyBadge d={room.difficulty} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs uppercase">Flag Format</span>
                    <span className="text-secondary text-xs">{room.flagFormat}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs uppercase">Espectadores</span>
                    <span className="flex items-center gap-1.5 text-green-400">
                      <Users className="h-3 w-3" /> {online}/{room.maxParticipants}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs uppercase">Estado</span>
                    <StatusBadge status={room.status} />
                  </div>
                </div>

              </CardContent>
            </Card>
          </motion.div>

          {/* VPN PANEL */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <Card className={`border transition-all duration-500 ${vpnStatus === "connected" ? "border-green-500/40 bg-green-500/5" : vpnStatus === "error" ? "border-red-500/30 bg-red-500/5" : "border-primary/20 bg-card/20"}`}>
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-mono text-sm text-primary flex items-center gap-2">
                    <Network className="h-4 w-4" /> VPN SPETTROLAB
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary/70 ml-1">OpenVPN · AES-256-GCM</Badge>
                  </CardTitle>
                  {/* VPN Status dot */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    {vpnStatus === "idle" && <span className="text-muted-foreground flex items-center gap-1.5"><CircleDot className="h-3 w-3" /> Sin verificar</span>}
                    {vpnStatus === "checking" && <span className="text-amber-400 flex items-center gap-1.5 animate-pulse"><RefreshCw className="h-3 w-3 animate-spin" /> Verificando...</span>}
                    {vpnStatus === "connected" && <span className="text-green-400 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> CONECTADO</span>}
                    {vpnStatus === "error" && <span className="text-red-400 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> Sin conexión</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">

                {/* VPN Connected Info */}
                {vpnStatus === "connected" && vpnInfo && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg font-mono text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
                      <CheckCircle2 className="h-4 w-4" /> Túnel VPN activo
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                      <span>Tu IP VPN:</span><span className="text-green-400">{vpnInfo.vpnIp}</span>
                      <span>Target IP:</span><span className="text-primary">{vpnInfo.targetIp}</span>
                      <span>Gateway:</span><span className="text-foreground/70">{vpnInfo.gateway}</span>
                      <span>Latencia:</span><span className="text-amber-400">{vpnInfo.latencyMs}ms</span>
                    </div>
                  </motion.div>
                )}

                {vpnStatus === "error" && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg font-mono text-xs text-red-400">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    No se detecta la VPN activa. Descarga el config e instala OpenVPN antes de continuar.
                  </div>
                )}

                {/* Download + Check buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={downloadOvpn}
                    disabled={downloading}
                    className="font-mono text-xs bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 gap-2"
                  >
                    {downloading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    DESCARGAR .ovpn
                  </Button>
                  <Button
                    onClick={checkVpn}
                    disabled={vpnStatus === "checking"}
                    variant="outline"
                    className="font-mono text-xs border-primary/30 text-primary hover:bg-primary/10 gap-2"
                  >
                    <Wifi className="h-3.5 w-3.5" />
                    {vpnStatus === "checking" ? "Verificando..." : "Verificar Conexión"}
                  </Button>
                </div>

                {/* Platform tabs */}
                <div>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {(["linux","macos","windows","android"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setVpnTab(tab)}
                        className={`font-mono text-[10px] uppercase px-2.5 py-1 rounded transition-colors ${vpnTab === tab ? "bg-primary text-background" : "text-muted-foreground hover:text-primary border border-border hover:border-primary/40"}`}
                      >
                        {tab === "linux" && "🐧 Linux"}
                        {tab === "macos" && "🍎 macOS"}
                        {tab === "windows" && "🪟 Windows"}
                        {tab === "android" && "📱 Android"}
                      </button>
                    ))}
                  </div>

                  <div className="bg-[#050508] border border-primary/10 rounded-lg p-4 font-mono text-xs space-y-2">
                    {vpnTab === "linux" && <>
                      <p className="text-primary/60 mb-3"># Requiere: OpenVPN ≥ 2.4 instalado</p>
                      <div className="space-y-1.5">
                        <p><span className="text-muted-foreground">1.</span> <span className="text-green-400">$ sudo apt install openvpn</span> <span className="text-muted-foreground"># Debian/Ubuntu</span></p>
                        <p><span className="text-muted-foreground">   </span> <span className="text-green-400">$ sudo pacman -S openvpn</span> <span className="text-muted-foreground"># Arch</span></p>
                        <p><span className="text-muted-foreground">2.</span> <span className="text-primary">Descarga</span> el archivo <span className="text-amber-400">.ovpn</span> con el botón arriba</p>
                        <p><span className="text-muted-foreground">3.</span> <span className="text-green-400">$ sudo openvpn --config spettroweb_lab_<span className="text-amber-400">{user?.username ?? "hacker"}</span>.ovpn</span></p>
                        <p><span className="text-muted-foreground">4.</span> Verifica: <span className="text-green-400">$ ping {room.machineIp}</span></p>
                        <p><span className="text-muted-foreground">5.</span> Reconocimiento: <span className="text-green-400">$ nmap -sC -sV -oN scan.txt {room.machineIp}</span></p>
                      </div>
                    </>}
                    {vpnTab === "macos" && <>
                      <p className="text-primary/60 mb-3"># Usa Tunnelblick (gratuito) o Viscosity</p>
                      <div className="space-y-1.5">
                        <p><span className="text-muted-foreground">1.</span> Instala <span className="text-primary">Tunnelblick</span> desde tunnelblick.net</p>
                        <p><span className="text-muted-foreground">2.</span> <span className="text-primary">Descarga</span> el archivo <span className="text-amber-400">.ovpn</span> arriba</p>
                        <p><span className="text-muted-foreground">3.</span> Haz doble clic en el <span className="text-amber-400">.ovpn</span> → Tunnelblick lo importa</p>
                        <p><span className="text-muted-foreground">4.</span> En la barra: <span className="text-primary">Tunnelblick → Conectar</span></p>
                        <p><span className="text-muted-foreground">5.</span> Terminal: <span className="text-green-400">$ ping {room.machineIp}</span></p>
                        <p><span className="text-muted-foreground">6.</span> <span className="text-green-400">$ brew install nmap &amp;&amp; nmap -sC -sV {room.machineIp}</span></p>
                      </div>
                    </>}
                    {vpnTab === "windows" && <>
                      <p className="text-primary/60 mb-3"># Usa OpenVPN GUI (oficial) o el cliente de la comunidad</p>
                      <div className="space-y-1.5">
                        <p><span className="text-muted-foreground">1.</span> Descarga <span className="text-primary">OpenVPN GUI</span> de openvpn.net/downloads</p>
                        <p><span className="text-muted-foreground">2.</span> Instala y <span className="text-primary">descarga</span> el <span className="text-amber-400">.ovpn</span> arriba</p>
                        <p><span className="text-muted-foreground">3.</span> Copia el <span className="text-amber-400">.ovpn</span> a <span className="text-green-400">C:\Program Files\OpenVPN\config\</span></p>
                        <p><span className="text-muted-foreground">4.</span> Click derecho en icono bandeja → <span className="text-primary">Connect</span></p>
                        <p><span className="text-muted-foreground">5.</span> CMD: <span className="text-green-400">ping {room.machineIp}</span></p>
                        <p><span className="text-muted-foreground">6.</span> Instala <span className="text-primary">nmap.org</span> y escanea el target</p>
                      </div>
                    </>}
                    {vpnTab === "android" && <>
                      <p className="text-primary/60 mb-3"># Solo para observar/participar desde móvil (espectador)</p>
                      <div className="space-y-1.5">
                        <p><span className="text-muted-foreground">1.</span> Instala <span className="text-primary">OpenVPN for Android</span> (Play Store)</p>
                        <p><span className="text-muted-foreground">2.</span> <span className="text-primary">Descarga</span> el <span className="text-amber-400">.ovpn</span> en el móvil</p>
                        <p><span className="text-muted-foreground">3.</span> En la app: <span className="text-primary">Importar perfil</span> → selecciona el archivo</p>
                        <p><span className="text-muted-foreground">4.</span> Conecta y verifica IP en <span className="text-green-400">ifconfig.me</span></p>
                        <p className="text-amber-400/80">⚠ Capacidad de ataque limitada desde móvil. Recomendado PC.</p>
                      </div>
                    </>}
                  </div>
                </div>

                {/* Rules */}
                <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-lg font-mono text-[11px] space-y-1">
                  <p className="text-secondary font-bold flex items-center gap-1.5 mb-2"><Lock className="h-3 w-3" /> REGLAS DE LA RED</p>
                  <p className="text-muted-foreground">• Solo ataca <span className="text-primary">{room.machineIp}</span> — la IP asignada al torneo</p>
                  <p className="text-muted-foreground">• Prohibido escanear otras IPs de la red interna VPN</p>
                  <p className="text-muted-foreground">• No compartas tu .ovpn — es personal e intransferible</p>
                  <p className="text-muted-foreground">• Infracciones = descalificación y baneo de plataforma</p>
                </div>

              </CardContent>
            </Card>
          </motion.div>

          {/* SPC BETS + TRANSFER PANEL */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <Card className="bg-card/20 border-yellow-500/25">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="font-mono text-sm text-yellow-400 flex items-center gap-2">
                    <Coins className="h-4 w-4" /> SPC — APUESTAS Y ENVÍOS
                    <Badge variant="outline" className="text-[9px] border-yellow-500/30 text-yellow-400/70">SpettroCoin</Badge>
                  </CardTitle>
                  <div className="flex gap-1">
                    {(["list","create","send"] as const).map(t => (
                      <button key={t} onClick={() => setBetTab(t)}
                        className={`font-mono text-[10px] uppercase px-2.5 py-1 rounded transition-colors ${betTab === t ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" : "text-muted-foreground hover:text-yellow-400 border border-transparent"}`}>
                        {t === "list" && "📋 Apuestas"}
                        {t === "create" && "⚡ Crear"}
                        {t === "send" && "↗ Enviar"}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">

                {/* LIST TAB */}
                {betTab === "list" && (
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                    {bets.filter(b => b.status !== "cancelada").length === 0 && (
                      <div className="text-center py-8 font-mono text-xs text-muted-foreground">
                        <Flame className="h-8 w-8 mx-auto mb-2 opacity-20 text-yellow-400"/>
                        <p>No hay apuestas activas en esta sala.</p>
                        <button onClick={() => setBetTab("create")} className="text-yellow-400 hover:underline mt-1">Crea la primera →</button>
                      </div>
                    )}
                    {bets.filter(b => b.status !== "cancelada").map(bet => (
                      <div key={bet.id} className={`p-3 rounded-lg border font-mono text-xs space-y-1.5 ${bet.status === "abierta" ? "border-yellow-500/30 bg-yellow-500/5" : bet.status === "aceptada" ? "border-primary/30 bg-primary/5" : "border-green-500/30 bg-green-500/5"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-foreground break-words flex-1">"{bet.prediction}"</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {bet.isFree ? (
                              <Badge variant="outline" className="text-[9px] border-green-500/40 text-green-400">GRATIS</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] border-yellow-500/40 text-yellow-400">{bet.amount} SPC</Badge>
                            )}
                            {bet.status === "abierta" && <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400">ABIERTA</Badge>}
                            {bet.status === "aceptada" && <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">EN JUEGO</Badge>}
                            {bet.status === "resuelta" && <Badge variant="outline" className="text-[9px] border-green-500/40 text-green-400">RESUELTA</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-[10px] flex-wrap">
                          <span>Creador: <span className="text-foreground">{bet.creatorUsername}</span></span>
                          {bet.acceptorUsername && <span>vs <span className="text-primary">{bet.acceptorUsername}</span></span>}
                          {!bet.isFree && <span>Bote: <span className="text-yellow-400 font-bold">{bet.amount * 2} SPC</span></span>}
                        </div>
                        {bet.status === "abierta" && user && bet.creatorId !== user.id && (
                          <Button size="sm" onClick={() => acceptBet(bet.id)}
                            className="w-full h-7 text-[10px] font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30">
                            <Check className="h-3 w-3 mr-1"/> ACEPTAR APUESTA
                          </Button>
                        )}
                        {bet.status === "abierta" && user && bet.creatorId === user.id && (
                          <Button size="sm" variant="ghost" onClick={() => cancelBet(bet.id)}
                            className="w-full h-7 text-[10px] font-mono text-red-400 hover:bg-red-500/10">
                            <X className="h-3 w-3 mr-1"/> Cancelar (reembolso)
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* CREATE BET TAB */}
                {betTab === "create" && (
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-muted-foreground text-[10px] uppercase tracking-widest block mb-1">Tu predicción</label>
                      <input value={betPrediction} onChange={e => setBetPrediction(e.target.value)}
                        placeholder={`Ej: "${room?.squad1Name} gana en menos de 1h"`}
                        maxLength={120}
                        className="w-full bg-[#050508] border border-primary/20 rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-yellow-500/50 transition-colors"/>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
                        <input type="checkbox" checked={betFree} onChange={e => setBetFree(e.target.checked)}
                          className="accent-green-500 w-3.5 h-3.5"/>
                        Apuesta gratis (sin SPC)
                      </label>
                    </div>
                    {!betFree && (
                      <div>
                        <label className="text-muted-foreground text-[10px] uppercase tracking-widest block mb-1">Cantidad SPC (mín. 10)</label>
                        <div className="flex items-center gap-2">
                          {[25, 50, 100, 250, 500].map(v => (
                            <button key={v} onClick={() => setBetAmount(v)}
                              className={`px-2.5 py-1 rounded border text-[10px] transition-all ${betAmount === v ? "border-yellow-500/60 bg-yellow-500/15 text-yellow-400" : "border-border text-muted-foreground hover:border-yellow-500/30"}`}>
                              {v}
                            </button>
                          ))}
                          <input type="number" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value) || 10)}
                            min={10} max={10000}
                            className="w-20 bg-[#050508] border border-primary/20 rounded px-2 py-1 text-xs font-mono text-foreground outline-none focus:border-yellow-500/50"/>
                        </div>
                      </div>
                    )}
                    <div className="p-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded text-[10px] text-yellow-400/70">
                      {betFree ? "⚡ Apuesta gratis — sin coste, solo para diversión y honor" : `💰 El ganador recibe ${betAmount * 2} SPC. Si nadie acepta y cancelas, te devolvemos ${betAmount} SPC.`}
                    </div>
                    <Button onClick={createBet} disabled={betSending || !betPrediction.trim()}
                      className="w-full font-mono text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30">
                      {betSending ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1"/> : <Plus className="h-3.5 w-3.5 mr-1"/>}
                      {betFree ? "CREAR APUESTA GRATIS" : `APOSTAR ${betAmount} SPC`}
                    </Button>
                  </div>
                )}

                {/* SEND SPC TAB */}
                {betTab === "send" && (
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-muted-foreground text-[10px] uppercase tracking-widest block mb-1">Usuario destino</label>
                      <input value={sendTo} onChange={e => setSendTo(e.target.value)}
                        placeholder="nombre_de_usuario"
                        className="w-full bg-[#050508] border border-primary/20 rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 transition-colors"/>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[10px] uppercase tracking-widest block mb-1">Cantidad SPC</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[10, 25, 50, 100, 250].map(v => (
                          <button key={v} onClick={() => setSendAmount(v)}
                            className={`px-2.5 py-1 rounded border text-[10px] transition-all ${sendAmount === v ? "border-primary/60 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                            {v}
                          </button>
                        ))}
                        <input type="number" value={sendAmount} onChange={e => setSendAmount(parseInt(e.target.value) || 1)}
                          min={1} max={50000}
                          className="w-20 bg-[#050508] border border-primary/20 rounded px-2 py-1 text-xs font-mono text-foreground outline-none focus:border-primary/50"/>
                      </div>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[10px] uppercase tracking-widest block mb-1">Nota (opcional)</label>
                      <input value={sendNote} onChange={e => setSendNote(e.target.value)}
                        placeholder="gg, buen juego, propina..."
                        maxLength={80}
                        className="w-full bg-[#050508] border border-primary/20 rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 transition-colors"/>
                    </div>
                    <Button onClick={sendCoins} disabled={sendingCoins || !sendTo.trim() || sendAmount < 1}
                      className="w-full font-mono text-xs bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30">
                      {sendingCoins ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1"/> : <ArrowRightLeft className="h-3.5 w-3.5 mr-1"/>}
                      ENVIAR {sendAmount} SPC A {sendTo || "..."}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">Máx. 50,000 SPC por transferencia</p>
                  </div>
                )}

              </CardContent>
            </Card>
          </motion.div>

          {/* BRACKET MINI */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-card/20 border-border">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="font-mono text-sm text-secondary flex items-center gap-2">
                  <Swords className="h-4 w-4" /> BRACKET — {room.tournamentName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2 font-mono text-xs">
                  {[
                    { round: "CUARTOS A", s1: "Ghost Protocol", s2: "Binary Ghosts", score: "2-0", done: true },
                    { round: "CUARTOS B", s1: "Red Storm", s2: "C0de Breakers", score: "2-1", done: true },
                    { round: "SEMIFINAL A", s1: "Ghost Protocol", s2: "Shadow Wolves", score: "3-1", done: true },
                    { round: "SEMIFINAL B", s1: "Red Storm", s2: "Null Pointers", score: "2-1", done: true },
                    { round: "GRAN FINAL", s1: "Ghost Protocol", s2: "Red Storm", score: "?-?", done: false, live: true },
                  ].map((match, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded ${match.live ? "bg-amber-500/10 border border-amber-500/30" : "bg-background/30"}`}>
                      <span className={`w-24 shrink-0 ${match.live ? "text-amber-400" : "text-muted-foreground"}`}>{match.round}</span>
                      <span className={match.live ? "text-primary font-bold" : "text-foreground"}>{match.s1}</span>
                      <span className="text-muted-foreground mx-1">vs</span>
                      <span className={match.live ? "text-red-400 font-bold" : "text-foreground"}>{match.s2}</span>
                      <span className={`ml-auto font-bold ${match.live ? "text-amber-400 animate-pulse" : match.done ? "text-green-400" : "text-muted-foreground"}`}>{match.score}</span>
                      {match.live && <Badge className="text-[9px] bg-amber-500/20 border-amber-500 text-amber-400 py-0">LIVE</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* RIGHT: LIVE CHAT */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col h-[calc(100vh-80px)] sticky top-[56px]"
        >
          <Card className="flex-1 flex flex-col bg-[#050508] border-primary/20 overflow-hidden min-h-0">
            <CardHeader className="py-3 px-4 border-b border-border/50 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm font-bold text-foreground">CHAT DE SALA</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  LIVE
                </div>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{room.round} · {room.tournamentName}</p>
            </CardHeader>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-xs scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              <AnimatePresence initial={false}>
                {msgs.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex flex-col gap-0.5 ${msg.isSystem ? "py-1 px-2 bg-amber-500/5 border-l-2 border-amber-500/40 rounded-r" : ""}`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-muted-foreground whitespace-nowrap opacity-60 text-[10px]">
                        [{formatTime(msg.createdAt)}]
                      </span>
                      <span className={`font-bold whitespace-nowrap ${msg.isSystem ? "text-amber-400" : (msg.userColor || pickColor(msg.username))}`}>
                        {msg.username}:
                      </span>
                    </div>
                    <span className={`break-words pl-1 leading-relaxed ${msg.isSystem ? "text-amber-400/80" : "text-foreground/90"}`}>
                      {msg.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 p-3 border-t border-border/50 bg-background/50">
              {!user && (
                <div className="text-center font-mono text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  <Link href="/perfil" className="text-primary hover:underline">Inicia sesión</Link> para chatear
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-2">
                <div className="flex-1 flex items-center gap-1.5 bg-[#0a0a0f] border border-primary/20 rounded px-2 focus-within:border-primary/60 transition-colors">
                  <Zap className="h-3 w-3 text-primary/40 shrink-0" />
                  <input
                    ref={inputRef}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder={user ? `${user.username}@sala:~$` : "Escribe un mensaje..."}
                    disabled={sending}
                    maxLength={400}
                    className="flex-1 bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground/40 outline-none py-2 min-w-0"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending || !chatInput.trim()}
                  size="sm"
                  className="bg-primary text-background hover:bg-primary/90 font-mono shrink-0 px-3"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground/40 font-mono mt-1.5 text-right">
                {chatInput.length}/400 · actualiza cada 2.5s
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
