import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Terminal, Check, X, Zap, Shield, Star, Crown, ChevronDown, ChevronUp,
  Copy, ExternalLink, CreditCard, Bitcoin, ArrowRight, Lock, Unlock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const BASE = import.meta.env.BASE_URL;

// ─── Plan definitions ─────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "rookie",
    name: "ROOKIE",
    icon: Shield,
    tagline: "Empieza tu camino",
    priceMonthly: 0,
    priceAnnual: 0,
    badge: null,
    color: "#9ca3af",
    glow: "rgba(156,163,175,0.15)",
    border: "border-gray-600/30",
    features: [
      { text: "10 máquinas de nivel Fácil", included: true },
      { text: "Foro de la comunidad", included: true },
      { text: "Perfil público hacker", included: true },
      { text: "Laboratorio completo (185 máquinas)", included: false },
      { text: "Certificaciones oficiales", included: false },
      { text: "Torneos mensuales", included: false },
      { text: "Soporte prioritario", included: false },
      { text: "Badge de rango exclusivo", included: false },
    ],
    cta: "EMPEZAR GRATIS",
    ctaStyle: "border border-gray-600/50 text-gray-400 hover:bg-gray-600/10",
    free: true,
  },
  {
    id: "hacker",
    name: "HACKER",
    icon: Zap,
    tagline: "Acceso completo al laboratorio",
    priceMonthly: 9.99,
    priceAnnual: 7.99,
    badge: "MÁS POPULAR",
    color: "#ff4db8",
    glow: "rgba(255,77,184,0.12)",
    border: "border-primary/40",
    features: [
      { text: "185 máquinas (Fácil → Insano)", included: true },
      { text: "Foro de la comunidad", included: true },
      { text: "Perfil público hacker", included: true },
      { text: "Laboratorio completo (185 máquinas)", included: true },
      { text: "Certificaciones oficiales", included: true },
      { text: "Torneos mensuales", included: true },
      { text: "Soporte prioritario", included: false },
      { text: "Badge de rango exclusivo", included: false },
    ],
    cta: "SUSCRIBIRSE",
    ctaStyle: "bg-primary text-black font-bold hover:brightness-110 shadow-[0_0_20px_rgba(255,77,184,0.3)]",
    free: false,
  },
  {
    id: "elite",
    name: "ELITE",
    icon: Crown,
    tagline: "Para los que van en serio",
    priceMonthly: 14.99,
    priceAnnual: 11.99,
    badge: "MEJOR VALOR",
    color: "#9b55f9",
    glow: "rgba(155,85,249,0.12)",
    border: "border-secondary/40",
    features: [
      { text: "185 máquinas (Fácil → Insano)", included: true },
      { text: "Foro de la comunidad", included: true },
      { text: "Perfil público hacker", included: true },
      { text: "Laboratorio completo (185 máquinas)", included: true },
      { text: "Certificaciones oficiales", included: true },
      { text: "Torneos mensuales + acceso anticipado", included: true },
      { text: "Soporte prioritario 24/7", included: true },
      { text: "Badge Elite exclusivo + Discord VIP", included: true },
    ],
    cta: "SUSCRIBIRSE ELITE",
    ctaStyle: "bg-secondary text-black font-bold hover:brightness-110 shadow-[0_0_20px_rgba(155,85,249,0.3)]",
    free: false,
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "¿Puedo cancelar en cualquier momento?", a: "Sí. Puedes cancelar tu suscripción en cualquier momento desde tu perfil. No hay penalizaciones ni compromisos de permanencia." },
  { q: "¿Qué métodos de pago aceptáis?", a: "Aceptamos transferencia bancaria (IBAN), criptomonedas (USDT/BTC vía Binance) y PayPal. Próximamente tarjeta de crédito/débito." },
  { q: "¿Las certificaciones tienen validez oficial?", a: "Nuestras certificaciones son reconocidas en la comunidad hispanohablante de ciberseguridad y sirven como aval de competencias técnicas demostrables en CTF y entornos reales." },
  { q: "¿Hay descuento para estudiantes?", a: "Sí. Escríbenos a contacto@spettroweb.com con tu documento de matrícula y te damos un 30% de descuento en cualquier plan." },
  { q: "¿Qué pasa si el pago está pendiente de verificación?", a: "Tras realizar el pago, envíanos el comprobante por correo o introduce la referencia en el formulario. En menos de 24h activamos tu cuenta." },
];

// ─── Payment methods ──────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: "transferencia",
    label: "Transferencia bancaria",
    icon: CreditCard,
    color: "#ff4db8",
    details: {
      banco: "Banco Santander",
      titular: "SpettroWeb S.L.",
      iban: "ES91 2100 0418 4502 0005 1332",
      concepto: "Suscripción {plan} — {email}",
    },
  },
  {
    id: "crypto",
    label: "Crypto (USDT / BTC)",
    icon: Bitcoin,
    color: "#f59e0b",
    details: {
      red: "USDT (TRC-20 / BEP-20)",
      wallet: "TNx4Qa7v2kFnMVVDo7JRsQhZ3bGYj8fKpQ",
      nota: "Envía el equivalente en USDT. Incluye tu email en el memo.",
    },
  },
  {
    id: "paypal",
    label: "PayPal",
    icon: ExternalLink,
    color: "#3b82f6",
    details: {
      link: "https://paypal.me/spettroweb",
      nota: "Selecciona 'Pagar por bienes/servicios'. Añade tu email en el asunto.",
    },
  },
];

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, billing, onSelect }: { plan: typeof PLANS[0]; billing: "monthly" | "annual"; onSelect: () => void }) {
  const price = billing === "annual" ? plan.priceAnnual : plan.priceMonthly;
  const Icon = plan.icon;
  const isPopular = plan.id === "hacker";
  const isElite = plan.id === "elite";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: PLANS.indexOf(plan) * 0.1 }}
      whileHover={{ y: -6 }}
      className={`relative rounded-2xl border ${plan.border} bg-[#060610] flex flex-col overflow-hidden`}
      style={{ boxShadow: isPopular ? `0 0 40px rgba(255,77,184,0.1), 0 0 80px rgba(255,77,184,0.04)` : isElite ? `0 0 40px rgba(155,85,249,0.08)` : "none" }}
    >
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${plan.color}60, transparent)` }} />

      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <span className="font-mono text-[10px] font-bold px-3 py-0.5 rounded-b-lg"
            style={{ background: plan.color, color: "#000" }}>
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1 mt-2">
        {/* Plan header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{ borderColor: `${plan.color}40`, background: `${plan.color}10` }}>
            <Icon className="h-5 w-5" style={{ color: plan.color }} />
          </div>
          <div>
            <h3 className="font-mono font-bold text-white text-sm tracking-widest">{plan.name}</h3>
            <p className="font-mono text-[10px] text-muted-foreground">{plan.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          {plan.free ? (
            <div className="flex items-end gap-1">
              <span className="font-mono font-bold text-4xl text-white">GRATIS</span>
            </div>
          ) : (
            <div className="flex items-end gap-1">
              <span className="font-mono text-muted-foreground text-lg">€</span>
              <span className="font-mono font-bold text-4xl text-white">{price.toFixed(2).replace(".", ",")}</span>
              <span className="font-mono text-muted-foreground text-sm mb-1">/mes</span>
            </div>
          )}
          {!plan.free && billing === "annual" && (
            <p className="font-mono text-[10px] text-green-400 mt-1">
              Facturado anualmente — ahorras {((plan.priceMonthly - plan.priceAnnual) * 12).toFixed(2).replace(".", ",")}€/año
            </p>
          )}
          {!plan.free && billing === "monthly" && (
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              O {plan.priceAnnual.toFixed(2).replace(".", ",")}€/mes con facturación anual
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5 font-mono text-xs">
              {f.included ? (
                <Check className="h-3.5 w-3.5 shrink-0" style={{ color: plan.color }} />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
              )}
              <span className={f.included ? "text-foreground/80" : "text-muted-foreground/40 line-through"}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={plan.free ? undefined : onSelect}
          className={`w-full py-3 rounded-xl font-mono text-sm transition-all flex items-center justify-center gap-2 ${plan.ctaStyle}`}
        >
          {plan.free ? (
            <><Lock className="h-4 w-4" /> {plan.cta}</>
          ) : (
            <>{plan.cta} <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({
  plan,
  billing,
  onClose,
}: {
  plan: typeof PLANS[0];
  billing: "monthly" | "annual";
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"method" | "details" | "confirm">("method");
  const [method, setMethod] = useState<typeof PAYMENT_METHODS[0] | null>(null);
  const [form, setForm] = useState({ name: user?.username || "", email: user?.email || "", reference: "" });
  const [sending, setSending] = useState(false);
  const price = billing === "annual" ? plan.priceAnnual : plan.priceMonthly;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado al portapapeles" });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Faltan datos", description: "Nombre y email son obligatorios.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${BASE}api/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          plan: plan.id,
          method: method?.id || "transferencia",
          reference: form.reference.trim() || "pendiente",
          amount: price,
          billing,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al procesar");
      }
      setStep("confirm");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const selectedMethod = method || PAYMENT_METHODS[0];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="w-full max-w-lg bg-[#06060f] border rounded-2xl overflow-hidden"
        style={{ borderColor: `${plan.color}40`, boxShadow: `0 0 60px ${plan.color}15` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${plan.color}20`, borderColor: `${plan.color}40` }}>
              <plan.icon className="h-4 w-4" style={{ color: plan.color }} />
            </div>
            <div>
              <h2 className="font-mono font-bold text-sm" style={{ color: plan.color }}>
                PLAN {plan.name} — €{price.toFixed(2).replace(".", ",")}/mes
              </h2>
              <p className="font-mono text-[10px] text-muted-foreground">
                {billing === "annual" ? "Facturación anual" : "Facturación mensual"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors p-1 rounded hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-white/5">
          {[["method", "1. Método"], ["details", "2. Datos"], ["confirm", "3. Listo"]].map(([s, label]) => (
            <div key={s} className={`flex-1 py-2.5 text-center font-mono text-[10px] transition-colors ${step === s ? "text-white border-b-2" : "text-muted-foreground/50"}`}
              style={step === s ? { borderColor: plan.color } : {}}>
              {label}
            </div>
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Method ── */}
            {step === "method" && (
              <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="font-mono text-sm text-muted-foreground mb-4">Elige cómo quieres pagar:</p>
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMethod(m); setStep("details"); }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/8 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${m.color}15`, border: `1px solid ${m.color}30` }}>
                      <m.icon className="h-5 w-5" style={{ color: m.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-mono text-sm text-white group-hover:text-white/90">{m.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
                  </button>
                ))}
              </motion.div>
            )}

            {/* ── STEP 2: Details ── */}
            {step === "details" && method && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">

                {/* Payment instructions */}
                <div className="rounded-xl border border-white/8 bg-black/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <method.icon className="h-4 w-4" style={{ color: method.color }} />
                    <span className="font-mono text-xs font-bold" style={{ color: method.color }}>INSTRUCCIONES DE PAGO</span>
                  </div>

                  {method.id === "transferencia" && (
                    <>
                      {[
                        ["Banco", method.details.banco],
                        ["Titular", method.details.titular],
                        ["IBAN", method.details.iban],
                        ["Concepto", `Suscripción ${plan.name} — ${form.email || "tu@email.com"}`],
                        ["Importe", `€${price.toFixed(2)}`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3">
                          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">{label}</span>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs text-white truncate">{value}</span>
                            {label === "IBAN" && (
                              <button onClick={() => copy(value as string)} className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {method.id === "crypto" && (
                    <>
                      {[
                        ["Red", method.details.red],
                        ["Wallet", method.details.wallet],
                        ["Importe", `≈ $${price.toFixed(2)} USDT`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3">
                          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">{label}</span>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs text-white truncate">{value}</span>
                            {label === "Wallet" && (
                              <button onClick={() => copy(value as string)} className="shrink-0 text-muted-foreground hover:text-amber-400 transition-colors">
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <p className="font-mono text-[10px] text-muted-foreground pt-1 border-t border-white/5">{method.details.nota}</p>
                    </>
                  )}

                  {method.id === "paypal" && (
                    <>
                      <a href={method.details.link as string} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                        {method.details.link}
                      </a>
                      <p className="font-mono text-[10px] text-muted-foreground pt-1 border-t border-white/5">{method.details.nota}</p>
                    </>
                  )}
                </div>

                {/* Form */}
                <div className="space-y-3">
                  <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Tus datos</p>
                  {[
                    { key: "name", placeholder: "Nombre completo o alias", label: "Nombre *" },
                    { key: "email", placeholder: "tu@email.com", label: "Email *" },
                    { key: "reference", placeholder: "ID transacción / hash / número de referencia", label: "Referencia del pago (opcional)" },
                  ].map(({ key, placeholder, label }) => (
                    <div key={key} className="space-y-1">
                      <label className="font-mono text-[10px] text-muted-foreground/60">{label}</label>
                      <input
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 font-mono text-sm text-white placeholder-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setStep("method")}
                    className="px-4 py-2.5 rounded-lg border border-white/10 font-mono text-xs text-muted-foreground hover:bg-white/5 transition-colors">
                    ← ATRÁS
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={sending}
                    className="flex-1 py-2.5 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{ background: plan.color, color: "#000" }}
                  >
                    {sending ? <span className="animate-spin">◈</span> : <><Lock className="h-4 w-4" /> CONFIRMAR SUSCRIPCIÓN</>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Confirm ── */}
            {step === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center gap-5 py-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: `${plan.color}15`, border: `2px solid ${plan.color}40`, boxShadow: `0 0 30px ${plan.color}20` }}>
                  <Check className="h-10 w-10" style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-white text-xl mb-2">¡Solicitud enviada!</h3>
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                    Hemos registrado tu solicitud de suscripción al plan <span style={{ color: plan.color }}>{plan.name}</span>.
                    <br /><br />
                    En menos de <strong className="text-white">24 horas</strong> verificamos tu pago y activamos tu cuenta. Recibirás un email de confirmación en <strong className="text-white">{form.email}</strong>.
                  </p>
                </div>
                <div className="w-full p-4 rounded-xl border border-white/8 bg-white/[0.02] font-mono text-xs text-muted-foreground space-y-1 text-left">
                  <p><span className="text-primary">plan:</span> {plan.name}</p>
                  <p><span className="text-primary">importe:</span> €{price.toFixed(2)}/mes</p>
                  <p><span className="text-primary">método:</span> {selectedMethod.label}</p>
                  <p><span className="text-primary">email:</span> {form.email}</p>
                </div>
                <button onClick={onClose}
                  className="w-full py-3 rounded-xl font-mono text-sm font-bold transition-all"
                  style={{ background: plan.color, color: "#000" }}>
                  ENTENDIDO
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="border border-white/8 rounded-xl overflow-hidden"
    >
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 font-mono text-sm text-left hover:bg-white/[0.02] transition-colors">
        <span className="text-white/85 pr-4">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-primary shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-4 font-mono text-xs text-muted-foreground leading-relaxed border-t border-white/5 pt-3">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Suscripcion() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);

  return (
    <div className="min-h-[100dvh] bg-background font-sans pb-24">
      {/* Breadcrumb */}
      <nav className="px-4 py-3 border-b border-white/5">
        <div className="container mx-auto max-w-6xl flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Terminal className="h-3 w-3 text-primary" />
          <Link href="/" className="hover:text-primary transition-colors">inicio</Link>
          <span>/</span>
          <span>suscripción</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 max-w-6xl">

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 space-y-4">
          <div className="inline-flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 mb-2">
            <Zap className="h-3 w-3" /> PLANES DE SUSCRIPCIÓN
          </div>
          <h1 className="text-4xl md:text-6xl font-mono font-bold text-white drop-shadow-[0_0_20px_rgba(255,77,184,0.3)]">
            Elige tu <span className="text-primary">nivel</span>
          </h1>
          <p className="text-muted-foreground font-mono text-base md:text-lg max-w-xl mx-auto">
            Accede al laboratorio de hacking más completo en español. Sin trampa, sin cartón.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`font-mono text-sm transition-colors ${billing === "monthly" ? "text-white" : "text-muted-foreground"}`}>Mensual</span>
            <button
              onClick={() => setBilling(b => b === "monthly" ? "annual" : "monthly")}
              className="relative w-12 h-6 rounded-full border border-primary/30 bg-black/50 transition-colors"
              style={{ background: billing === "annual" ? "rgba(255,77,184,0.15)" : undefined }}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-primary"
                animate={{ left: billing === "annual" ? "calc(100% - 22px)" : "2px" }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              />
            </button>
            <span className={`font-mono text-sm transition-colors ${billing === "annual" ? "text-white" : "text-muted-foreground"}`}>
              Anual
            </span>
            {billing === "annual" && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                -20% dto.
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* ── Plan cards ── */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              onSelect={() => setSelectedPlan(plan)}
            />
          ))}
        </div>

        {/* ── Features comparison strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mb-16 rounded-2xl border border-white/8 bg-[#060610] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <h2 className="font-mono font-bold text-sm text-primary tracking-widest">COMPARATIVA COMPLETA</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-muted-foreground font-normal w-1/2">Característica</th>
                  {PLANS.map(p => (
                    <th key={p.id} className="px-4 py-3 text-center font-bold" style={{ color: p.color }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Máquinas disponibles", "10 básicas", "185 completas", "185 + anticipadas"],
                  ["Dificultades", "Solo Fácil", "Todas", "Todas"],
                  ["Writeups / Walkthroughs", "❌", "✅", "✅"],
                  ["Certificaciones", "❌", "✅", "✅"],
                  ["Torneos", "Solo espectador", "✅", "✅ + anticipado"],
                  ["Soporte", "Foro", "Foro + Email", "24/7 Prioritario"],
                  ["Discord VIP", "❌", "❌", "✅"],
                  ["Badge exclusivo de rango", "❌", "❌", "✅ Elite"],
                ].map(([feature, ...values], i) => (
                  <tr key={i} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                    <td className="px-6 py-3 text-foreground/70">{feature}</td>
                    {values.map((v, j) => (
                      <td key={j} className="px-4 py-3 text-center text-white/70">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── Trust badges ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {[
            { icon: Lock, label: "Pago seguro", sub: "Tus datos protegidos" },
            { icon: Unlock, label: "Sin permanencia", sub: "Cancela cuando quieras" },
            { icon: Zap, label: "Activación rápida", sub: "En menos de 24h" },
            { icon: Shield, label: "Comunidad activa", sub: "+1.200 hackers" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <Icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-mono text-xs font-bold text-white">{label}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── FAQ ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <h2 className="font-mono font-bold text-primary mb-6 flex items-center gap-2">
            <span className="text-secondary">&gt;</span> PREGUNTAS_FRECUENTES
          </h2>
          <div className="space-y-2 max-w-2xl mx-auto">
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} index={i} />)}
          </div>
        </motion.div>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="mt-16 text-center p-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden"
          style={{ boxShadow: "0 0 60px rgba(255,77,184,0.05)" }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{
            backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.6) 2px,rgba(255,255,255,0.6) 3px)",
          }} />
          <div className="relative z-10 space-y-4">
            <h2 className="font-mono font-bold text-2xl md:text-3xl text-white">
              ¿Listo para <span className="text-primary">hackear</span>?
            </h2>
            <p className="font-mono text-sm text-muted-foreground">Empieza hoy con el plan Hacker y accede a las 185 máquinas del laboratorio.</p>
            <button
              onClick={() => setSelectedPlan(PLANS[1])}
              className="inline-flex items-center gap-2 font-mono font-bold text-sm px-8 py-3.5 rounded-xl bg-primary text-black hover:brightness-110 transition-all shadow-[0_0_30px_rgba(255,77,184,0.3)]"
            >
              SUSCRIBIRSE AHORA <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Payment Modal ── */}
      <AnimatePresence>
        {selectedPlan && (
          <PaymentModal
            plan={selectedPlan}
            billing={billing}
            onClose={() => setSelectedPlan(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
