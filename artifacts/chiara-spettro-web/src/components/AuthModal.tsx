import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, Eye, EyeOff, Zap, Shield, User, CreditCard, Lock, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const AVATAR_TYPES = ["ghost", "skull", "robot", "demon", "spider", "dragon", "ninja", "phantom", "cyber", "eye"];
const avatarEmoji: Record<string, string> = {
  ghost: "👻", skull: "💀", robot: "🤖", demon: "😈", spider: "🕷️",
  dragon: "🐉", ninja: "🥷", phantom: "🌑", cyber: "⚡", eye: "👁️",
};

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 4);
  return n.length > 2 ? n.slice(0, 2) + "/" + n.slice(2) : n;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, initialTab = "register" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [step, setStep] = useState<"account" | "payment">("account");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{ id: number; username: string } | null>(null);
  const { login, register, user } = useAuth();
  const { toast } = useToast();

  // Register fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarType, setAvatarType] = useState("ghost");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Payment fields
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const handleClose = () => {
    setStep("account");
    setUsername(""); setEmail(""); setPassword(""); setAvatarType("ghost");
    setCardHolder(""); setCardNumber(""); setExpiry(""); setCvv("");
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast({ title: "Contraseña muy corta", description: "Mínimo 6 caracteres", variant: "destructive" }); return; }
    setLoading(true);
    try {
      await register(username, email, password, avatarType);
      // Move to payment step after successful registration
      setRegisteredUser({ id: 0, username });
      setStep("payment");
    } catch (err: any) {
      toast({ title: "Error al registrarse", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast({ title: "Sesión iniciada", description: "Bienvenido de vuelta al laboratorio." });
      handleClose();
    } catch (err: any) {
      toast({ title: "Error al iniciar sesión", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = cardNumber.replace(/\s/g, "");
    if (raw.length < 13) { toast({ title: "Número de tarjeta inválido", variant: "destructive" }); return; }
    if (expiry.length < 5) { toast({ title: "Fecha de expiración inválida", variant: "destructive" }); return; }
    if (cvv.length < 3) { toast({ title: "CVV inválido", variant: "destructive" }); return; }
    setPayLoading(true);
    try {
      const authUser = user;
      if (authUser) {
        await fetch(`${import.meta.env.BASE_URL}api/auth/payment`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: authUser.id,
            cardLast4: raw.slice(-4),
            cardBrand: raw.startsWith("4") ? "Visa" : raw.startsWith("5") ? "Mastercard" : "Tarjeta",
            cardHolder,
            expiry,
          }),
        });
      }
      toast({ title: "¡Cuenta lista!", description: `Bienvenido, ${registeredUser?.username}. Tu método de pago está guardado.` });
      handleClose();
    } catch {
      toast({ title: "Error al guardar tarjeta", variant: "destructive" });
    } finally {
      setPayLoading(false);
    }
  };

  const skipPayment = () => {
    toast({ title: `¡Bienvenido, ${registeredUser?.username}!`, description: "Puedes añadir un método de pago desde tu perfil." });
    handleClose();
  };

  const cardLast4 = cardNumber.replace(/\s/g, "").slice(-4) || "····";
  const cardDisplay = cardNumber || "•••• •••• •••• ••••";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100]" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-[#07070f] border border-primary/30 shadow-[0_0_60px_rgba(255,77,184,0.15)] rounded-lg overflow-hidden max-h-[90dvh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/60 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm font-bold text-primary tracking-widest">
                    {step === "payment" ? "MÉTODO_DE_PAGO.exe" : "SPETTRO_AUTH.exe"}
                  </span>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs — only when on account step */}
              {step === "account" && (
                <div className="flex border-b border-border flex-shrink-0">
                  {(["register", "login"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 py-3 font-mono text-sm font-bold uppercase transition-colors ${tab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-primary"}`}>
                      {t === "register" ? "Registrarse" : "Iniciar Sesión"}
                    </button>
                  ))}
                </div>
              )}

              {/* Step indicator for payment */}
              {step === "payment" && (
                <div className="flex items-center gap-3 px-6 py-3 border-b border-border flex-shrink-0 bg-primary/5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    <span className="font-mono text-[11px] text-primary">Cuenta</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <CreditCard className="h-3 w-3 text-black" />
                    </div>
                    <span className="font-mono text-[11px] text-primary font-bold">Pago</span>
                  </div>
                </div>
              )}

              <div className="p-6 overflow-y-auto">
                {/* ── REGISTER ── */}
                {step === "account" && tab === "register" && (
                  <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground mb-2">ELIGE TU AVATAR</p>
                      <div className="grid grid-cols-5 gap-2">
                        {AVATAR_TYPES.map(type => (
                          <button key={type} type="button" onClick={() => setAvatarType(type)}
                            className={`p-2 rounded text-xl transition-all border ${avatarType === type ? "border-primary bg-primary/10 shadow-[0_0_10px_rgba(255,77,184,0.3)]" : "border-border bg-black/30 hover:border-primary/50"}`}>
                            {avatarEmoji[type]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Nombre de hacker (alias)" value={username} onChange={e => setUsername(e.target.value)}
                          className="pl-9 font-mono bg-black/50 border-primary/20 focus:border-primary" required />
                      </div>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                          className="pl-9 font-mono bg-black/50 border-primary/20 focus:border-primary" required />
                      </div>
                      <div className="relative">
                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type={showPass ? "text" : "password"} placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)}
                          className="pl-9 pr-10 font-mono bg-black/50 border-primary/20 focus:border-primary" required />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 font-mono font-bold bg-primary text-black hover:brightness-110 shadow-[0_0_15px_rgba(255,77,184,0.3)]">
                      {loading ? "CREANDO CUENTA..." : "CREAR CUENTA →"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground font-mono">
                      ¿Ya tienes cuenta?{" "}
                      <button type="button" onClick={() => setTab("login")} className="text-primary hover:underline">Inicia sesión</button>
                    </p>
                  </form>
                )}

                {/* ── LOGIN ── */}
                {step === "account" && tab === "login" && (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                          className="pl-9 font-mono bg-black/50 border-primary/20 focus:border-primary" required />
                      </div>
                      <div className="relative">
                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type={showPass ? "text" : "password"} placeholder="Contraseña" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                          className="pl-9 pr-10 font-mono bg-black/50 border-primary/20 focus:border-primary" required />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 font-mono font-bold bg-primary text-black hover:brightness-110 shadow-[0_0_15px_rgba(255,77,184,0.3)]">
                      {loading ? "VERIFICANDO..." : "ACCEDER AL LAB"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground font-mono">
                      ¿Sin cuenta?{" "}
                      <button type="button" onClick={() => setTab("register")} className="text-primary hover:underline">Regístrate gratis</button>
                    </p>
                  </form>
                )}

                {/* ── PAYMENT STEP ── */}
                {step === "payment" && (
                  <div className="flex flex-col gap-5">
                    <div className="text-center">
                      <p className="font-mono text-sm text-muted-foreground">
                        Añade un método de pago para comprar cursos. <span className="text-primary">No se realizará ningún cargo ahora.</span>
                      </p>
                    </div>

                    {/* Card preview */}
                    <div className="relative h-40 rounded-xl overflow-hidden p-5 flex flex-col justify-between"
                      style={{ background: "linear-gradient(135deg, #0a0a1f 0%, #0d1a2e 50%, #060612 100%)", border: "1px solid rgba(255,77,184,0.2)", boxShadow: "0 0 30px rgba(255,77,184,0.1)" }}>
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #ff4db8, transparent)", transform: "translate(20%, -20%)" }} />
                      <div className="flex justify-between items-start">
                        <div className="font-mono text-xs text-primary/60 font-bold">SPETTROWEB PAY</div>
                        <CreditCard className="h-6 w-6 text-primary/40" />
                      </div>
                      <div>
                        <p className="font-mono text-lg tracking-[0.2em] text-white/80 mb-2">{cardDisplay}</p>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="font-mono text-[10px] text-muted-foreground/60 mb-0.5">TITULAR</p>
                            <p className="font-mono text-xs text-white/70 uppercase">{cardHolder || "TU NOMBRE"}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-[10px] text-muted-foreground/60 mb-0.5">EXPIRA</p>
                            <p className="font-mono text-xs text-white/70">{expiry || "MM/AA"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card form */}
                    <form onSubmit={handleSavePayment} className="flex flex-col gap-3">
                      <div>
                        <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">NOMBRE DEL TITULAR</label>
                        <Input value={cardHolder} onChange={e => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="COMO APARECE EN LA TARJETA" className="font-mono bg-black/50 border-primary/20 focus:border-primary text-sm" required />
                      </div>
                      <div>
                        <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">NÚMERO DE TARJETA</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input value={cardNumber} onChange={e => setCardNumber(formatCard(e.target.value))}
                            placeholder="•••• •••• •••• ••••" maxLength={19}
                            className="pl-9 font-mono bg-black/50 border-primary/20 focus:border-primary text-sm tracking-widest" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">FECHA EXPIRACIÓN</label>
                          <Input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/AA" maxLength={5}
                            className="font-mono bg-black/50 border-primary/20 focus:border-primary text-sm" required />
                        </div>
                        <div>
                          <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">CVV</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              placeholder="•••" maxLength={4} type="password"
                              className="pl-9 font-mono bg-black/50 border-primary/20 focus:border-primary text-sm" required />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-primary/5 border border-primary/20 rounded p-2.5 mt-1">
                        <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                        Tus datos están cifrados. No se realizará ningún cargo hasta que compres un curso.
                      </div>

                      <Button type="submit" disabled={payLoading} className="w-full h-11 font-mono font-bold bg-primary text-black hover:brightness-110 shadow-[0_0_15px_rgba(255,77,184,0.3)]">
                        {payLoading ? "GUARDANDO..." : "GUARDAR MÉTODO DE PAGO"}
                      </Button>
                      <button type="button" onClick={skipPayment} className="text-center text-xs text-muted-foreground font-mono hover:text-primary transition-colors">
                        Saltar por ahora → puedo añadirlo después
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Footer badges */}
              {step === "account" && (
                <div className="px-6 pb-4 flex gap-2 justify-center flex-wrap flex-shrink-0">
                  <Badge variant="outline" className="font-mono text-[10px] text-primary/60 border-primary/20">GRATIS</Badge>
                  <Badge variant="outline" className="font-mono text-[10px] text-primary/60 border-primary/20">100 MÁQUINAS</Badge>
                  <Badge variant="outline" className="font-mono text-[10px] text-primary/60 border-primary/20">CHAT EN VIVO</Badge>
                  <Badge variant="outline" className="font-mono text-[10px] text-primary/60 border-primary/20">TORNEOS</Badge>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
