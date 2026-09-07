import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Terminal, Shield, Zap, Clock, Lock, Unlock, Users, LogOut,
  ChevronDown, ChevronUp, MessageSquare, Camera, X, Check,
  Wallet, TrendingUp, Percent, ArrowRight, Gift, Coins,
  BarChart3, ShoppingBag, Trophy, Swords, BookOpen, UserPlus,
  AlertCircle, Download, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL;

const avatarEmoji: Record<string, string> = {
  ghost: "👻", skull: "💀", robot: "🤖", demon: "😈", spider: "🕷️",
  dragon: "🐉", ninja: "🥷", phantom: "🌑", cyber: "⚡", eye: "👁️",
};

const RANK_CONFIG: Record<string, { color: string; glow: string; label: string }> = {
  Rookie:  { color: "text-gray-400",   glow: "#9ca3af", label: "ROOKIE" },
  Hacker:  { color: "text-primary",    glow: "#ff4db8", label: "HACKER" },
  Elite:   { color: "text-secondary",  glow: "#9b55f9", label: "ELITE HACKER" },
  Master:  { color: "text-yellow-400", glow: "#facc15", label: "MASTER HACKER" },
};

const RARITY: Record<string, { border: string; glow: string; textColor: string; icon: string; bg: string }> = {
  Común:      { border: "border-gray-600/30",   glow: "#6b7280", textColor: "text-gray-400",   icon: "🏅", bg: "bg-gray-800/10" },
  Raro:       { border: "border-blue-500/50",   glow: "#3b82f6", textColor: "text-blue-400",   icon: "💎", bg: "bg-blue-900/10" },
  Épico:      { border: "border-purple-500/60", glow: "#a855f7", textColor: "text-purple-400", icon: "🔮", bg: "bg-purple-900/10" },
  Legendario: { border: "border-yellow-500/70", glow: "#eab308", textColor: "text-yellow-400", icon: "⭐", bg: "bg-yellow-900/10" },
};

// ── Fee structure ──────────────────────────────────────────────────────────────
const FEE_TABLE = [
  { icon: <Trophy className="h-3.5 w-3.5" />, label: "Torneos — premio ganado",       plat: 15, you: 85,  color: "#facc15" },
  { icon: <Swords className="h-3.5 w-3.5" />,  label: "Batallas PvP — bote",          plat: 10, you: 90,  color: "#ff4db8" },
  { icon: <BookOpen className="h-3.5 w-3.5" />, label: "Cursos vendidos (instructora)",plat: 30, you: 70,  color: "#9b55f9" },
  { icon: <ShoppingBag className="h-3.5 w-3.5" />, label: "Marketplace — ventas",     plat: 25, you: 75,  color: "#34d399" },
  { icon: <UserPlus className="h-3.5 w-3.5" />, label: "Afiliados — comisión",         plat: 90, you: 10,  color: "#fb923c", note: "tú recibes el 10% del primer pago del referido" },
  { icon: <Download className="h-3.5 w-3.5" />, label: "Retiro a € (cashout)",         plat: 5,  you: 95,  color: "#60a5fa", note: "5% de comisión por conversión" },
  { icon: <Send className="h-3.5 w-3.5" />,     label: "Transferencias SPC (P2P)",    plat: 0,  you: 100, color: "#a3e635" },
];

const TX_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  earned:     { icon: "⬆",  color: "#34d399", label: "Ganado" },
  bonus:      { icon: "🎁", color: "#facc15", label: "Bonus" },
  tournament: { icon: "🏆", color: "#facc15", label: "Torneo" },
  battle:     { icon: "⚔",  color: "#ff4db8", label: "Batalla" },
  course:     { icon: "📚", color: "#9b55f9", label: "Curso" },
  spent:      { icon: "⬇",  color: "#ef4444", label: "Gasto" },
  transfer:   { icon: "↔",  color: "#60a5fa", label: "Transfer" },
  purchase:   { icon: "🛒", color: "#fb923c", label: "Compra" },
  payout:     { icon: "💸", color: "#f87171", label: "Retiro" },
  affiliate:  { icon: "🤝", color: "#fb923c", label: "Afiliado" },
};

// ── Trophy card ────────────────────────────────────────────────────────────────
const TrophyCard = ({ trophy, index }: { trophy: { name: string; date: string; rarity: string }; index: number }) => {
  const r = RARITY[trophy.rarity] || RARITY.Común;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.4 }} whileHover={{ y: -6, scale: 1.06 }}
      className={`relative rounded-xl border ${r.border} ${r.bg} p-4 flex flex-col items-center text-center gap-1.5 overflow-hidden`}
      style={{ boxShadow: `0 0 10px ${r.glow}20` }}
    >
      <span className="text-2xl">{r.icon}</span>
      <span className={`font-mono text-xs font-bold ${r.textColor}`}>{trophy.name}</span>
      <span className="font-mono text-[9px] text-muted-foreground">{trophy.date}</span>
      <span className={`font-mono text-[9px] px-2 py-0.5 rounded border ${r.border} ${r.textColor} opacity-70`}>{trophy.rarity}</span>
    </motion.div>
  );
};

const BreadcrumbNav = () => (
  <nav className="px-4 py-3 border-b border-white/5">
    <div className="container mx-auto max-w-6xl flex items-center gap-2 font-mono text-xs text-muted-foreground">
      <Terminal className="h-3 w-3 text-primary" />
      <Link href="/" className="hover:text-primary transition-colors">inicio</Link>
      <span>/</span>
      <span className="text-muted-foreground">perfil</span>
    </div>
  </nav>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editAlias, setEditAlias] = useState("");
  const [editImg, setEditImg] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [profileTab, setProfileTab] = useState<"stats" | "negocio" | "mensajes">("stats");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, logout, updateProfile } = useAuth();

  const username    = user?.username    || "HACKER";
  const rank        = user?.rank        || "Hacker";
  const avatarType  = user?.avatarType  || "ghost";
  const totalPoints = user?.totalPoints || 0;
  const machinesSolved = user?.machinesSolved || 0;
  const rankCfg = RANK_CONFIG[rank] || RANK_CONFIG.Hacker;
  const level  = Math.max(1, Math.floor(totalPoints / 500) + 1);
  const xpPct  = ((totalPoints % 500) / 500) * 100;

  // ── Wallet data ──────────────────────────────────────────────────────────────
  const { data: walletData } = useQuery<{ wallet: any; transactions: any[] }>({
    queryKey: ["profile-wallet", user?.id],
    queryFn: () => fetch(`${BASE}api/wallet/${user!.id}`).then(r => r.json()),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const wallet       = walletData?.wallet;
  const transactions = walletData?.transactions || [];

  // ── Squad data ───────────────────────────────────────────────────────────────
  const { data: squadsAll = [] } = useQuery<any[]>({
    queryKey: ["squads-all"],
    queryFn: () => fetch(`${BASE}api/squads`).then(r => r.json()),
    staleTime: 60_000,
  });
  const userSquad = squadsAll.find(
    s => s.captainName === username || s.captainName === user?.username
  ) || null;

  // ── Payout requests ──────────────────────────────────────────────────────────
  const { data: payouts = [] } = useQuery<any[]>({
    queryKey: ["profile-payouts", user?.id],
    queryFn: () => fetch(`${BASE}api/payouts/requests/${user!.id}`).then(r => r.json()),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // ── Earnings breakdown by TX type ────────────────────────────────────────────
  const earningsByType = transactions
    .filter(tx => tx.amount > 0)
    .reduce((acc: Record<string, number>, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + tx.amount;
      return acc;
    }, {});

  const totalEarned    = wallet?.totalEarned || 0;
  const balance        = wallet?.balance     || 0;
  const balanceEur     = (balance / 1000).toFixed(2);
  const totalEarnedEur = (totalEarned / 1000).toFixed(2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Imagen demasiado grande", description: "Máximo 10 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 256;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext("2d")!;
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
        setEditImg(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEdit = () => { setEditAlias(username); setEditImg(user?.avatarUrl || null); setEditOpen(true); };

  const handleSave = async () => {
    if (!editAlias.trim()) return;
    setEditSaving(true);
    try {
      await updateProfile(editAlias.trim(), editImg);
      setEditOpen(false);
      toast({ title: "✓ Perfil actualizado", description: "Los cambios se guardaron." });
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally { setEditSaving(false); }
  };

  useEffect(() => {
    document.documentElement.classList.add("dark");
    fetch(`${BASE}api/lab/certifications`)
      .then(r => r.json()).then(d => setCertifications(d || [])).catch(() => {});
  }, []);

  const trophies = [
    { name: "Primer Pwn",       date: "15/01/2024", rarity: "Común" },
    { name: "Master de Linux",  date: "22/01/2024", rarity: "Raro" },
    { name: "Speed Hacker",     date: "05/02/2024", rarity: "Épico" },
    { name: "Cazador de Flags", date: "18/02/2024", rarity: "Legendario" },
    { name: "Sin Pistas",       date: "01/03/2024", rarity: "Raro" },
    { name: "10 días seguidos", date: "15/03/2024", rarity: "Épico" },
    { name: "Web Wizard",       date: "28/03/2024", rarity: "Legendario" },
    { name: "Iniciado VulnYX",  date: "10/04/2024", rarity: "Común" },
  ];

  const activities = [
    { time: "10:23:45", action: "pwned: Medusa (Fácil)",               pts: "+20pts", type: "pwn" },
    { time: "09:15:12", action: "pwned: Thor (Medio)",                 pts: "+30pts", type: "pwn" },
    { time: "08:45:00", action: 'trofeo: "Master de Linux" desbloq.',  pts: "",       type: "trophy" },
    { time: "08:10:33", action: "intentó: Cerberus (Difícil) — fail",  pts: "",       type: "fail" },
    { time: "Ayer",     action: "pwned: Basic_Auth (Fácil)",           pts: "+15pts", type: "pwn" },
    { time: "Ayer",     action: "inició sesión",                       pts: "",       type: "login" },
    { time: "Hace 2d",  action: "pwned: LFI_Basics (Medio)",          pts: "+30pts", type: "pwn" },
  ];

  const mockMessages = [
    { id:1, sender:"Ghost Protocol",  initials:"GP", color:"bg-primary/20 text-primary",     preview:"Necesitamos un web wizard para el torneo...", full:"Compañero, estamos organizando la estrategia para la Infiltration Cup. Necesitamos a alguien que domine Web Exploitation — los primeros retos apuntan a LFI y SSRF. ¿Contamos contigo?", unread:true,  time:"Hace 2h", tag:"ESCUADRA" },
    { id:2, sender:"CipherPunks",     initials:"CP", color:"bg-secondary/20 text-secondary", preview:"Invitación de colaboración",                  full:"Buen pwn en Cerberus. Estamos armando equipo para las máquinas Insane. ¿Te apuntas?",                                                                                                     unread:false, time:"Ayer",     tag:"EQUIPO" },
    { id:3, sender:"CHIARA_SPETTRO",  initials:"CS", color:"bg-green-500/20 text-green-400", preview:"Actualización de plataforma v2.4",            full:"Se ha añadido el nuevo módulo de Active Directory con 5 nuevas máquinas de entrenamiento. Revisa el laboratorio.",                                                                    unread:false, time:"Ayer",     tag:"SISTEMA" },
    { id:4, sender:"RedStorm_X",      initials:"RS", color:"bg-red-500/20 text-red-400",     preview:"Desafío de torneo recibido",                  full:"La escuadra Red Storm ha enviado un desafío formal para la máquina Zeus. El reto expira en 24 horas.",                                                                          unread:false, time:"Hace 3d",  tag:"COMBATE" },
    { id:5, sender:"Sistema",         initials:"SY", color:"bg-muted text-muted-foreground", preview:"Certificación desbloqueada",                  full:"¡Enhorabuena! Has completado los requisitos para la certificación CJE-101. Ya puedes descargar tu insignia.",                                                                  unread:false, time:"Hace 1sem",tag:"SISTEMA" },
  ];

  // Build notification messages from real transactions
  const txMessages = transactions.slice(0, 5).map((tx, i) => {
    const info = TX_ICONS[tx.type] || TX_ICONS.earned;
    const sign = tx.amount > 0 ? "+" : "";
    return {
      id: 100 + i,
      sender: "Billetera SPC",
      initials: info.icon,
      color: `text-[${info.color}]`,
      colorStyle: info.color,
      preview: tx.description,
      full: `${tx.description}. Movimiento: ${sign}${tx.amount.toLocaleString()} SPC. Tipo: ${info.label}.`,
      unread: false,
      time: new Date(tx.createdAt).toLocaleDateString("es-ES", { day:"2-digit", month:"short" }),
      tag: info.label.toUpperCase(),
      amount: tx.amount,
    };
  });

  const allMessages = [...mockMessages, ...txMessages];
  const unreadCount = mockMessages.filter(m => m.unread).length;

  const actColor = { pwn:"text-primary", trophy:"text-yellow-400", fail:"text-red-400", login:"text-muted-foreground" };
  const actIcon  = { pwn:"▶▶", trophy:"★", fail:"✕", login:"→" };

  const skillBars = [
    { label:"Web Exploitation",   pct:85, color:"#ff4db8" },
    { label:"Network & Pivoting", pct:72, color:"#ff4db8" },
    { label:"Binary / Reversing", pct:58, color:"#9b55f9" },
    { label:"Criptografía",       pct:65, color:"#9b55f9" },
    { label:"Forense Digital",    pct:78, color:"#ff4db8" },
    { label:"OSINT",              pct:91, color:"#facc15" },
  ];

  const TABS = [
    { id: "stats",    label: "ESTADÍSTICAS",  icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: "negocio",  label: "MI NEGOCIO",    icon: <Coins className="h-3.5 w-3.5" /> },
    { id: "mensajes", label: "MENSAJES",      icon: <MessageSquare className="h-3.5 w-3.5" />, badge: unreadCount },
  ] as const;

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans pb-20 bg-background">
      <BreadcrumbNav />

      <style>{`
        @keyframes avatar-float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        .avatar-float { animation: avatar-float 4s ease-in-out infinite; }
        @keyframes spin-slow { to{transform:rotate(360deg)} }
        @keyframes spin-slow-rev { to{transform:rotate(-360deg)} }
        .spin-slow { animation: spin-slow 8s linear infinite; }
        .spin-slow-rev { animation: spin-slow-rev 5s linear infinite; }
      `}</style>

      <main className="container mx-auto px-4 pt-8 max-w-6xl space-y-6">

        {/* ── HERO ────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="relative p-6 md:p-8 rounded-2xl border border-white/10 bg-[#06060f] overflow-hidden"
          style={{ boxShadow:`0 0 80px ${rankCfg.glow}08` }}
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none -translate-y-1/2 translate-x-1/4 rounded-full blur-[120px]"
            style={{ background:`radial-gradient(circle, ${rankCfg.glow}10 0%, transparent 70%)` }} />
          <div className="absolute inset-0 pointer-events-none opacity-[0.018]"
            style={{ backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.6) 2px,rgba(255,255,255,0.6) 3px)" }} />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">

            {/* AVATAR */}
            <div className="avatar-float shrink-0">
              <div className="relative w-36 h-36">
                <div className="spin-slow absolute inset-[-12px] rounded-full border-2 opacity-25"
                  style={{ borderColor:rankCfg.glow, borderRightColor:"transparent", borderBottomColor:"transparent" }} />
                <div className="spin-slow-rev absolute inset-[-6px] rounded-full border opacity-20"
                  style={{ borderColor:rankCfg.glow, borderTopColor:"transparent", borderStyle:"dashed" }} />
                <div className="absolute inset-0 rounded-full overflow-hidden border-2"
                  style={{ borderColor:rankCfg.glow, boxShadow:`0 0 25px ${rankCfg.glow}50, inset 0 0 25px ${rankCfg.glow}10` }}>
                  <div className="absolute inset-0 rounded-full"
                    style={{ background:`radial-gradient(circle at 38% 35%, ${rankCfg.glow}25, #04040e 60%)` }} />
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="avatar" className="absolute inset-0 w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl"
                      style={{ filter:`drop-shadow(0 0 14px ${rankCfg.glow}) drop-shadow(0 0 30px ${rankCfg.glow}60)` }}>
                      {avatarEmoji[avatarType] || "👻"}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-[#04040e] border-2 flex flex-col items-center justify-center"
                  style={{ borderColor:rankCfg.glow, boxShadow:`0 0 12px ${rankCfg.glow}50` }}>
                  <span className="font-mono font-bold text-sm leading-none" style={{ color:rankCfg.glow }}>{level}</span>
                  <span className="font-mono text-[7px] opacity-60" style={{ color:rankCfg.glow }}>LVL</span>
                </div>
              </div>
            </div>

            {/* INFO */}
            <div className="flex-1 w-full min-w-0 text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl md:text-4xl font-mono font-bold text-white"
                    style={{ textShadow:`0 0 30px ${rankCfg.glow}30` }}>{username}</h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
                    <span className={`font-mono text-xs font-bold tracking-widest px-3 py-1 rounded border ${rankCfg.color}`}
                      style={{ borderColor:`${rankCfg.glow}40`, background:`${rankCfg.glow}0f` }}>
                      ◈ {rankCfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Desde 14/01/2024
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 justify-center md:justify-end shrink-0 flex-wrap">
                  <Link href="/wallet">
                    <Button size="sm"
                      className="font-mono text-xs font-bold gap-1.5"
                      style={{ background:"linear-gradient(135deg,rgba(255,77,184,0.2),rgba(155,85,249,0.15))", border:"1px solid rgba(255,77,184,0.4)", color:"#ff4db8" }}>
                      <Wallet className="h-3.5 w-3.5" />
                      {wallet ? `${balance.toLocaleString()} SPC` : "MI BILLETERA"}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleOpenEdit}
                    className="font-mono text-xs border-primary/30 text-primary hover:bg-primary/10">
                    EDITAR
                  </Button>
                  {user && (
                    <Button variant="outline" size="sm" onClick={logout}
                      className="font-mono text-xs border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <LogOut className="h-3 w-3 mr-1" /> SALIR
                    </Button>
                  )}
                </div>
              </div>

              {/* XP Bar */}
              <div className="space-y-1.5 max-w-lg mx-auto md:mx-0">
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color:rankCfg.glow }}>XP: {totalPoints.toLocaleString()}</span>
                  <span className="text-muted-foreground">{Math.round(xpPct)}% al siguiente nivel</span>
                </div>
                <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/8 relative">
                  <motion.div initial={{ width:0 }} animate={{ width:`${xpPct}%` }}
                    transition={{ duration:1.6, delay:0.5, ease:"easeOut" }}
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{ background:`linear-gradient(90deg, ${rankCfg.glow}70, ${rankCfg.glow})`, boxShadow:`0 0 12px ${rankCfg.glow}` }} />
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-lg mx-auto md:mx-0">
                {[
                  { emoji:"🎯", label:"PWNS",    value:machinesSolved.toString(), color:"text-primary" },
                  { emoji:"⚡", label:"PUNTOS",  value:totalPoints.toLocaleString(), color:"text-secondary" },
                  { emoji:"🏆", label:"GLOBAL",  value:"#234", color:"text-yellow-400" },
                  { emoji:"🪙", label:"SPC",     value:wallet ? balance.toLocaleString() : "—", color:"text-pink-400" },
                ].map(({ emoji, label, value, color }) => (
                  <div key={label} className="flex flex-col items-center p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-lg mb-0.5">{emoji}</span>
                    <span className={`font-mono text-base font-bold ${color}`}>{value}</span>
                    <span className="font-mono text-[9px] text-muted-foreground tracking-widest">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── SQUAD BANNER ──────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
          className="relative rounded-xl border border-primary/15 bg-gradient-to-r from-[#060610] to-[#07050f] overflow-hidden"
        >
          <div className="absolute right-0 top-0 h-full w-56 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
          <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-black border-2 border-primary/50 flex items-center justify-center shrink-0"
                style={{ boxShadow:"0 0 18px rgba(255,77,184,0.2)" }}>
                {userSquad ? (
                  <span className="text-2xl">{userSquad.emblem === "skull" ? "💀" : userSquad.emblem === "ghost" ? "👻" : "🛡"}</span>
                ) : (
                  <Shield className="h-7 w-7 text-primary" />
                )}
              </div>
              <div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">ESCUADRA ACTUAL</div>
                {userSquad ? (
                  <>
                    <h3 className="text-xl font-mono font-bold text-white">{userSquad.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <Badge variant="outline" className="border-secondary/50 text-secondary text-[10px]">Cap. {userSquad.captainName}</Badge>
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                        <Users className="h-3 w-3" /> {userSquad.memberCount || 1} hackers
                      </span>
                      <span className="text-xs text-primary font-mono font-bold">{(userSquad.totalPoints || 0).toLocaleString()} PTS</span>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-mono text-muted-foreground">Sin escuadra</h3>
                    <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">Únete o crea una escuadra para competir</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/equipos">
                <Button className="font-mono bg-primary text-black hover:brightness-110 text-xs">
                  {userSquad ? "VER EQUIPO" : "CREAR ESCUADRA"}
                </Button>
              </Link>
              {userSquad && (
                <Button variant="outline" className="font-mono border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                  onClick={() => toast({ title:"¿Seguro?", description:`Abandonarás ${userSquad.name}.`, variant:"destructive" })}>
                  <LogOut className="h-3.5 w-3.5 md:mr-1.5" />
                  <span className="hidden md:inline">ABANDONAR</span>
                </Button>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── TABS ──────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl border border-white/8 bg-black/40">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setProfileTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-mono text-xs font-bold tracking-wide transition-all relative ${profileTab === tab.id ? "text-black" : "text-muted-foreground hover:text-foreground"}`}
              style={profileTab === tab.id ? { background:`linear-gradient(135deg, #ff4db8, #9b55f9)`, boxShadow:"0 0 20px rgba(255,77,184,0.3)" } : {}}>
              {tab.icon}
              {tab.label}
              {"badge" in tab && tab.badge > 0 && (
                <span className="absolute top-1.5 right-2 min-w-[16px] h-4 rounded-full bg-secondary text-black font-black text-[9px] flex items-center justify-center px-1">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── ESTADÍSTICAS TAB ─────────────────────────────────────── */}
        {profileTab === "stats" && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">

              {/* SKILLS */}
              <motion.section initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
                <h2 className="text-base font-mono font-bold mb-4 text-primary flex items-center gap-2">
                  <span className="text-secondary">&gt;</span> ÁRBOL_DE_HABILIDADES
                </h2>
                <div className="rounded-xl border border-white/8 bg-[#060610] p-5 space-y-4">
                  {skillBars.map(({ label, pct, color }, idx) => (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-mono text-xs text-muted-foreground">{label}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({length:5}, (_, i) => (
                              <div key={i} className="w-2 h-2 rounded-sm"
                                style={{ background: i < Math.round(pct/20) ? color : "rgba(255,255,255,0.06)", boxShadow: i < Math.round(pct/20) ? `0 0 4px ${color}` : "none" }} />
                            ))}
                          </div>
                          <span className="font-mono text-xs font-bold w-8 text-right" style={{ color }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }}
                          transition={{ duration:1, delay:0.3 + idx * 0.07, ease:"easeOut" }}
                          className="h-full rounded-full"
                          style={{ background:`linear-gradient(90deg, ${color}40, ${color})`, boxShadow:`0 0 8px ${color}60` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* TROPHIES */}
              <motion.section initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.05 }}>
                <h2 className="text-base font-mono font-bold mb-4 text-primary flex items-center gap-2">
                  <span className="text-secondary">&gt;</span> SALA_DE_TROFEOS
                  <span className="ml-auto text-xs text-muted-foreground font-normal">{trophies.length} desbloqueados</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {trophies.map((t, i) => <TrophyCard key={i} trophy={t} index={i} />)}
                </div>
              </motion.section>

              {/* CERTIFICATIONS */}
              <motion.section initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.1 }}>
                <h2 className="text-base font-mono font-bold mb-4 text-primary flex items-center gap-2">
                  <span className="text-secondary">&gt;</span> PROGRESO_CERTIFICACIONES
                </h2>
                <div className="space-y-2">
                  {certifications.length > 0 ? certifications.map((cert, i) => {
                    const done = i < 2;
                    return (
                      <div key={cert.id}
                        className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${done ? "border-primary/25 bg-primary/[0.04]" : "border-white/5 bg-white/[0.015]"}`}>
                        <div className={`p-2.5 rounded-lg shrink-0 ${done ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                          {done ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`font-mono text-sm font-bold truncate ${done ? "text-white" : "text-muted-foreground"}`}>
                              {cert.code} — {cert.name}
                            </span>
                            <span className="font-mono text-xs ml-3 shrink-0" style={{ color: done ? "#ff4db8" : undefined }}>
                              {done ? "100%" : "0%"}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                            <motion.div initial={{ width:0 }} animate={{ width: done ? "100%" : "0%" }}
                              transition={{ duration:1.2, delay: i * 0.15 }}
                              className="h-full rounded-full"
                              style={{ background: done ? "linear-gradient(90deg,#ff4db860,#ff4db8)" : "transparent", boxShadow: done ? "0 0 10px #ff4db8" : "none" }} />
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="font-mono text-sm text-muted-foreground border border-white/5 p-4 rounded-xl bg-white/[0.02]">
                      Cargando certificaciones...
                    </div>
                  )}
                </div>
              </motion.section>

              {/* LEVEL TASKS */}
              <motion.section initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.15 }}>
                <div className="rounded-xl border border-white/8 bg-[#060610] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-mono font-bold text-primary flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4" /> MISIONES DE NIVEL
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground">→ Nivel {level + 1}</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label:"Completa tu perfil",  xp:"+50 XP",  done:true },
                      { label:"Únete a un equipo",   xp:"+100 XP", done:!!userSquad },
                      { label:"Gana un torneo",      xp:"+500 XP", done:false },
                    ].map(({ label, xp, done }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 font-mono text-[10px] ${done ? "bg-primary/20 border-primary text-primary" : "border-white/20"}`}>
                          {done && "✓"}
                        </div>
                        <span className={`text-sm font-mono flex-1 ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>{label}</span>
                        <span className={`text-xs font-mono ${done ? "text-primary/50" : "text-secondary"}`}>{xp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            </div>

            {/* RIGHT — activity terminal */}
            <div className="space-y-6">
              <motion.section initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.4, delay:0.1 }}>
                <h2 className="text-base font-mono font-bold mb-4 text-primary flex items-center gap-2">
                  <span className="text-secondary">&gt;</span> TERMINAL_ACTIVIDAD
                </h2>
                <div className="rounded-xl border border-white/5 bg-[#020208] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-black/40">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    <span className="font-mono text-[10px] text-muted-foreground ml-2">activity.log — {username}</span>
                  </div>
                  <div className="p-4 h-[300px] overflow-y-auto font-mono text-xs space-y-2.5">
                    <div className="text-muted-foreground/40 pb-2 border-b border-white/5">
                      <span className="text-primary">root@chiara</span>
                      <span className="text-muted-foreground">:~# </span>
                      <span className="text-white">cat activity.log | tail -20</span>
                    </div>
                    {activities.map((act, i) => (
                      <div key={i} className="flex gap-2 items-start group">
                        <span className="text-muted-foreground/30 shrink-0 text-[9px] leading-5">[{act.time}]</span>
                        <span className="shrink-0 leading-5" style={{ color:(actColor as any)[act.type] }}>{(actIcon as any)[act.type]}</span>
                        <span className="text-foreground/75 flex-1 group-hover:text-foreground/95 transition-colors">{act.action}</span>
                        {act.pts && <span className="text-primary shrink-0 font-bold">{act.pts}</span>}
                      </div>
                    ))}
                    <div className="flex gap-2 items-center pt-1">
                      <span className="text-primary">$</span>
                      <span className="w-2 h-4 bg-primary/80 animate-pulse" />
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Wallet mini card */}
              {wallet && (
                <motion.section initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.4, delay:0.2 }}>
                  <Link href="/wallet">
                    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-[#0d0418] to-[#06060f] p-5 cursor-pointer hover:border-primary/40 transition-all group"
                      style={{ boxShadow:"0 0 20px rgba(255,77,184,0.05)" }}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-xs font-bold text-primary tracking-widest">MI BILLETERA</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="text-3xl font-mono font-black text-white mb-1">{balance.toLocaleString()} <span className="text-primary text-lg">SPC</span></div>
                      <div className="text-xs text-muted-foreground font-mono">≈ €{balanceEur} EUR</div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
                        <div>
                          <div className="text-[9px] font-mono text-muted-foreground/60 mb-0.5">TOTAL GANADO</div>
                          <div className="font-mono text-xs text-green-400 font-bold">+{totalEarned.toLocaleString()} SPC</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-mono text-muted-foreground/60 mb-0.5">EQUIVALENTE</div>
                          <div className="font-mono text-xs text-green-400 font-bold">€{totalEarnedEur}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.section>
              )}
            </div>
          </div>
        )}

        {/* ── MI NEGOCIO TAB ────────────────────────────────────────── */}
        {profileTab === "negocio" && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}
            className="space-y-6">

            {/* Wallet summary row */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label:"SALDO DISPONIBLE",  value:`${balance.toLocaleString()} SPC`,      sub:`≈ €${balanceEur}`,       color:"#ff4db8", icon:<Coins className="h-5 w-5" /> },
                { label:"TOTAL GANADO",       value:`${totalEarned.toLocaleString()} SPC`,  sub:`≈ €${totalEarnedEur}`,   color:"#34d399", icon:<TrendingUp className="h-5 w-5" /> },
                { label:"RETIROS SOLICITADOS",value:`${payouts.length}`,                    sub:payouts.length > 0 ? `Último: ${payouts[0]?.status || "pendiente"}` : "Sin retiros aún", color:"#9b55f9", icon:<Download className="h-5 w-5" /> },
              ].map(({ label, value, sub, color, icon }) => (
                <div key={label} className="rounded-xl border border-white/8 bg-[#06060f] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] text-muted-foreground tracking-widest">{label}</span>
                    <div className="p-1.5 rounded-lg" style={{ background:`${color}15`, color }}>{icon}</div>
                  </div>
                  <div className="font-mono text-2xl font-black text-white mb-0.5">{value}</div>
                  <div className="font-mono text-xs text-muted-foreground">{sub}</div>
                </div>
              ))}
            </div>

            {/* Earnings breakdown */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* By type */}
              <div className="rounded-xl border border-white/8 bg-[#06060f] p-5">
                <h3 className="font-mono text-sm font-bold text-primary mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> INGRESOS POR TIPO
                </h3>
                {Object.keys(earningsByType).length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-mono text-xs text-muted-foreground">Sin transacciones registradas todavía</p>
                    <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">Completa máquinas, torneos o vende cursos para ver tus ingresos aquí</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(earningsByType)
                      .sort(([,a],[,b]) => (b as number) - (a as number))
                      .map(([type, amount]) => {
                        const info = TX_ICONS[type] || TX_ICONS.earned;
                        const pct = totalEarned > 0 ? Math.round((amount as number / totalEarned) * 100) : 0;
                        return (
                          <div key={type}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                                <span>{info.icon}</span> {info.label}
                              </span>
                              <span className="font-mono text-xs font-bold text-white">{(amount as number).toLocaleString()} SPC</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }}
                                transition={{ duration:0.8, ease:"easeOut" }}
                                className="h-full rounded-full" style={{ background:info.color }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Quick actions */}
                <div className="mt-5 pt-5 border-t border-white/5 flex gap-2">
                  <Link href="/wallet" className="flex-1">
                    <Button className="w-full font-mono text-xs font-bold gap-1.5"
                      style={{ background:"rgba(255,77,184,0.15)", border:"1px solid rgba(255,77,184,0.3)", color:"#ff4db8" }}>
                      <Wallet className="h-3.5 w-3.5" /> VER WALLET COMPLETA
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Recent transactions */}
              <div className="rounded-xl border border-white/8 bg-[#06060f] p-5">
                <h3 className="font-mono text-sm font-bold text-primary mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> ÚLTIMAS TRANSACCIONES
                </h3>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Coins className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-mono text-xs text-muted-foreground">Sin movimientos aún</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {transactions.slice(0, 12).map((tx, i) => {
                      const info = TX_ICONS[tx.type] || TX_ICONS.earned;
                      const isPos = tx.amount > 0;
                      return (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm"
                            style={{ background:`${info.color}15`, border:`1px solid ${info.color}30` }}>
                            {info.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-[10px] text-foreground/80 truncate">{tx.description}</p>
                            <p className="font-mono text-[8px] text-muted-foreground/50">
                              {new Date(tx.createdAt).toLocaleDateString("es-ES", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                            </p>
                          </div>
                          <span className={`font-mono text-xs font-bold shrink-0 ${isPos ? "text-green-400" : "text-red-400"}`}>
                            {isPos ? "+" : ""}{tx.amount.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── PLATFORM FEE TABLE ─── */}
            <div className="rounded-xl border border-white/8 bg-[#06060f] overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Percent className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-white">COMISIONES DE LA PLATAFORMA</h3>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Desglose de qué porcentaje retiene SpettroWeb por tipo de actividad</p>
                </div>
              </div>

              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-5 py-2 border-b border-white/5 bg-white/[0.015]">
                <span className="col-span-5 font-mono text-[9px] text-muted-foreground/60 tracking-widest uppercase">Actividad</span>
                <span className="col-span-3 font-mono text-[9px] text-muted-foreground/60 tracking-widest uppercase text-center">Plataforma</span>
                <span className="col-span-3 font-mono text-[9px] text-muted-foreground/60 tracking-widest uppercase text-center">Tú recibes</span>
                <span className="col-span-1" />
              </div>

              {FEE_TABLE.map((row, i) => (
                <div key={i}
                  className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-white/5 hover:bg-white/[0.015] transition-colors items-center group">
                  <div className="col-span-5 flex items-center gap-2">
                    <div className="shrink-0" style={{ color: row.color }}>{row.icon}</div>
                    <div>
                      <span className="font-mono text-xs text-foreground/80">{row.label}</span>
                      {row.note && (
                        <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">{row.note}</p>
                      )}
                    </div>
                  </div>

                  {/* Platform % bar */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width:0 }} animate={{ width:`${row.plat}%` }}
                          transition={{ duration:0.8, delay:i * 0.06 }}
                          className="h-full rounded-full bg-red-500/60" />
                      </div>
                      <span className="font-mono text-xs font-bold text-red-400 w-8 text-right shrink-0">{row.plat}%</span>
                    </div>
                  </div>

                  {/* You % bar */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width:0 }} animate={{ width:`${row.you}%` }}
                          transition={{ duration:0.8, delay:i * 0.06 + 0.1 }}
                          className="h-full rounded-full"
                          style={{ background:`linear-gradient(90deg, ${row.color}80, ${row.color})` }} />
                      </div>
                      <span className="font-mono text-xs font-bold w-8 text-right shrink-0" style={{ color: row.color }}>{row.you}%</span>
                    </div>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded font-bold ${row.you >= 80 ? "bg-green-500/15 text-green-400" : row.you >= 70 ? "bg-yellow-500/15 text-yellow-400" : "bg-orange-500/15 text-orange-400"}`}>
                      {row.you >= 80 ? "BUENO" : row.you >= 70 ? "OK" : "AFIL."}
                    </span>
                  </div>
                </div>
              ))}

              {/* Footer note */}
              <div className="px-5 py-3 flex items-start gap-2 bg-white/[0.01]">
                <AlertCircle className="h-3 w-3 text-muted-foreground/50 shrink-0 mt-0.5" />
                <p className="font-mono text-[9px] text-muted-foreground/50 leading-relaxed">
                  Los porcentajes aplican sobre el importe bruto. El retiro mínimo es de 10,000 SPC (≈ €10.00). Los pagos se procesan en 3–5 días hábiles. SpettroWeb retiene la comisión automáticamente en el momento de la transacción.
                </p>
              </div>
            </div>

            {/* Affiliate + selling CTA */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-950/20 to-transparent p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/15">
                    <Gift className="h-4 w-4 text-orange-400" />
                  </div>
                  <h4 className="font-mono text-sm font-bold text-orange-300">PROGRAMA DE AFILIADOS</h4>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  Refiere a nuevas hackers y gana el <span className="text-orange-400 font-bold">10% de su primer pago</span>. Sin límite de referidos.
                </p>
                <Button className="w-full font-mono text-xs font-bold"
                  style={{ background:"rgba(251,146,60,0.15)", border:"1px solid rgba(251,146,60,0.3)", color:"#fb923c" }}>
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> VER MI CÓDIGO AFILIADO
                </Button>
              </div>

              <div className="rounded-xl border border-secondary/20 bg-gradient-to-br from-purple-950/20 to-transparent p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-secondary/15">
                    <BookOpen className="h-4 w-4 text-secondary" />
                  </div>
                  <h4 className="font-mono text-sm font-bold text-purple-300">VENDE TUS CURSOS</h4>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  Crea y publica cursos de hacking. Gana el <span className="text-secondary font-bold">70% de cada matrícula</span>. SpettroWeb gestiona pagos y hosting.
                </p>
                <Link href="/cursos">
                  <Button className="w-full font-mono text-xs font-bold"
                    style={{ background:"rgba(155,85,249,0.15)", border:"1px solid rgba(155,85,249,0.3)", color:"#9b55f9" }}>
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" /> CREAR UN CURSO
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── MENSAJES TAB ──────────────────────────────────────────── */}
        {profileTab === "mensajes" && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}
            className="space-y-4">

            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} sin leer · ` : ""}{allMessages.length} mensajes en total
              </p>
              <div className="flex gap-1">
                {["TODOS", "ESCUADRA", "SISTEMA", "SPC"].map(f => (
                  <button key={f}
                    className="font-mono text-[10px] px-2 py-1 rounded border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors">
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#050510] overflow-hidden divide-y divide-white/5">
              {allMessages.map(msg => (
                <div key={msg.id}>
                  <div
                    onClick={() => setExpandedMsg(expandedMsg === msg.id ? null : msg.id)}
                    className={`p-4 cursor-pointer flex items-start gap-3 transition-colors hover:bg-white/[0.02] ${(msg as any).unread ? "bg-primary/[0.035]" : ""}`}>
                    <div className="relative shrink-0 mt-0.5">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs border`}
                        style={(msg as any).colorStyle
                          ? { background:`${(msg as any).colorStyle}15`, color:(msg as any).colorStyle, borderColor:`${(msg as any).colorStyle}30` }
                          : {}}>
                        {!("colorStyle" in msg) ? (
                          <span className={(msg as any).color}>{(msg as any).initials}</span>
                        ) : (
                          <span className="text-base">{(msg as any).initials}</span>
                        )}
                      </div>
                      {(msg as any).unread && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`font-mono text-xs font-bold truncate ${(msg as any).unread ? "text-white" : "text-muted-foreground"}`}>
                            {msg.sender}
                          </span>
                          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground/60 shrink-0">
                            {(msg as any).tag}
                          </span>
                          {(msg as any).amount !== undefined && (
                            <span className={`font-mono text-[9px] font-bold shrink-0 ${(msg as any).amount > 0 ? "text-green-400" : "text-red-400"}`}>
                              {(msg as any).amount > 0 ? "+" : ""}{(msg as any).amount} SPC
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{msg.time}</span>
                      </div>
                      <p className={`text-xs truncate ${(msg as any).unread ? "text-foreground/70" : "text-muted-foreground/50"}`}>{msg.preview}</p>
                    </div>

                    <div className="text-muted-foreground self-center shrink-0">
                      {expandedMsg === msg.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedMsg === msg.id && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}>
                        <div className="p-4 pl-16 border-t border-white/5 bg-black/30">
                          <p className="text-xs text-foreground/80 leading-relaxed mb-3">{msg.full}</p>
                          {!(msg as any).amount && (
                            <button className="text-[10px] font-mono text-secondary hover:text-secondary/80 flex items-center gap-1 transition-colors">
                              <span>↩</span> RESPONDER
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </main>

      {/* ── EDIT MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {editOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)" }}
            onClick={e => { if (e.target === e.currentTarget) setEditOpen(false); }}>
            <motion.div
              initial={{ opacity:0, scale:0.92, y:24 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.92, y:24 }}
              transition={{ type:"spring", damping:22, stiffness:260 }}
              className="w-full max-w-sm bg-[#06060f] border border-primary/30 rounded-2xl overflow-hidden"
              style={{ boxShadow:"0 0 60px rgba(255,77,184,0.12)" }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <h2 className="font-mono font-bold text-primary text-sm tracking-widest">&gt; EDITAR_PERFIL</h2>
                <button onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-white transition-colors p-1 rounded hover:bg-white/5">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Foto de perfil</p>
                  <div className="relative w-28 h-28 cursor-pointer group" onClick={() => fileRef.current?.click()}>
                    <div className="absolute inset-0 rounded-full overflow-hidden border-2 transition-all group-hover:brightness-75"
                      style={{ borderColor:rankCfg.glow, boxShadow:`0 0 20px ${rankCfg.glow}40` }}>
                      <div className="absolute inset-0 rounded-full"
                        style={{ background:`radial-gradient(circle at 38% 35%, ${rankCfg.glow}25, #04040e 60%)` }} />
                      {editImg ? (
                        <img src={editImg} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl"
                          style={{ filter:`drop-shadow(0 0 10px ${rankCfg.glow})` }}>
                          {avatarEmoji[avatarType] || "👻"}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/65 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <Camera className="h-7 w-7 text-white mb-1" />
                      <span className="font-mono text-[10px] text-white tracking-widest">SUBIR</span>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <div className="flex gap-2">
                    <button onClick={() => fileRef.current?.click()}
                      className="font-mono text-xs px-3 py-1.5 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5" /> Subir imagen
                    </button>
                    {editImg && (
                      <button onClick={() => setEditImg(null)}
                        className="font-mono text-xs px-3 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Alias / Nombre hacker</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-primary text-sm select-none pointer-events-none">$</span>
                    <input value={editAlias} onChange={e => setEditAlias(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !editSaving) handleSave(); }}
                      className="w-full bg-black/50 border border-white/15 rounded-lg py-2.5 pl-8 pr-4 font-mono text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors"
                      placeholder="Tu alias hacker..." maxLength={32} autoFocus />
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground/50">{editAlias.length}/32 caracteres</p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setEditOpen(false)}
                    className="flex-1 font-mono text-xs py-2.5 rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors">
                    CANCELAR
                  </button>
                  <button onClick={handleSave} disabled={editSaving || !editAlias.trim()}
                    className="flex-1 font-mono text-xs py-2.5 rounded-lg bg-primary text-black font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                    {editSaving ? <span className="animate-spin inline-block text-base leading-none">◈</span> : <><Check className="h-3.5 w-3.5" /> GUARDAR</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
