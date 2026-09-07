import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Coins, TrendingUp, ArrowDownLeft, ArrowUpRight, Trophy, BookOpen,
  Swords, Gift, ChevronLeft, Star, Crown, Zap, ExternalLink, Copy,
  ShieldCheck, Flame, Send, ShoppingCart, Package, Check, RefreshCw,
  DollarSign, Video, FileText, Users, ArrowRight, Banknote, Wallet2,
  CreditCard, Lock, ChevronRight, AlertCircle, Globe, Smartphone
} from "lucide-react";
import { useState, useRef } from "react";

const BASE = import.meta.env.BASE_URL;

interface Wallet {
  id: number;
  userId: number;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: string;
}

interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  referenceId: string | null;
  createdAt: string;
}

interface LeaderEntry {
  userId: number;
  balance: number;
  totalEarned: number;
  username: string;
  rank: string;
}

const TX_ICON: Record<string, React.ReactNode> = {
  earned: <ArrowDownLeft className="h-4 w-4 text-green-400"/>,
  bonus: <Gift className="h-4 w-4 text-yellow-400"/>,
  tournament: <Trophy className="h-4 w-4 text-yellow-400"/>,
  battle: <Swords className="h-4 w-4 text-red-400"/>,
  course: <BookOpen className="h-4 w-4 text-primary"/>,
  spent: <ArrowUpRight className="h-4 w-4 text-red-400"/>,
};

const TX_COLOR: Record<string, string> = {
  earned: "text-green-400",
  bonus: "text-yellow-400",
  tournament: "text-yellow-400",
  battle: "text-red-400",
  course: "text-primary",
  spent: "text-red-400",
};

const EARN_WAYS = [
  {
    group: "COMPETIR",
    items: [
      { icon: <Swords className="h-5 w-5"/>, label: "Ganar un combate CTF", amount: "+500 SPC", color: "#ef4444", desc: "Derrota a una escuadra rival en el servidor CTF" },
      { icon: <Trophy className="h-5 w-5"/>, label: "Ganar un torneo", amount: "+1.000–5.000 SPC", color: "#f59e0b", desc: "Primer puesto en torneos de la academia" },
      { icon: <ShieldCheck className="h-5 w-5"/>, label: "Resolver una máquina", amount: "+20–100 SPC", color: "#9b55f9", desc: "Por cada máquina VulnYX que comprometeas" },
    ]
  },
  {
    group: "APRENDER",
    items: [
      { icon: <BookOpen className="h-5 w-5"/>, label: "Completar un curso", amount: "+100–500 SPC", color: "#ff4db8", desc: "Al finalizar cada módulo o curso completo" },
      { icon: <Gift className="h-5 w-5"/>, label: "Bonus de registro", amount: "+50 SPC", color: "#9ca3af", desc: "Una sola vez al crear tu cuenta" },
      { icon: <Star className="h-5 w-5"/>, label: "Referir un amigo", amount: "+200 SPC", color: "#f59e0b", desc: "Por cada usuario que se registre con tu enlace" },
    ]
  },
  {
    group: "ENSEÑAR Y CREAR",
    items: [
      { icon: <Video className="h-5 w-5"/>, label: "Impartir una tutoría 1:1", amount: "precio libre en SPC", color: "#9b55f9", desc: "Ofrece sesiones personales y cobra en SPC", link: "/tutorias" },
      { icon: <Package className="h-5 w-5"/>, label: "Vender en el Marketplace", amount: "precio libre en SPC", color: "#ff4db8", desc: "Publica writeups, scripts, apuntes o tools", link: "/marketplace" },
      { icon: <BookOpen className="h-5 w-5"/>, label: "Crear y vender un curso", amount: "% de cada matrícula en SPC", color: "#34d399", desc: "Sube tu propio curso y cobra por cada alumno", link: "/cursos" },
      { icon: <FileText className="h-5 w-5"/>, label: "Crear una máquina para el lab", amount: "+500–2.000 SPC", color: "#facc15", desc: "Diseña retos para el VulnYX y gana por cada solve" },
    ]
  },
  {
    group: "COMUNIDAD",
    items: [
      { icon: <Users className="h-5 w-5"/>, label: "Apostar en torneos", amount: "variable", color: "#ef4444", desc: "Apuesta SPC en combates entre equipos y multiplica" },
      { icon: <Zap className="h-5 w-5"/>, label: "Streak de actividad diaria", amount: "+10–50 SPC / día", color: "#ff4db8", desc: "Mantén tu racha activa en la plataforma" },
    ]
  }
];

const SPC_PACKS = [
  { id: "starter",  label: "STARTER",  spc: 1000,  bonus: 0,    eurCents: 100,  color: "#9ca3af", icon: "🎯", desc: "Para empezar" },
  { id: "hacker",   label: "HACKER",   spc: 5000,  bonus: 500,  eurCents: 450,  color: "#ff4db8", icon: "💻", desc: "+500 SPC bonus" },
  { id: "elite",    label: "ELITE",    spc: 12000, bonus: 2000, eurCents: 1000, color: "#9b55f9", icon: "⚡", desc: "+2.000 SPC bonus" },
  { id: "master",   label: "MASTER",   spc: 30000, bonus: 6000, eurCents: 2000, color: "#facc15", icon: "👑", desc: "+6.000 SPC bonus" },
];

export default function Wallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"wallet" | "leaderboard" | "earn" | "comprar" | "enviar" | "retirar">("wallet");

  // Payout state
  const [payoutAmount, setPayoutAmount] = useState(5000);
  const [payoutMethod, setPayoutMethod] = useState<"paypal" | "bank" | "bizum">("paypal");
  const [payoutDestination, setPayoutDestination] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);
  const { data: myPayouts = [] } = useQuery<{ id: number; amountSpc: number; amountEur: number; status: string; method: string; destination: string; createdAt: string }[]>({
    queryKey: ["payouts-mine", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const r = await fetch(`${BASE}api/payouts/requests/${user.id}`);
      return r.json();
    },
    enabled: !!user,
  });
  const requestPayout = async () => {
    if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
    if (!payoutDestination.trim()) { toast({ title: "Indica tu cuenta de destino", variant: "destructive" }); return; }
    setRequestingPayout(true);
    try {
      const r = await fetch(`${BASE}api/payouts/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username: user.username, amountSpc: payoutAmount, method: payoutMethod, destination: payoutDestination }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: "Retiro solicitado", description: `Se procesará en 24–72h. Recibirás €${(payoutAmount / 1000).toFixed(2)}.` });
      qc.invalidateQueries({ queryKey: ["wallet", user.id] });
      qc.invalidateQueries({ queryKey: ["payouts-mine", user.id] });
      setPayoutDestination("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRequestingPayout(false);
    }
  };

  // Send SPC state
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState(50);
  const [sendNote, setSendNote] = useState("");
  const [sendingCoins, setSendingCoins] = useState(false);

  // Buy SPC / Checkout state
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [buyingPack, setBuyingPack] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"packs" | "payment">("packs");
  const [payMethod, setPayMethod] = useState<"card" | "paypal" | "bizum" | "applepay" | "googlepay">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardFlipped, setCardFlipped] = useState(false);
  const [payEmail, setPayEmail] = useState("");
  const [payPhone, setPayPhone] = useState("");
  const cvvRef = useRef<HTMLInputElement>(null);

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };
  const detectCardBrand = (num: string) => {
    const d = num.replace(/\s/g, "");
    if (d.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(d)) return "mastercard";
    if (/^6/.test(d)) return "bancomat";
    if (/^3[47]/.test(d)) return "amex";
    return "unknown";
  };
  const cardBrand = detectCardBrand(cardNumber);
  const maskedCard = cardNumber || "•••• •••• •••• ••••";

  const resetCheckout = () => {
    setCheckoutStep("packs");
    setSelectedPack(null);
    setCardNumber(""); setCardExpiry(""); setCardCvv(""); setCardHolder("");
    setPayEmail(""); setPayPhone(""); setCardFlipped(false);
  };

  const buyPack = async (packId: string) => {
    if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
    setSelectedPack(packId);
    setBuyingPack(true);
    try {
      const r = await fetch(`${BASE}api/spc/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, packId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const pack = SPC_PACKS.find(p => p.id === packId)!;
      const total = pack.spc + pack.bonus;
      qc.invalidateQueries({ queryKey: ["wallet", user.id] });
      toast({ title: `✓ Pack ${pack.label} adquirido`, description: `+${total.toLocaleString()} SPC añadidos a tu wallet` });
      setTab("wallet");
    } catch (err: any) {
      toast({ title: "Error al comprar", description: err.message, variant: "destructive" });
    } finally {
      setBuyingPack(false);
      setSelectedPack(null);
    }
  };

  const sendCoins = async () => {
    if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
    if (!sendTo.trim()) { toast({ title: "Escribe el usuario destino", variant: "destructive" }); return; }
    if (sendAmount < 1) { toast({ title: "Cantidad mínima: 1 SPC", variant: "destructive" }); return; }
    setSendingCoins(true);
    try {
      const r = await fetch(`${BASE}api/spc/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: user.id, toUsername: sendTo.trim(), amount: sendAmount, note: sendNote || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      qc.invalidateQueries({ queryKey: ["wallet", user.id] });
      toast({ title: `✓ ${sendAmount.toLocaleString()} SPC enviados a ${d.to}` });
      setSendTo(""); setSendNote(""); setSendAmount(50);
    } catch (err: any) {
      toast({ title: "Error al enviar", description: err.message, variant: "destructive" });
    } finally {
      setSendingCoins(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: () => fetch(`${BASE}api/wallet/${user!.id}`).then(r => r.json()),
    enabled: !!user,
  });

  const { data: leaderboard = [] } = useQuery<LeaderEntry[]>({
    queryKey: ["wallet-leaderboard"],
    queryFn: () => fetch(`${BASE}api/wallet/leaderboard`).then(r => r.json()),
  });

  const wallet: Wallet | null = data?.wallet ?? null;
  const transactions: Transaction[] = data?.transactions ?? [];

  const spcToEur = (spc: number) => (spc / 1000).toFixed(2);
  const eurToSpc = (eur: number) => Math.floor(eur * 1000);

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <Coins className="h-16 w-16 mx-auto mb-4 text-primary/30"/>
            <h2 className="font-mono font-bold text-2xl text-primary mb-2">SpettroCoin Wallet</h2>
            <p className="text-muted-foreground mb-6">Necesitas una cuenta para acceder a tu billetera.</p>
            <Link href="/suscripcion">
              <Button className="bg-primary text-black font-mono font-bold">REGISTRARSE GRATIS</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <PublicNav />

      {/* HERO */}
      <div className="relative w-full pt-12 pb-8 border-b border-primary/20 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,77,184,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,77,184,0.08) 1px,transparent 1px)", backgroundSize: "40px 40px" }}/>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,77,184,0.05)_0,transparent_65%)]"/>
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="h-3.5 w-3.5"/><span className="tracking-widest">INICIO</span>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-primary/70 tracking-[0.4em] mb-3">
                <Coins className="h-3 w-3"/>SPETTROCOIN — MONEDA OFICIAL
              </div>
              <h1 className="font-mono font-black text-4xl md:text-5xl leading-none mb-2">
                <span className="text-foreground">&gt; </span>
                <span className="text-primary">WALLET</span>
              </h1>
              <p className="text-muted-foreground text-sm">Gana SPC compitiendo, estudiando y resolviendo máquinas. Canjéalos por dinero real.</p>
            </div>

            {/* Balance card */}
            {isLoading ? (
              <div className="w-64 h-32 rounded-2xl bg-[#0d0d14] border border-primary/20 animate-pulse"/>
            ) : wallet ? (
              <div className="w-full md:w-auto min-w-[260px] rounded-2xl border border-primary/30 bg-[#0d0d14] p-6 shadow-[0_0_30px_rgba(255,77,184,0.08)]">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="h-4 w-4 text-primary"/>
                  <span className="font-mono text-xs text-primary/70 tracking-widest">BALANCE ACTUAL</span>
                </div>
                <div className="font-mono font-black text-4xl text-primary mb-1">
                  {wallet.balance.toLocaleString()} <span className="text-xl text-primary/60">SPC</span>
                </div>
                <div className="font-mono text-sm text-muted-foreground">
                  ≈ <span className="text-green-400 font-bold">€{spcToEur(wallet.balance)}</span> EUR
                </div>
                <div className="mt-3 pt-3 border-t border-primary/10 flex gap-4 font-mono text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-400"/>{wallet.totalEarned.toLocaleString()} ganados</span>
                  <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-red-400"/>{wallet.totalSpent.toLocaleString()} gastados</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Conversion info banner */}
      <div className="bg-primary/5 border-b border-primary/15 py-2">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Coins className="h-3 w-3 text-primary"/>1000 SPC = €1,00 EUR</span>
          <span className="text-primary/30">|</span>
          <span className="flex items-center gap-1.5"><Flame className="h-3 w-3 text-red-400"/>500 SPC por ganar un combate CTF</span>
          <span className="text-primary/30">|</span>
          <span className="flex items-center gap-1.5"><Crown className="h-3 w-3 text-yellow-400"/>1000 SPC por ganar un torneo</span>
          <span className="text-primary/30">|</span>
          <span className="flex items-center gap-1.5"><BookOpen className="h-3 w-3 text-primary"/>Hasta 500 SPC por completar un curso</span>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-border/30 bg-[#0a0a0f]">
        <div className="container mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {[
              { key: "wallet",      label: "MI WALLET",    icon: <Coins className="h-3.5 w-3.5"/> },
              { key: "comprar",     label: "COMPRAR SPC",  icon: <ShoppingCart className="h-3.5 w-3.5"/>, highlight: true },
              { key: "enviar",      label: "ENVIAR SPC",   icon: <Send className="h-3.5 w-3.5"/> },
              { key: "retirar",     label: "RETIRAR €",    icon: <Banknote className="h-3.5 w-3.5"/>, highlightGreen: true },
              { key: "leaderboard", label: "RANKING",      icon: <Trophy className="h-3.5 w-3.5"/> },
              { key: "earn",        label: "GANAR SPC",    icon: <Zap className="h-3.5 w-3.5"/> },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`flex items-center gap-1.5 px-4 py-4 font-mono text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  tab === t.key
                    ? ((t as any).highlight ? "border-yellow-400 text-yellow-400" : (t as any).highlightGreen ? "border-green-400 text-green-400" : "border-primary text-primary")
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* WALLET TAB */}
        {tab === "wallet" && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="font-mono font-bold text-sm text-muted-foreground tracking-widest mb-4">HISTORIAL DE TRANSACCIONES</h2>
              {isLoading ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-lg bg-[#0d0d14] border border-border/20 animate-pulse"/>)}</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-16 font-mono text-muted-foreground">
                  <Coins className="h-10 w-10 mx-auto mb-3 opacity-20"/>
                  <p className="text-sm">Aún no tienes transacciones.</p>
                  <p className="text-xs mt-1">¡Gana tu primer SPC resolviendo una máquina o completando un curso!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-[#0d0d14] border border-border/20 hover:border-primary/20 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-background border border-border/30 flex items-center justify-center flex-shrink-0">
                        {TX_ICON[tx.type] || <Coins className="h-4 w-4 text-primary"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-bold text-foreground truncate">{tx.description}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div className={`font-mono font-black text-sm flex-shrink-0 ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} SPC
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Side panel */}
            <div className="space-y-4">
              {/* Stats */}
              <div className="rounded-xl border border-border/20 bg-[#0d0d14] p-5">
                <h3 className="font-mono font-bold text-xs text-muted-foreground tracking-widest mb-4">ESTADÍSTICAS</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-muted-foreground">Balance</span>
                    <span className="font-mono font-bold text-primary">{wallet?.balance.toLocaleString() ?? 0} SPC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-muted-foreground">Total ganado</span>
                    <span className="font-mono font-bold text-green-400">{wallet?.totalEarned.toLocaleString() ?? 0} SPC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-muted-foreground">Total gastado</span>
                    <span className="font-mono font-bold text-red-400">{wallet?.totalSpent.toLocaleString() ?? 0} SPC</span>
                  </div>
                  <div className="pt-2 border-t border-border/20 flex justify-between items-center">
                    <span className="font-mono text-xs text-muted-foreground">Valor en EUR</span>
                    <span className="font-mono font-bold text-yellow-400">€{spcToEur(wallet?.balance ?? 0)}</span>
                  </div>
                </div>
              </div>

              {/* Redeem info */}
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <h3 className="font-mono font-bold text-xs text-yellow-400 tracking-widest mb-3">💰 CANJEAR SPC</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Cuando alcances <span className="text-yellow-400 font-bold">10,000 SPC (€10)</span>, puedes solicitar una transferencia bancaria o PayPal.
                </p>
                <div className="font-mono text-xs text-muted-foreground mb-3 space-y-1">
                  <div>Mínimo de canje: <span className="text-yellow-400">10,000 SPC</span></div>
                  <div>Ratio: <span className="text-yellow-400">1000 SPC = €1</span></div>
                </div>
                <Button
                  disabled={(wallet?.balance ?? 0) < 10000}
                  className="w-full font-mono font-bold bg-yellow-500 hover:bg-yellow-400 text-black text-xs"
                  onClick={() => alert("Función de canje próximamente. Contacta a soporte@spettroweb.com")}
                >
                  {(wallet?.balance ?? 0) >= 10000 ? "SOLICITAR CANJE" : `FALTAN ${Math.max(0, 10000 - (wallet?.balance ?? 0)).toLocaleString()} SPC`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* COMPRAR SPC TAB */}
        {tab === "comprar" && (
          <div className="max-w-5xl mx-auto">

            {/* ── STEP 1: Pack selection ── */}
            {checkoutStep === "packs" && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/5 font-mono text-[10px] text-yellow-400 mb-4">
                    <Coins className="h-3 w-3"/> 1.000 SPC = €1,00 · IVA incluido
                  </div>
                  <h2 className="font-mono font-black text-3xl text-foreground mb-2">ELIGE TU PACK</h2>
                  <p className="text-muted-foreground text-sm font-mono">SpettroCoin para torneos, contenido premium y apoyo a instructores.</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                  {SPC_PACKS.map(pack => {
                    const total = pack.spc + pack.bonus;
                    const isSelected = selectedPack === pack.id;
                    return (
                      <div key={pack.id}
                        className={`relative rounded-2xl border p-6 flex flex-col gap-5 cursor-pointer transition-all duration-200 ${isSelected ? "scale-[1.03]" : "hover:scale-[1.01]"}`}
                        style={{ borderColor: isSelected ? pack.color : pack.color + "35", background: isSelected ? pack.color + "12" : pack.color + "06", boxShadow: isSelected ? `0 0 30px ${pack.color}25` : undefined }}
                        onClick={() => setSelectedPack(isSelected ? null : pack.id)}>

                        {pack.bonus > 0 && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-mono font-black border"
                            style={{ color: pack.color, borderColor: pack.color + "60", background: pack.color + "18" }}>
                            ✦ MEJOR VALOR
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: pack.color }}>
                            <Check className="h-3 w-3 text-black"/>
                          </div>
                        )}

                        <div className="text-center">
                          <div className="text-4xl mb-2">{pack.icon}</div>
                          <div className="font-mono font-black text-sm tracking-widest" style={{ color: pack.color }}>{pack.label}</div>
                        </div>

                        <div className="text-center space-y-1">
                          <div className="font-mono font-black text-3xl text-foreground">{pack.spc.toLocaleString()}</div>
                          <div className="font-mono text-[10px] text-muted-foreground tracking-wider">SPC BASE</div>
                          {pack.bonus > 0 && (
                            <div className="font-mono text-xs font-bold text-green-400">+{pack.bonus.toLocaleString()} SPC BONUS</div>
                          )}
                          {pack.bonus > 0 && (
                            <div className="font-mono text-[10px] text-muted-foreground">{total.toLocaleString()} SPC total</div>
                          )}
                        </div>

                        <div className="pt-4 border-t text-center" style={{ borderColor: pack.color + "25" }}>
                          <div className="font-mono font-black text-2xl mb-0.5" style={{ color: pack.color }}>€{(pack.eurCents / 100).toFixed(2)}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">IVA incluido</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Proceed CTA */}
                <div className="flex flex-col items-center gap-4">
                  {selectedPack ? (
                    <>
                      <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 font-mono text-sm">
                        <Check className="h-4 w-4 text-yellow-400"/>
                        <span className="text-foreground">Pack <span className="text-yellow-400 font-bold">{SPC_PACKS.find(p => p.id === selectedPack)?.label}</span> seleccionado —</span>
                        <span className="text-yellow-400 font-black">€{((SPC_PACKS.find(p => p.id === selectedPack)?.eurCents ?? 0) / 100).toFixed(2)}</span>
                      </div>
                      <Button onClick={() => setCheckoutStep("payment")}
                        className="font-mono font-black text-sm gap-2 h-12 px-10"
                        style={{ background: "linear-gradient(135deg,#ff4db8,#9b55f9)", color: "#fff", border: "none" }}>
                        CONTINUAR AL PAGO <ChevronRight className="h-4 w-4"/>
                      </Button>
                    </>
                  ) : (
                    <p className="font-mono text-xs text-muted-foreground">Selecciona un pack para continuar</p>
                  )}
                </div>

                {/* Trust badges */}
                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: <Lock className="h-4 w-4 text-green-400"/>, label: "SSL 256-bit", sub: "Conexión cifrada" },
                    { icon: <ShieldCheck className="h-4 w-4 text-blue-400"/>, label: "3D Secure", sub: "Autenticación bancaria" },
                    { icon: <CreditCard className="h-4 w-4 text-yellow-400"/>, label: "PCI DSS", sub: "Estándar de seguridad" },
                    { icon: <Zap className="h-4 w-4 text-primary"/>, label: "Instantáneo", sub: "SPC al momento" },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/15 bg-[#0a0a10] font-mono">
                      <div className="w-8 h-8 rounded-lg bg-white/3 flex items-center justify-center shrink-0">{b.icon}</div>
                      <div>
                        <div className="text-[11px] font-bold text-foreground">{b.label}</div>
                        <div className="text-[9px] text-muted-foreground">{b.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── STEP 2: Payment ── */}
            {checkoutStep === "payment" && (() => {
              const pack = SPC_PACKS.find(p => p.id === selectedPack)!;
              const total = pack.spc + pack.bonus;
              const cardBrandLabel = { visa: "VISA", mastercard: "Mastercard", bancomat: "Bancomat", amex: "Amex", unknown: "" }[cardBrand];
              const cardBrandColor = { visa: "#1a1f71", mastercard: "#eb001b", bancomat: "#009fe3", amex: "#2557D6", unknown: "#555" }[cardBrand];

              return (
                <div className="max-w-4xl mx-auto">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 mb-8 font-mono text-xs text-muted-foreground">
                    <button onClick={resetCheckout} className="hover:text-primary transition-colors">PACKS</button>
                    <ChevronRight className="h-3 w-3"/>
                    <span className="text-foreground font-bold">PAGO</span>
                  </div>

                  <div className="grid lg:grid-cols-[1fr_340px] gap-8">
                    {/* Left: payment form */}
                    <div className="space-y-6">
                      <h2 className="font-mono font-black text-xl text-foreground">Método de pago</h2>

                      {/* Payment method grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {/* Card */}
                        <button onClick={() => setPayMethod("card")}
                          className={`relative flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border transition-all duration-200 ${payMethod === "card" ? "border-primary bg-primary/8 shadow-[0_0_20px_rgba(255,77,184,0.12)]" : "border-border/20 bg-[#0a0a10] hover:border-primary/25"}`}>
                          {payMethod === "card" && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center"><Check className="h-2.5 w-2.5 text-black"/></div>}
                          <div className="flex gap-1.5 items-center">
                            {/* Visa */}
                            <svg viewBox="0 0 60 20" width="32" height="11"><text x="1" y="16" fill="#1a1f71" fontStyle="italic" fontWeight="900" fontSize="17" fontFamily="Arial,sans-serif">VISA</text></svg>
                            {/* MC circles */}
                            <svg viewBox="0 0 32 20" width="22" height="14"><circle cx="9" cy="10" r="9" fill="#eb001b"/><circle cx="23" cy="10" r="9" fill="#f79e1b"/><ellipse cx="16" cy="10" rx="5" ry="9" fill="#ff5f00"/></svg>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-foreground">Tarjeta</span>
                          <span className="font-mono text-[9px] text-muted-foreground">Débito · Crédito</span>
                        </button>
                        {/* Bancomat */}
                        <button onClick={() => setPayMethod("card")}
                          className={`relative flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border transition-all duration-200 border-border/20 bg-[#0a0a10] hover:border-[#009fe3]/30`}>
                          <div className="flex items-center justify-center w-10 h-7 rounded-lg" style={{ background: "linear-gradient(135deg,#009fe3,#0077b6)" }}>
                            <span className="font-black text-[9px] text-white tracking-tight">BCM</span>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-foreground">Bancomat</span>
                          <span className="font-mono text-[9px] text-muted-foreground">Débito ITA</span>
                        </button>
                        {/* PayPal */}
                        <button onClick={() => setPayMethod("paypal")}
                          className={`relative flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border transition-all duration-200 ${payMethod === "paypal" ? "border-[#003087]/70 bg-[#003087]/8 shadow-[0_0_20px_rgba(0,48,135,0.15)]" : "border-border/20 bg-[#0a0a10] hover:border-[#003087]/30"}`}>
                          {payMethod === "paypal" && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#003087] flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white"/></div>}
                          <svg viewBox="0 0 44 52" width="24" height="28">
                            <path d="M37.5 7C35 3.5 30 2 24 2H9C8 2 7 2.8 6.8 3.8L1 43.5C0.8 44.3 1.5 45 2.3 45H11L13 33.5v.5C13.2 32.5 14.2 31.7 15.2 31.7H20C29 31.7 36 27.7 38.3 17.2c.1-.4.1-.8.2-1.2C38.2 12.3 37.5 7 37.5 7z" fill="#009cde"/>
                            <path d="M38.5 16C36.2 26.5 29.2 30.5 20.2 30.5H15.2C14.2 30.5 13.2 31.3 13 32.3L11 44.7l-.6 3.8C10.2 49.3 10.9 50 11.7 50H19.5C20.4 50 21.2 49.3 21.4 48.5l.1-.4 1.5-9.7.1-.5C23.3 37.1 24.1 36.4 25 36.4H26.5C34.5 36.4 40.8 32.8 42.8 23.5 43.7 19.5 43.2 16.1 41.2 13.7 40.6 14.5 39.6 15.3 38.5 16z" fill="#012169"/>
                            <path d="M36.8 9C36.2 8.8 35.6 8.6 35 8.5c-.6-.1-1.3-.2-2-.2H20.5C18.5 8.3 17 9.7 16.8 11.7L13 33.8v.4c.2-1 1.2-1.8 2.2-1.8H20c9 0 16-4 18.3-14.5.1-.4.2-.8.2-1.2-1.7-.9-3.4-1.5-5.2-1.7-1.5-.2.3-.4-.5-.8z" fill="#003087"/>
                          </svg>
                          <span className="font-mono text-[10px] font-bold text-foreground">PayPal</span>
                          <span className="font-mono text-[9px] text-muted-foreground">Paga seguro</span>
                        </button>
                        {/* Bizum */}
                        <button onClick={() => setPayMethod("bizum")}
                          className={`relative flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border transition-all duration-200 ${payMethod === "bizum" ? "border-[#00b259]/70 bg-[#00b259]/8 shadow-[0_0_20px_rgba(0,178,89,0.15)]" : "border-border/20 bg-[#0a0a10] hover:border-[#00b259]/30"}`}>
                          {payMethod === "bizum" && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#00b259] flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white"/></div>}
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#00b259,#009944)" }}>
                            <Smartphone className="h-5 w-5 text-white"/>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-foreground">Bizum</span>
                          <span className="font-mono text-[9px] text-muted-foreground">Móvil 🇪🇸</span>
                        </button>
                      </div>

                      {/* Card form */}
                      {payMethod === "card" && (
                        <div className="space-y-5">

                          {/* ── 3D Card preview ── */}
                          <div style={{ perspective: "1400px" }} className="select-none">
                            <div style={{
                              transformStyle: "preserve-3d",
                              transition: "transform 0.65s cubic-bezier(0.4,0.2,0.2,1)",
                              transform: cardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                              position: "relative",
                              height: "200px",
                            }}>

                              {/* ── FRONT FACE ── */}
                              <div style={{
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                position: "absolute", inset: 0,
                                borderRadius: "18px",
                                overflow: "hidden",
                                background: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)",
                                boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 50px rgba(255,77,184,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
                              }}>
                                {/* Subtle mesh pattern */}
                                <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 20% 50%, rgba(255,77,184,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(155,85,249,0.1) 0%, transparent 40%)" }}/>
                                {/* Shimmer diagonal */}
                                <div style={{ position:"absolute", inset:0, background:"linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.04) 50%,transparent 60%)" }}/>
                                {/* Fine grid */}
                                <div style={{ position:"absolute", inset:0, opacity:0.06, backgroundImage:"linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize:"30px 30px" }}/>

                                <div style={{ position:"absolute", inset:0, padding:"22px 26px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                                  {/* Top row: chip + brand */}
                                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                                      {/* EMV Chip */}
                                      <svg width="46" height="36" viewBox="0 0 46 36">
                                        <rect x="0" y="0" width="46" height="36" rx="6" fill="#c8a84b"/>
                                        <rect x="0" y="0" width="46" height="36" rx="6" fill="url(#chipGrad)"/>
                                        <defs>
                                          <linearGradient id="chipGrad" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#e8c96a"/>
                                            <stop offset="50%" stopColor="#c8a84b"/>
                                            <stop offset="100%" stopColor="#a0832e"/>
                                          </linearGradient>
                                        </defs>
                                        {/* Left contact */}
                                        <rect x="0" y="12" width="10" height="12" fill="#a0832e"/>
                                        {/* Right contact */}
                                        <rect x="36" y="12" width="10" height="12" fill="#a0832e"/>
                                        {/* Top contact */}
                                        <rect x="14" y="0" width="18" height="9" fill="#a0832e"/>
                                        {/* Bottom contact */}
                                        <rect x="14" y="27" width="18" height="9" fill="#a0832e"/>
                                        {/* Center cell */}
                                        <rect x="10" y="9" width="26" height="18" rx="3" fill="#d4aa50"/>
                                        <rect x="10" y="9" width="26" height="18" rx="3" fill="url(#chipGrad2)"/>
                                        <defs>
                                          <linearGradient id="chipGrad2" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#f0d070"/>
                                            <stop offset="100%" stopColor="#b89030"/>
                                          </linearGradient>
                                        </defs>
                                        {/* Center lines */}
                                        <line x1="10" y1="18" x2="36" y2="18" stroke="#a0832e" strokeWidth="0.8"/>
                                        <line x1="23" y1="9" x2="23" y2="27" stroke="#a0832e" strokeWidth="0.8"/>
                                        <line x1="10" y1="13.5" x2="36" y2="13.5" stroke="#a0832e" strokeWidth="0.4" opacity="0.6"/>
                                        <line x1="10" y1="22.5" x2="36" y2="22.5" stroke="#a0832e" strokeWidth="0.4" opacity="0.6"/>
                                      </svg>
                                      {/* Contactless */}
                                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" opacity="0.7">
                                        <path d="M5 12.55a11 11 0 0 1 14.08 0" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                                        <path d="M1.42 9a16 16 0 0 1 21.16 0" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                                        <circle cx="12" cy="20" r="1.5" fill="white"/>
                                      </svg>
                                    </div>

                                    {/* Brand logo on card */}
                                    <div>
                                      {cardBrand === "visa" && (
                                        <svg viewBox="0 0 80 26" width="64" height="20">
                                          <text x="2" y="22" fill="white" fontStyle="italic" fontWeight="900" fontSize="24" fontFamily="Arial,sans-serif" letterSpacing="-1">VISA</text>
                                        </svg>
                                      )}
                                      {cardBrand === "mastercard" && (
                                        <svg viewBox="0 0 54 34" width="50" height="30">
                                          <circle cx="20" cy="17" r="15" fill="#eb001b"/>
                                          <circle cx="34" cy="17" r="15" fill="#f79e1b"/>
                                          <ellipse cx="27" cy="17" rx="7" ry="15" fill="#ff5f00"/>
                                        </svg>
                                      )}
                                      {cardBrand === "bancomat" && (
                                        <div style={{ background:"linear-gradient(135deg,#009fe3,#0077b6)", padding:"4px 10px", borderRadius:"6px" }}>
                                          <span style={{ color:"white", fontWeight:"900", fontSize:"13px", fontFamily:"Arial,sans-serif", letterSpacing:"0.5px" }}>BANCOMAT</span>
                                        </div>
                                      )}
                                      {cardBrand === "amex" && (
                                        <div style={{ background:"linear-gradient(135deg,#007bc1,#2557D6)", padding:"4px 10px", borderRadius:"6px" }}>
                                          <span style={{ color:"white", fontWeight:"900", fontSize:"11px", fontFamily:"Arial,sans-serif", letterSpacing:"0.5px" }}>AMERICAN EXPRESS</span>
                                        </div>
                                      )}
                                      {cardBrand === "unknown" && (
                                        <div style={{ display:"flex", gap:"4px" }}>
                                          <svg viewBox="0 0 32 20" width="22" height="14"><circle cx="9" cy="10" r="9" fill="rgba(255,255,255,0.15)"/><circle cx="23" cy="10" r="9" fill="rgba(255,255,255,0.1)"/><ellipse cx="16" cy="10" rx="5" ry="9" fill="rgba(255,255,255,0.05)"/></svg>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Card number */}
                                  <div style={{ fontFamily:"'Courier New',monospace", fontSize:"20px", fontWeight:"700", letterSpacing:"0.22em", color:"white", textShadow:"0 0 20px rgba(255,77,184,0.3)", marginTop:"4px" }}>
                                    {(cardNumber || "•••• •••• •••• ••••")}
                                  </div>

                                  {/* Bottom row */}
                                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                                    <div>
                                      <div style={{ fontFamily:"monospace", fontSize:"9px", color:"rgba(255,255,255,0.4)", letterSpacing:"0.15em", marginBottom:"3px" }}>TITULAR</div>
                                      <div style={{ fontFamily:"monospace", fontSize:"13px", fontWeight:"700", color:"white", letterSpacing:"0.08em", textTransform:"uppercase", maxWidth:"180px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                        {cardHolder || "NOMBRE APELLIDO"}
                                      </div>
                                    </div>
                                    <div style={{ textAlign:"right" }}>
                                      <div style={{ fontFamily:"monospace", fontSize:"9px", color:"rgba(255,255,255,0.4)", letterSpacing:"0.15em", marginBottom:"3px" }}>VÁLIDA HASTA</div>
                                      <div style={{ fontFamily:"monospace", fontSize:"13px", fontWeight:"700", color:"white" }}>
                                        {cardExpiry || "MM/AA"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* ── BACK FACE ── */}
                              <div style={{
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                                position: "absolute", inset: 0,
                                borderRadius: "18px",
                                overflow: "hidden",
                                background: "linear-gradient(135deg,#1a1030 0%,#231a50 50%,#1a1030 100%)",
                                boxShadow: "0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
                              }}>
                                <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 70% 80%, rgba(155,85,249,0.08) 0%, transparent 50%)" }}/>
                                {/* Magnetic strip */}
                                <div style={{ position:"absolute", top:"36px", left:0, right:0, height:"52px", background:"linear-gradient(180deg,#1a1a1a,#080808,#1a1a1a)", boxShadow:"0 2px 8px rgba(0,0,0,0.5)" }}/>
                                {/* Signature strip */}
                                <div style={{ position:"absolute", top:"110px", left:"20px", right:"20px", height:"42px", background:"repeating-linear-gradient(90deg,#f5f5f5 0px,#f5f5f5 8px,#e0e0e0 8px,#e0e0e0 9px)", borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:"8px", gap:"8px" }}>
                                  <span style={{ fontFamily:"monospace", fontSize:"11px", fontStyle:"italic", color:"#999", flexGrow:1, paddingLeft:"10px" }}>Autorizado</span>
                                  {/* CVV box */}
                                  <div style={{ background:"white", border:"1px solid #ddd", borderRadius:"4px", padding:"4px 12px", fontFamily:"'Courier New',monospace", fontSize:"16px", fontWeight:"900", color:"#111", letterSpacing:"0.2em", minWidth:"56px", textAlign:"center" }}>
                                    {cardCvv || "•••"}
                                  </div>
                                </div>
                                <div style={{ position:"absolute", top:"158px", right:"26px", fontFamily:"monospace", fontSize:"9px", color:"rgba(255,255,255,0.25)", letterSpacing:"0.1em" }}>CVC / CVV</div>
                                {/* Bottom brand */}
                                <div style={{ position:"absolute", bottom:"16px", right:"24px" }}>
                                  {cardBrand === "visa" && <svg viewBox="0 0 80 26" width="40" height="13"><text x="2" y="22" fill="rgba(255,255,255,0.3)" fontStyle="italic" fontWeight="900" fontSize="24" fontFamily="Arial,sans-serif">VISA</text></svg>}
                                  {cardBrand === "mastercard" && <svg viewBox="0 0 54 34" width="30" height="18"><circle cx="20" cy="17" r="15" fill="rgba(235,0,27,0.4)"/><circle cx="34" cy="17" r="15" fill="rgba(247,158,27,0.4)"/></svg>}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ── Card inputs ── */}
                          <div className="space-y-3 pt-1">
                            <div>
                              <label className="block font-mono text-[10px] text-muted-foreground tracking-widest mb-1.5">NÚMERO DE TARJETA</label>
                              <div className="relative">
                                <input
                                  value={cardNumber}
                                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                                  onFocus={() => setCardFlipped(false)}
                                  placeholder="0000  0000  0000  0000"
                                  inputMode="numeric"
                                  maxLength={19}
                                  className="w-full bg-[#07070e] border border-white/8 rounded-xl px-4 py-3.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/20 outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(255,77,184,0.07)] transition-all tracking-[0.15em]"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                  {cardBrand === "visa" && <svg viewBox="0 0 60 20" width="30" height="10"><text x="1" y="16" fill="#1a1f71" fontStyle="italic" fontWeight="900" fontSize="17" fontFamily="Arial,sans-serif">VISA</text></svg>}
                                  {cardBrand === "mastercard" && <svg viewBox="0 0 32 20" width="22" height="14"><circle cx="9" cy="10" r="9" fill="#eb001b"/><circle cx="23" cy="10" r="9" fill="#f79e1b"/><ellipse cx="16" cy="10" rx="5" ry="9" fill="#ff5f00"/></svg>}
                                  {cardBrand === "bancomat" && <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white" style={{ background:"#009fe3" }}>BCM</span>}
                                  {cardBrand === "amex" && <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white" style={{ background:"#2557D6" }}>AMEX</span>}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-mono text-[10px] text-muted-foreground tracking-widest mb-1.5">CADUCIDAD</label>
                                <input
                                  value={cardExpiry}
                                  onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                                  onFocus={() => setCardFlipped(false)}
                                  placeholder="MM / AA"
                                  inputMode="numeric"
                                  maxLength={5}
                                  className="w-full bg-[#07070e] border border-white/8 rounded-xl px-4 py-3.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/20 outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(255,77,184,0.07)] transition-all tracking-widest text-center"
                                />
                              </div>
                              <div>
                                <label className="block font-mono text-[10px] text-muted-foreground tracking-widest mb-1.5">CVV / CVC</label>
                                <input
                                  ref={cvvRef}
                                  value={cardCvv}
                                  onChange={e => setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4))}
                                  onFocus={() => setCardFlipped(true)}
                                  onBlur={() => setCardFlipped(false)}
                                  placeholder="• • •"
                                  inputMode="numeric"
                                  maxLength={4}
                                  className="w-full bg-[#07070e] border border-white/8 rounded-xl px-4 py-3.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/20 outline-none focus:border-yellow-400/50 focus:shadow-[0_0_0_3px_rgba(234,179,8,0.08)] transition-all tracking-[0.4em] text-center"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block font-mono text-[10px] text-muted-foreground tracking-widest mb-1.5">NOMBRE DEL TITULAR</label>
                              <input
                                value={cardHolder}
                                onChange={e => setCardHolder(e.target.value.toUpperCase())}
                                onFocus={() => setCardFlipped(false)}
                                placeholder="COMO APARECE EN LA TARJETA"
                                maxLength={26}
                                className="w-full bg-[#07070e] border border-white/8 rounded-xl px-4 py-3.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/20 outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(255,77,184,0.07)] transition-all uppercase tracking-[0.08em]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PayPal form */}
                      {payMethod === "paypal" && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-5 rounded-2xl border border-[#003087]/40 bg-[#003087]/8">
                            <div className="w-14 h-14 rounded-2xl bg-[#003087] flex items-center justify-center shrink-0">
                              <span className="font-black text-2xl text-white">P</span>
                            </div>
                            <div>
                              <div className="font-mono font-black text-base text-foreground">PayPal</div>
                              <div className="font-mono text-xs text-muted-foreground mt-0.5">Serás redirigido a PayPal para completar el pago de forma segura.</div>
                            </div>
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] text-muted-foreground tracking-widest mb-1.5">EMAIL DE PAYPAL</label>
                            <input value={payEmail} onChange={e => setPayEmail(e.target.value)}
                              placeholder="tu@email.com" type="email"
                              className="w-full bg-[#050508] border border-white/8 rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-[#003087]/60 transition-all"/>
                          </div>
                          <div className="p-3 rounded-xl border border-[#003087]/20 bg-[#003087]/5 font-mono text-[10px] text-muted-foreground">
                            No compartimos tu información con terceros. El cargo aparecerá como "SpettroWeb SL" en tu extracto.
                          </div>
                        </div>
                      )}

                      {/* Bizum form */}
                      {payMethod === "bizum" && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-5 rounded-2xl border border-[#00b259]/30 bg-[#00b259]/5">
                            <div className="w-14 h-14 rounded-2xl bg-[#00b259] flex items-center justify-center shrink-0">
                              <Smartphone className="h-7 w-7 text-white"/>
                            </div>
                            <div>
                              <div className="font-mono font-black text-base text-foreground">Bizum</div>
                              <div className="font-mono text-xs text-muted-foreground mt-0.5">Pago instantáneo con tu app bancaria. Solo disponible en España.</div>
                            </div>
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] text-muted-foreground tracking-widest mb-1.5">NÚMERO DE TELÉFONO</label>
                            <div className="flex gap-2">
                              <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-white/8 bg-[#050508] font-mono text-sm text-muted-foreground shrink-0">
                                🇪🇸 +34
                              </div>
                              <input value={payPhone} onChange={e => setPayPhone(e.target.value.replace(/\D/g,"").slice(0,9))}
                                placeholder="600 000 000" inputMode="tel"
                                className="flex-1 bg-[#050508] border border-white/8 rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-[#00b259]/60 transition-all"/>
                            </div>
                          </div>
                          <div className="p-3 rounded-xl border border-[#00b259]/20 bg-[#00b259]/5 font-mono text-[10px] text-muted-foreground">
                            Recibirás una notificación push en tu app bancaria para confirmar el pago.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: order summary */}
                    <div className="space-y-4">
                      <h3 className="font-mono font-bold text-sm text-muted-foreground tracking-widest">RESUMEN DEL PEDIDO</h3>

                      {/* Pack summary card */}
                      <div className="rounded-2xl border p-5 space-y-4"
                        style={{ borderColor: pack.color + "35", background: `linear-gradient(135deg, ${pack.color}08, transparent)` }}>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{pack.icon}</span>
                          <div>
                            <div className="font-mono font-black text-base" style={{ color: pack.color }}>Pack {pack.label}</div>
                            <div className="font-mono text-xs text-muted-foreground">{pack.desc}</div>
                          </div>
                        </div>

                        <div className="space-y-2 font-mono text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SpettroCoin base</span>
                            <span className="font-bold">{pack.spc.toLocaleString()} SPC</span>
                          </div>
                          {pack.bonus > 0 && (
                            <div className="flex justify-between text-green-400">
                              <span>Bonus incluido</span>
                              <span className="font-bold">+{pack.bonus.toLocaleString()} SPC</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Equivalencia EUR</span>
                            <span>≈ €{(total / 1000).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t flex justify-between items-center" style={{ borderColor: pack.color + "25" }}>
                          <span className="font-mono font-bold text-sm">TOTAL</span>
                          <span className="font-mono font-black text-2xl" style={{ color: pack.color }}>€{(pack.eurCents / 100).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Accepted cards */}
                      <div className="rounded-2xl border border-border/15 bg-[#07070e] p-4">
                        <div className="font-mono text-[10px] text-muted-foreground tracking-widest mb-3">MÉTODOS ACEPTADOS</div>
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Visa */}
                          <div className="h-8 px-3 rounded-lg bg-white flex items-center justify-center" style={{ minWidth:"52px" }}>
                            <svg viewBox="0 0 80 26" width="42" height="14"><text x="2" y="22" fill="#1a1f71" fontStyle="italic" fontWeight="900" fontSize="24" fontFamily="Arial,sans-serif">VISA</text></svg>
                          </div>
                          {/* Mastercard */}
                          <div className="h-8 px-2.5 rounded-lg bg-[#1a1a1a] border border-white/8 flex items-center gap-1.5 justify-center" style={{ minWidth:"64px" }}>
                            <svg viewBox="0 0 38 24" width="32" height="20"><circle cx="12" cy="12" r="11" fill="#eb001b"/><circle cx="26" cy="12" r="11" fill="#f79e1b"/><ellipse cx="19" cy="12" rx="6" ry="11" fill="#ff5f00"/></svg>
                            <span className="font-mono text-[9px] font-bold text-white/70">MC</span>
                          </div>
                          {/* Bancomat */}
                          <div className="h-8 px-3 rounded-lg flex items-center justify-center" style={{ background:"linear-gradient(135deg,#009fe3,#0077b6)", minWidth:"72px" }}>
                            <span className="font-black text-[10px] text-white tracking-wide">BANCOMAT</span>
                          </div>
                          {/* Maestro */}
                          <div className="h-8 px-2.5 rounded-lg bg-[#1a1a1a] border border-white/8 flex items-center gap-1.5 justify-center" style={{ minWidth:"62px" }}>
                            <svg viewBox="0 0 38 24" width="28" height="17"><circle cx="12" cy="12" r="11" fill="#0099df"/><circle cx="26" cy="12" r="11" fill="#eb001b"/><ellipse cx="19" cy="12" rx="6" ry="11" fill="#7929a0"/></svg>
                            <span className="font-mono text-[9px] font-bold text-white/70">Maestro</span>
                          </div>
                          {/* PayPal */}
                          <div className="h-8 px-3 rounded-lg bg-[#003087] flex items-center justify-center" style={{ minWidth:"60px" }}>
                            <span className="font-black text-[11px] text-white">Pay<span className="text-[#009cde]">Pal</span></span>
                          </div>
                          {/* Bizum */}
                          <div className="h-8 px-3 rounded-lg flex items-center justify-center" style={{ background:"linear-gradient(135deg,#00b259,#009944)", minWidth:"52px" }}>
                            <span className="font-black text-[10px] text-white tracking-wide">Bizum</span>
                          </div>
                        </div>
                      </div>

                      {/* Security */}
                      <div className="space-y-2">
                        {[
                          { icon: <Lock className="h-3.5 w-3.5 text-green-400"/>, text: "Pago cifrado con TLS 1.3" },
                          { icon: <ShieldCheck className="h-3.5 w-3.5 text-blue-400"/>, text: "Verificación 3D Secure 2.0" },
                          { icon: <CreditCard className="h-3.5 w-3.5 text-yellow-400"/>, text: "Certificado PCI DSS Nivel 1" },
                          { icon: <AlertCircle className="h-3.5 w-3.5 text-primary"/>, text: "Datos no almacenados en nuestros servidores" },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center gap-2.5 font-mono text-[10px] text-muted-foreground">
                            {s.icon} {s.text}
                          </div>
                        ))}
                      </div>

                      {/* Pay button */}
                      <Button
                        onClick={() => {
                          if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
                          buyPack(pack.id);
                        }}
                        disabled={buyingPack || (payMethod === "card" && (cardNumber.replace(/\s/g,"").length < 16 || cardExpiry.length < 5 || cardCvv.length < 3 || !cardHolder.trim())) || (payMethod === "paypal" && !payEmail.trim()) || (payMethod === "bizum" && payPhone.length < 9)}
                        className="w-full font-mono font-black text-sm h-14 rounded-xl gap-2"
                        style={{ background: buyingPack ? undefined : "linear-gradient(135deg,#ff4db8,#9b55f9)", color: "#fff", border: "none" }}>
                        {buyingPack
                          ? <><RefreshCw className="h-4 w-4 animate-spin"/> PROCESANDO PAGO...</>
                          : <><Lock className="h-4 w-4"/> PAGAR €{(pack.eurCents / 100).toFixed(2)} · {total.toLocaleString()} SPC</>}
                      </Button>

                      <p className="font-mono text-[9px] text-muted-foreground text-center leading-relaxed">
                        Al pagar aceptas nuestros <span className="text-primary">Términos de Servicio</span>. Los SPC se acreditan instantáneamente. Sin devoluciones salvo error técnico.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ENVIAR SPC TAB */}
        {tab === "enviar" && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-mono font-bold text-xl text-primary mb-2">ENVIAR SPETTROCOIN</h2>
              <p className="text-muted-foreground text-sm font-mono">Transfiere SPC a otro usuario de la plataforma al instante.</p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-card/30 p-6 space-y-5 font-mono">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Tu saldo actual</span>
                <span className="text-primary font-bold">{wallet?.balance.toLocaleString() ?? 0} SPC</span>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1.5">Usuario destino</label>
                <input value={sendTo} onChange={e => setSendTo(e.target.value)}
                  placeholder="nombre_de_usuario"
                  className="w-full bg-[#050508] border border-primary/20 rounded-lg px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/60 transition-colors"/>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1.5">Cantidad SPC</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[10, 25, 50, 100, 250, 500].map(v => (
                    <button key={v} onClick={() => setSendAmount(v)}
                      className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${sendAmount === v ? "border-primary/60 bg-primary/15 text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      {v}
                    </button>
                  ))}
                </div>
                <input type="number" value={sendAmount} onChange={e => setSendAmount(parseInt(e.target.value) || 1)}
                  min={1} max={50000}
                  className="w-full bg-[#050508] border border-primary/20 rounded-lg px-4 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary/60 transition-colors"/>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1.5">Nota (opcional)</label>
                <input value={sendNote} onChange={e => setSendNote(e.target.value)}
                  placeholder="gg, gracias, propina..."
                  maxLength={80}
                  className="w-full bg-[#050508] border border-primary/20 rounded-lg px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/60 transition-colors"/>
              </div>

              <div className="p-3 rounded-lg border border-primary/10 bg-primary/5 text-[10px] text-muted-foreground space-y-1">
                <p>• Máximo <span className="text-primary">50,000 SPC</span> por transferencia</p>
                <p>• Las transferencias son instantáneas e irreversibles</p>
                <p>• El receptor ve tu username y la nota</p>
              </div>

              <Button onClick={sendCoins} disabled={sendingCoins || !sendTo.trim() || sendAmount < 1}
                className="w-full font-mono font-bold bg-primary text-background hover:bg-primary/90 h-11">
                {sendingCoins
                  ? <><RefreshCw className="h-4 w-4 animate-spin mr-2"/> ENVIANDO...</>
                  : <><Send className="h-4 w-4 mr-2"/> ENVIAR {sendAmount.toLocaleString()} SPC</>}
              </Button>
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {tab === "leaderboard" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="font-mono font-bold text-sm text-muted-foreground tracking-widest mb-6">TOP INVERSORES EN SPC</h2>
            {leaderboard.length === 0 ? (
              <div className="text-center py-16 font-mono text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20"/>
                <p>Aún no hay datos de ranking. ¡Sé el primero en ganar SPC!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, i) => (
                  <div key={entry.userId} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${i === 0 ? "border-yellow-500/40 bg-yellow-500/5" : i === 1 ? "border-gray-400/30 bg-gray-400/5" : i === 2 ? "border-orange-600/30 bg-orange-600/5" : "border-border/20 bg-[#0d0d14]"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-black text-sm ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-gray-400/20 text-gray-400" : i === 2 ? "bg-orange-600/20 text-orange-400" : "bg-border/20 text-muted-foreground"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-mono font-bold text-sm text-foreground">{entry.username}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{entry.rank}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-primary">{entry.totalEarned.toLocaleString()} SPC</div>
                      <div className="font-mono text-[10px] text-muted-foreground">≈ €{(entry.totalEarned / 1000).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EARN TAB */}
        {tab === "earn" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h2 className="font-mono font-bold text-sm text-muted-foreground tracking-widest mb-2">FORMAS DE GANAR SPETTROCOIN</h2>
              <p className="text-xs text-muted-foreground font-mono mb-6">Acumula SPC y canjéalos por dinero real. 1.000 SPC = €1,00.</p>
            </div>

            {EARN_WAYS.map((group) => (
              <div key={group.group}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[10px] text-primary tracking-[0.3em] font-bold">{group.group}</span>
                  <div className="flex-1 h-px bg-primary/15" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {group.items.map((w, i) => (
                    <div key={i} className="relative flex items-start gap-4 p-4 rounded-xl border border-border/20 bg-[#0d0d14] hover:border-primary/20 transition-all group">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: w.color + "15", color: w.color }}>
                        {w.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-bold text-foreground mb-0.5">{w.label}</div>
                        <div className="font-mono text-[10px] text-muted-foreground leading-relaxed">{w.desc}</div>
                        {(w as any).link && (
                          <Link href={(w as any).link}>
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-mono font-bold transition-colors" style={{ color: w.color }}>
                              IR AHORA <ArrowRight className="h-3 w-3" />
                            </span>
                          </Link>
                        )}
                      </div>
                      <div className="font-mono font-black text-xs text-right shrink-0" style={{ color: w.color }}>{w.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
              <Banknote className="h-10 w-10 mx-auto mb-3 text-green-400"/>
              <h3 className="font-mono font-bold text-lg text-green-400 mb-2">Convierte SPC en dinero real</h3>
              <p className="text-sm text-muted-foreground mb-5 font-mono">Retira tus ganancias vía PayPal, Bizum o transferencia bancaria.<br/>Mínimo 5.000 SPC (€5) · Pago en 24–72 horas.</p>
              <Button onClick={() => setTab("retirar")}
                className="font-mono font-bold gap-2 bg-green-500 hover:bg-green-600 text-black">
                <Banknote className="h-4 w-4" /> SOLICITAR RETIRO
              </Button>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
              <Coins className="h-10 w-10 mx-auto mb-3 text-primary"/>
              <h3 className="font-mono font-bold text-lg text-primary mb-2">¿Listo para ganar?</h3>
              <p className="text-sm text-muted-foreground mb-5">Suscríbete al plan ELITE y obtén 3x multiplicador en todas tus recompensas SPC.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/marketplace"><Button className="font-mono font-bold gap-2" style={{ background: "rgba(255,77,184,0.2)", border: "1px solid rgba(255,77,184,0.4)", color: "#ff4db8" }}><Package className="h-4 w-4"/>MARKETPLACE</Button></Link>
                <Link href="/tutorias"><Button className="font-mono font-bold gap-2" style={{ background: "rgba(155,85,249,0.2)", border: "1px solid rgba(155,85,249,0.4)", color: "#9b55f9" }}><Video className="h-4 w-4"/>TUTORÍAS</Button></Link>
                <Link href="/escuadras"><Button variant="outline" className="border-red-500/40 text-red-400 font-mono font-bold">ENTRAR AL COMBATE</Button></Link>
              </div>
            </div>
          </div>
        )}

        {/* RETIRAR TAB */}
        {tab === "retirar" && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <Banknote className="h-12 w-12 mx-auto mb-3 text-green-400"/>
              <h2 className="font-mono font-bold text-xl text-green-400 mb-2">RETIRAR DINERO REAL</h2>
              <p className="text-muted-foreground text-sm font-mono">Convierte tus SPC ganados en euros. 1.000 SPC = €1,00.</p>
              <p className="text-muted-foreground text-xs font-mono mt-1">Mínimo: 5.000 SPC (€5) · Comisión: 0% · Pago en 24–72h</p>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-card/30 p-6 space-y-5 font-mono mb-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tu saldo disponible</span>
                <span className="text-green-400 font-bold">{wallet?.balance.toLocaleString() ?? 0} SPC ≈ €{((wallet?.balance ?? 0) / 1000).toFixed(2)}</span>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1.5">Cantidad a retirar (SPC)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[5000, 10000, 25000, 50000].map(v => (
                    <button key={v} onClick={() => setPayoutAmount(v)}
                      className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${payoutAmount === v ? "border-green-500/60 bg-green-500/15 text-green-400 font-bold" : "border-border text-muted-foreground hover:border-green-500/30"}`}>
                      {v.toLocaleString()} SPC<br/><span className="text-[10px] opacity-70">€{(v/1000).toFixed(0)}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" value={payoutAmount} onChange={e => setPayoutAmount(parseInt(e.target.value) || 5000)}
                    min={5000} step={1000}
                    className="flex-1 bg-[#050508] border border-green-500/20 rounded-lg px-4 py-2.5 text-sm font-mono text-foreground outline-none focus:border-green-500/60 transition-colors"/>
                  <div className="text-right text-sm">
                    <div className="text-green-400 font-bold">€{(payoutAmount / 1000).toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">EUR</div>
                  </div>
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1.5">Método de pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["paypal", "bizum", "bank"] as const).map(m => (
                    <button key={m} onClick={() => setPayoutMethod(m)}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all ${payoutMethod === m ? "border-green-500/60 bg-green-500/15 text-green-400" : "border-border text-muted-foreground hover:border-green-500/30"}`}>
                      {m === "paypal" ? "PayPal" : m === "bizum" ? "Bizum" : "Banco"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1.5">
                  {payoutMethod === "paypal" ? "Email de PayPal" : payoutMethod === "bizum" ? "Número de teléfono" : "IBAN bancario"}
                </label>
                <input value={payoutDestination} onChange={e => setPayoutDestination(e.target.value)}
                  placeholder={payoutMethod === "paypal" ? "tu@email.com" : payoutMethod === "bizum" ? "+34 600 000 000" : "ES00 0000 0000 0000 0000 0000"}
                  className="w-full bg-[#050508] border border-green-500/20 rounded-lg px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-green-500/60 transition-colors"/>
              </div>

              <div className="p-3 rounded-lg border border-green-500/10 bg-green-500/5 text-[10px] text-muted-foreground space-y-1">
                <p>• Los SPC se reservan inmediatamente al solicitar</p>
                <p>• El equipo procesa pagos en 24–72 horas laborables</p>
                <p>• Si se rechaza, los SPC se devuelven automáticamente</p>
                <p>• Mínimo de retiro: <span className="text-green-400">5.000 SPC (€5)</span></p>
              </div>

              <Button onClick={requestPayout} disabled={requestingPayout || payoutAmount < 5000 || !payoutDestination.trim()}
                className="w-full font-mono font-bold h-11 bg-green-500 hover:bg-green-600 text-black gap-2">
                {requestingPayout
                  ? <><RefreshCw className="h-4 w-4 animate-spin"/> PROCESANDO...</>
                  : <><Banknote className="h-4 w-4"/> SOLICITAR RETIRO DE €{(payoutAmount / 1000).toFixed(2)}</>}
              </Button>
            </div>

            {/* Payout history */}
            {myPayouts.length > 0 && (
              <div>
                <h3 className="font-mono font-bold text-xs text-muted-foreground tracking-widest mb-3">HISTORIAL DE RETIROS</h3>
                <div className="space-y-2">
                  {myPayouts.map(p => {
                    const statusColors: Record<string, string> = { pendiente: "#f59e0b", aprobado: "#9b55f9", pagado: "#34d399", rechazado: "#ef4444" };
                    return (
                      <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#0d0d14] border border-border/20 font-mono text-xs">
                        <div className="flex-1">
                          <div className="font-bold text-foreground">{p.amountSpc.toLocaleString()} SPC → <span className="text-green-400">€{p.amountEur.toFixed(2)}</span></div>
                          <div className="text-muted-foreground text-[10px]">{p.method.toUpperCase()} · {new Date(p.createdAt).toLocaleDateString("es-ES")}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ background: `${statusColors[p.status] || "#9ca3af"}22`, color: statusColors[p.status] || "#9ca3af", border: `1px solid ${statusColors[p.status] || "#9ca3af"}44` }}>
                          {p.status.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
