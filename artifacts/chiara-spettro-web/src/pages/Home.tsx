import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "@/components/Terminal";
import { Button } from "@/components/ui/button";
import { Shield, Terminal as TerminalIcon, Code2, Zap, Server, Lock, Target, Award, ArrowRight, ChevronDown, TerminalSquare, Cpu, Skull, Lock as LockIcon, ShoppingBag, Sparkles, BookOpen, Wrench, FileText, Coins, Unlock, Wifi, WifiOff, Copy, Play, X, Download, ExternalLink } from "lucide-react";
import { PublicNav } from "@/components/PublicNav";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";

const BASE = import.meta.env.BASE_URL;

const DIFF_MAP: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
  facil:   { label: "FÁCIL",   color: "text-emerald-400", bg: "bg-emerald-400/10",  border: "border-emerald-400/40", glow: "rgba(52,211,153,0.3)"  },
  medio:   { label: "MEDIO",   color: "text-amber-400",   bg: "bg-amber-400/10",    border: "border-amber-400/40",   glow: "rgba(251,191,36,0.3)"  },
  dificil: { label: "DIFÍCIL", color: "text-fuchsia-500", bg: "bg-fuchsia-500/10",  border: "border-fuchsia-500/40", glow: "rgba(217,70,239,0.3)"  },
  insano:  { label: "INSANO",  color: "text-red-500",     bg: "bg-red-500/10",      border: "border-red-500/40",     glow: "rgba(239,68,68,0.3)"   },
};

interface PreviewMachine {
  id: number; name: string; slug: string; difficulty: string; os: string;
  points: number; characterType: string; solveCount: number;
}
interface VpnSession {
  assignedIp: string; machineName: string; machineSlug: string; status: string;
}

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [previewMachines, setPreviewMachines] = useState<PreviewMachine[]>([]);

  // VPN spawn modal state
  const [vpnMachine, setVpnMachine] = useState<PreviewMachine | null>(null);
  const [spawning, setSpawning]     = useState(false);
  const [session,  setSession]      = useState<VpnSession | null>(null);
  const [copied,   setCopied]       = useState(false);

  // Force dark mode on body
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Fetch 8 real machines for the preview grid
  useEffect(() => {
    fetch(`${BASE}api/lab/machines?limit=8`)
      .then(r => r.json())
      .then((data: PreviewMachine[]) => {
        if (Array.isArray(data)) setPreviewMachines(data.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  const handleMachineClick = (machine: PreviewMachine) => {
    if (!user) { setShowAuth(true); return; }
    setVpnMachine(machine);
    setSession(null);
    setSpawning(false);
    setCopied(false);
  };

  const handleSpawn = async () => {
    if (!vpnMachine || !user) return;
    setSpawning(true);
    try {
      const r = await fetch(`${BASE}api/lab/machines/${vpnMachine.slug}/spawn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username: user.username }),
      });
      const data = await r.json();
      if (r.ok) setSession(data);
    } catch {}
    finally { setSpawning(false); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleVpnDownload = () => {
    if (!user) return;
    window.open(`${BASE}api/lab/vpn-config?userId=${user.id}`, "_blank");
  };

  const closeVpnModal = () => {
    setVpnMachine(null);
    setSession(null);
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "¿Necesito conocimientos previos?",
      a: "Es recomendable tener bases de redes (TCP/IP) y manejo de Linux por línea de comandos. Si no sabes qué es una IP o cómo moverte por directorios en Linux, te costará un poco más, pero explicamos cada herramienta desde cero."
    },
    {
      q: "¿Cuánto dura el curso?",
      a: "El curso es a tu propio ritmo. Tienes más de 40 horas de video, pero el tiempo de práctica en laboratorio depende de ti. La mayoría de estudiantes completan el temario y pasan la certificación en 2-3 meses dedicando unas horas a la semana."
    },
    {
      q: "¿Incluye laboratorios?",
      a: "Usamos plataformas externas (HTB, TryHackMe, DockerLabs, VulnYX) para la práctica. El curso te guía paso a paso en la resolución de máquinas específicas de estas plataformas que simulan el entorno de la eJPTv2."
    },
    {
      q: "¿Tengo soporte si me atasco?",
      a: "Sí. Tendrás acceso a nuestro canal privado de Discord donde Chiara y otros estudiantes resuelven dudas diarias. Nunca estarás solo frente a un exploit fallido."
    }
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans crt-flicker">
      {/* Navbar */}
      <PublicNav />

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('/images/hero-bg.png')] bg-cover bg-center" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent z-0" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div {...fadeIn}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-xs mb-4 shadow-[0_0_10px_rgba(255,77,184,0.2)]">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                NUEVA EDICIÓN 2024 DISPONIBLE
              </div>
              <h1 className="text-4xl md:text-6xl font-bold font-mono mb-4 leading-tight">
                Domina el <span className="text-primary glitch-hover inline-block">Pentesting</span>. <br />
                Pasa la <span className="text-secondary glitch-hover inline-block">eJPTv2</span>.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-lg border-l-2 border-primary/50 pl-4">
                El entrenamiento práctico y guiado en español diseñado para llevarte desde las bases hasta comprometer tu primera certificación profesional.
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <Link href="/suscripcion">
                  <Button size="lg" className="bg-primary text-background hover:bg-primary/90 font-mono font-bold h-12 px-7 glitch-hover shadow-[0_0_15px_rgba(255,77,184,0.4)]">
                    <Zap className="mr-2 h-4 w-4" /> APUNTARME AHORA
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 font-mono h-12 px-7 glitch-hover"
                  onClick={() => document.getElementById("modulos")?.scrollIntoView({ behavior: "smooth" })}>
                  VER MÓDULOS
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/suscripcion">
                  <Button size="sm" className="font-mono font-bold text-xs h-9 px-5 glitch-hover shadow-[0_0_10px_rgba(255,77,184,0.25)]"
                    style={{ background: "linear-gradient(135deg,#ff4db8,#9b55f9)", color: "#fff" }}>
                    ⚡ SUSCRIPCIÓN
                  </Button>
                </Link>
                <Link href="/trabaja">
                  <Button size="sm" variant="outline" className="border-secondary/60 text-secondary hover:bg-secondary/10 font-mono font-bold text-xs h-9 px-5 glitch-hover">
                    TRABAJA CON NOSOTROS
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary blur opacity-20 rounded-lg" />
              <Terminal />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platforms Banner */}
      <section className="py-8 border-y border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden flex items-center">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <div className="text-xs font-mono text-muted-foreground mb-4 tracking-widest uppercase">Target Platforms</div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2 font-mono font-bold text-lg"><TerminalSquare className="text-primary"/> HackTheBox</div>
             <div className="flex items-center gap-2 font-mono font-bold text-lg"><Cpu className="text-primary"/> TryHackMe</div>
             <div className="flex items-center gap-2 font-mono font-bold text-lg"><Server className="text-primary"/> DockerLabs</div>
             <div className="flex items-center gap-2 font-mono font-bold text-lg"><Skull className="text-primary"/> VulnYX</div>
             <div className="flex items-center gap-2 font-mono font-bold text-lg"><Target className="text-primary"/> OffSec PG</div>
          </div>
        </div>
      </section>

      {/* Promise & Features */}
      <section id="curso" className="py-24 relative">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4">Entrenamiento 100% Práctico</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Olvídate de la teoría aburrida. Aquí rompemos cosas. Aprenderás hackeando máquinas vulnerables en entornos reales paso a paso.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Metodología Real", desc: "Aprende el workflow exacto que usa un pentester profesional en auditorías reales." },
              { icon: Target, title: "Preparación eJPTv2", desc: "Simulacros de examen y técnicas específicas para reventar los laboratorios de eLearnSecurity." },
              { icon: Code2, title: "Explotación Web & AD", desc: "Desde inyecciones SQL y bypass de subida de archivos hasta Kerberoasting en Active Directory." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="p-6 rounded-lg border border-primary/20 bg-card/40 hover:bg-card/80 hover:border-primary/50 transition-all duration-300 group shadow-[0_0_0_rgba(255,77,184,0)] hover:shadow-[0_0_20px_rgba(255,77,184,0.1)]"
              >
                <feature.icon className="h-12 w-12 text-primary mb-4 group-hover:scale-110 group-hover:text-secondary transition-all" />
                <h3 className="text-xl font-mono font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section id="modulos" className="py-24 border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div {...fadeIn} className="mb-16 md:text-center">
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4 text-secondary">/sys/class/curriculum</h2>
            <p className="text-muted-foreground">La hoja de ruta definitiva hacia tu certificación.</p>
          </motion.div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {[
              { num: "01", title: "Fundamentos y Reconocimiento", desc: "OSINT, escaneo de puertos, nmap ninja, enumeración de servicios (SMB, FTP, HTTP)." },
              { num: "02", title: "Explotación Web Base", desc: "OWASP Top 10 práctico. SQLi, XSS, LFI/RFI, subida de archivos, command injection." },
              { num: "03", title: "Obtención de Acceso (Foothold)", desc: "Búsqueda de exploits, uso de Metasploit, shells inversas, bind shells, tunneling." },
              { num: "04", title: "Escalada de Privilegios Linux", desc: "SUID, SUDO, Cronjobs, Kernel exploits, capacidades, enumeración local intensiva." },
              { num: "05", title: "Escalada de Privilegios Windows", desc: "Tokens, servicios vulnerables, unquoted service paths, Windows registry." },
              { num: "06", title: "Pivoting y Movimiento Lateral", desc: "Saltando entre redes. Chisel, Ligolo-ng, Proxychains." },
              { num: "07", title: "Active Directory Básico", desc: "Enumeración de AD, Kerberoasting, AS-REP Roasting, Bloodhound." },
              { num: "08", title: "Simulacros eJPTv2", desc: "Laboratorios caja negra estilo examen. Resolución en tiempo real y reporte." }
            ].map((mod, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col md:flex-row items-start md:items-center gap-4 p-6 rounded border border-border bg-background hover:bg-card transition-colors hover:border-primary/30"
              >
                <div className="font-mono text-3xl font-bold text-primary/30 md:w-20">{mod.num}</div>
                <div>
                  <h3 className="text-lg font-mono font-bold text-foreground mb-1">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground">{mod.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section className="py-24 border-t border-border/50 relative">
        <div className="absolute inset-0 z-0 opacity-5 bg-[url('/images/texture.png')] bg-cover" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl" />
              <img 
                src="/images/instructor.png" 
                alt="Chiara Spettro" 
                className="w-full max-w-md mx-auto rounded-xl border border-primary/30 relative z-10 object-cover aspect-square shadow-[0_0_30px_rgba(255,77,184,0.1)] grayscale hover:grayscale-0 transition-all duration-500"
              />
            </motion.div>
            <motion.div {...fadeIn}>
              <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4">Chiara Spettro</h2>
              <div className="text-primary font-mono mb-6">/ Mentor & Penetration Tester</div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Hacker ética y creadora de contenido. Mi objetivo es democratizar la ciberseguridad en español y demostrar que cualquiera con la mentalidad adecuada puede romper sistemas de forma profesional.
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                He destripado cientos de máquinas en stream y ahora he destilado toda esa experiencia en el formato más directo posible para que pases la eJPTv2 sin perder meses en tutoriales desactualizados.
              </p>
              <Button variant="outline" className="font-mono border-border hover:border-primary hover:text-primary transition-colors" onClick={() => window.location.href = "#"}>
                <TerminalIcon className="mr-2 h-4 w-4" /> VER CANAL DE YOUTUBE
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonios" className="py-24 border-t border-border/50 bg-card/20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4">Logs de Exito</h2>
            <p className="text-muted-foreground">Estudiantes que ya reventaron el examen.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Carlos R.", role: "Sysadmin Junior", text: "Llevaba meses dando vueltas con HTB sin entender bien qué hacía. El curso me dio la estructura que necesitaba. Ayer pasé el eJPTv2 con 90%." },
              { name: "Laura M.", role: "Estudiante de DAW", text: "La forma en que Chiara explica la escalada de privilegios es oro puro. Va directo al grano, sin paja. El dinero mejor invertido en mi formación." },
              { name: "Miguel A.", role: "Analista SOC", text: "Los simulacros de examen del final te preparan mentalmente para la tensión de las 48 horas. Entré al examen real sintiéndome súper seguro." }
            ].map((t, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="p-6 rounded border border-border bg-background relative hover:border-primary/40 transition-colors"
              >
                <Award className="absolute top-4 right-4 h-6 w-6 text-secondary/30" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-mono font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{t.name}</div>
                    <div className="text-xs text-primary font-mono">{t.role}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section A: LABORATORIO DE MÁQUINAS */}
      <section className="py-24 border-t border-border/50 bg-card/10 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4 flex items-center justify-center gap-3 text-primary">
              <span className="text-secondary animate-pulse">&gt;</span> LABORATORIO DE INFILTRACIÓN
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Entornos vulnerables realistas diseñados para poner a prueba tus habilidades.
            </p>
            {!user && (
              <p className="mt-3 text-xs font-mono text-primary/70 animate-pulse">
                🔒 Regístrate gratis para acceder al laboratorio completo
              </p>
            )}
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {(previewMachines.length > 0 ? previewMachines : Array.from({ length: 8 }, (_, i) => null)).map((machine, i) => {
              const diff = machine ? DIFF_MAP[machine.difficulty] ?? DIFF_MAP["facil"] : DIFF_MAP["facil"];
              const isUnlocked = !!user;

              return (
                <motion.div
                  key={machine?.id ?? i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => machine && handleMachineClick(machine)}
                  className={`relative p-4 rounded border bg-background overflow-hidden transition-all duration-300 ${
                    isUnlocked
                      ? "border-primary/30 hover:border-primary cursor-pointer hover:shadow-[0_0_20px_rgba(255,77,184,0.2)] group"
                      : "border-border/50 cursor-pointer hover:border-primary/50 group"
                  }`}
                >
                  {/* Lock overlay — always visible when logged out, fades in on hover */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center transition-opacity duration-300">
                      <LockIcon className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-mono font-bold text-primary tracking-widest text-xs">ACCEDE PARA VER</span>
                    </div>
                  )}

                  {/* Unlocked hover overlay */}
                  {isUnlocked && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Wifi className="h-7 w-7 text-primary mb-1 animate-pulse" />
                      <span className="font-mono font-bold text-primary text-xs tracking-widest">CONECTAR VPN</span>
                    </div>
                  )}

                  {/* Skeleton shimmer while loading */}
                  {!machine && (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-border/40 rounded w-2/3" />
                      <div className="h-3 bg-border/30 rounded w-1/2" />
                      <div className="h-3 bg-border/20 rounded w-1/3" />
                    </div>
                  )}

                  {machine && (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-1.5">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-mono text-muted-foreground uppercase">{machine.os}</span>
                        </div>
                        <div className={`text-xs font-mono px-2 py-0.5 rounded border ${diff.color} ${diff.bg} ${diff.border}`}>
                          {diff.label}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-base mb-1 truncate">{machine.name}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                          <Skull className="h-3 w-3" /> {machine.points} pts
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {machine.solveCount} pwned
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="text-center space-y-6">
            {user ? (
              <Link href="/lab" className="inline-flex">
                <Button size="lg" className="bg-primary text-background hover:bg-primary/90 font-mono font-bold glitch-hover shadow-[0_0_15px_rgba(255,77,184,0.3)]">
                  VER MÁQUINAS <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                onClick={() => setShowAuth(true)}
                className="bg-primary text-background hover:bg-primary/90 font-mono font-bold glitch-hover shadow-[0_0_15px_rgba(255,77,184,0.3)]"
              >
                <LockIcon className="mr-2 h-5 w-5" /> DESBLOQUEAR LABORATORIO
              </Button>
            )}
            <div className="flex flex-wrap justify-center gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
              <span>+185 MÁQUINAS</span>
              <span className="text-primary/50">·</span>
              <span>4 NIVELES</span>
              <span className="text-primary/50">·</span>
              <span>DESCARGAS DIRECTAS</span>
              <span className="text-primary/50">·</span>
              <span>NUEVAS CADA SEMANA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialTab="register" />

      {/* VPN Spawn Modal */}
      <AnimatePresence>
        {vpnMachine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && closeVpnModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-md rounded-xl border bg-background overflow-hidden shadow-2xl"
              style={{ borderColor: DIFF_MAP[vpnMachine.difficulty]?.glow?.replace("0.3", "0.5") ?? "rgba(255,77,184,0.5)", boxShadow: `0 0 40px ${DIFF_MAP[vpnMachine.difficulty]?.glow ?? "rgba(255,77,184,0.2)"}` }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-card/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-mono font-bold text-sm tracking-widest text-primary">CONEXIÓN VPN</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${DIFF_MAP[vpnMachine.difficulty]?.color} ${DIFF_MAP[vpnMachine.difficulty]?.bg} ${DIFF_MAP[vpnMachine.difficulty]?.border}`}>
                    {DIFF_MAP[vpnMachine.difficulty]?.label}
                  </span>
                </div>
                <button onClick={closeVpnModal} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Machine name */}
                <div>
                  <p className="text-xs font-mono text-muted-foreground tracking-widest mb-1">OBJETIVO</p>
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    <span className="font-mono font-black text-xl text-foreground">{vpnMachine.name}</span>
                    <span className="text-xs font-mono text-muted-foreground uppercase">{vpnMachine.os}</span>
                  </div>
                </div>

                {!session ? (
                  <>
                    {/* VPN instructions */}
                    <div className="rounded-lg border border-border/50 bg-card/20 p-4 space-y-2">
                      <p className="text-xs font-mono text-muted-foreground">
                        Al iniciar la máquina se te asignará una <span className="text-primary font-bold">IP de objetivo</span> en la red VPN de SpettroWeb. Necesitas el config OpenVPN activo para atacarla.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground">Estado: <span className="text-yellow-400">Sin conexión VPN</span></span>
                      </div>
                    </div>

                    {/* Download VPN first */}
                    <Button
                      variant="outline"
                      className="w-full font-mono text-xs border-primary/40 text-primary hover:bg-primary/10"
                      onClick={handleVpnDownload}
                    >
                      <Download className="mr-2 h-4 w-4" /> DESCARGAR CONFIG OPENVPN
                    </Button>

                    {/* Spawn button */}
                    <Button
                      className="w-full h-12 font-mono font-bold bg-primary text-background hover:bg-primary/90"
                      disabled={spawning}
                      onClick={handleSpawn}
                    >
                      {spawning ? (
                        <><div className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin mr-2" /> INICIANDO MÁQUINA...</>
                      ) : (
                        <><Play className="mr-2 h-5 w-5 fill-background" /> INICIAR Y CONECTAR VPN</>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Connected — show IP */}
                    <div className="rounded-lg border p-4 space-y-3" style={{ background: "rgba(52,211,153,0.06)", borderColor: "rgba(52,211,153,0.3)" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-green-400 tracking-widest">MÁQUINA ACTIVA · VPN CONECTADA</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">IP DEL OBJETIVO</p>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-3xl text-green-400" style={{ textShadow: "0 0 16px rgba(52,211,153,0.7)" }}>
                            {session.assignedIp}
                          </span>
                          <button
                            onClick={() => handleCopy(session.assignedIp)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-green-500/30 text-green-400 text-[10px] font-mono font-bold hover:bg-green-400/10 transition-all"
                          >
                            <Copy className="h-3 w-3" /> {copied ? "¡COPIADO!" : "COPIAR"}
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground bg-black/40 rounded px-3 py-2">
                        $ nmap -sV -sC {session.assignedIp}
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="font-mono text-xs border-primary/40 text-primary hover:bg-primary/10"
                        onClick={handleVpnDownload}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" /> CONFIG VPN
                      </Button>
                      <Button
                        variant="outline"
                        className="font-mono text-xs border-border/60 hover:bg-card"
                        onClick={() => { closeVpnModal(); navigate("/lab"); }}
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> LAB COMPLETO
                      </Button>
                    </div>

                    <p className="text-[10px] font-mono text-muted-foreground text-center">
                      Conecta tu OpenVPN y lanza el ataque a la IP de arriba. ¡Buena suerte!
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section B: TRABAJA CON NOSOTROS */}
      <section className="py-24 border-t border-border/50 bg-background relative">
        <div className="container mx-auto px-4">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4 flex items-center justify-center gap-3 text-secondary">
              <TerminalIcon className="h-8 w-8" /> TRABAJA_CON_NOSOTROS.exe
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Left Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded border border-secondary/30 bg-card/40 relative group"
            >
              <div className="absolute top-0 right-0 p-2 bg-secondary/10 border-b border-l border-secondary/30 text-secondary text-xs font-mono font-bold">
                01
              </div>
              <h3 className="text-2xl font-mono font-bold mb-4">SUBE TU CURSO</h3>
              <p className="text-muted-foreground mb-6">
                ¿Eres instructor o hacker con experiencia? Vende tu curso en SpettroWeb.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-secondary shrink-0" /> Tú pones el precio</li>
                <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-secondary shrink-0" /> SpettroWeb retiene 20%</li>
                <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-secondary shrink-0" /> Pago mensual</li>
                <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-secondary shrink-0" /> Tu marca, tu contenido</li>
              </ul>
              <Link href="/trabaja" className="block">
                <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary/10 font-mono mb-4">
                  SOLICITAR ACCESO DE INSTRUCTOR
                </Button>
              </Link>
              <div className="text-xs text-center text-muted-foreground font-mono">
                Ya confían en nosotros: 12 instructores activos · 3.400 estudiantes
              </div>
            </motion.div>

            {/* Right Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded border border-primary/30 bg-card/40 relative group"
            >
              <div className="absolute top-0 right-0 p-2 bg-primary/10 border-b border-l border-primary/30 text-primary text-xs font-mono font-bold">
                02
              </div>
              <h3 className="text-2xl font-mono font-bold mb-4">TRANSMITE EN VIVO</h3>
              <p className="text-muted-foreground mb-6">
                Haz streaming de tus sesiones de hacking. Conéctamos con Twitch, YouTube y la comunidad de SpettroWeb.
              </p>
              <div className="flex gap-2 mb-6">
                <span className="px-2 py-1 bg-[#9146FF]/20 text-[#9146FF] border border-[#9146FF]/30 text-xs font-mono font-bold rounded">TWITCH</span>
                <span className="px-2 py-1 bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/30 text-xs font-mono font-bold rounded">YOUTUBE</span>
                <span className="px-2 py-1 bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 text-xs font-mono font-bold rounded">DISCORD</span>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                El sitio comparte tus streams con nuestros suscriptores en tiempo real.
              </p>
              <Link href="/trabaja" className="block">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 font-mono">
                  SOLICITAR CANAL EN VIVO
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section C: CERTIFICACIONES */}
      <section className="py-24 border-t border-border/50 bg-card/20 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4 flex items-center justify-center gap-3">
              <Award className="h-8 w-8 text-primary" /> RUTA_DE_CERTIFICACIONES
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
              La plataforma te certifica según tu progreso real. Sin exámenes artificiales — solo máquinas.
            </p>
            <Link href="/certificaciones" className="inline-flex">
              <span className="text-primary hover:text-secondary transition-colors font-mono font-bold flex items-center gap-2">
                VER RUTA COMPLETA <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </motion.div>

          <div className="relative">
            <div className="flex overflow-x-auto pb-8 pt-4 gap-4 px-4 snap-x snap-mandatory hide-scrollbar hide-scrollbar-styled">
              {[
                { name: "Infiltrador Novato", code: "SPN-01", color: "cyan", hex: "255,77,184" },
                { name: "Hacker Junior", code: "SPN-02", color: "green", hex: "0,255,0" },
                { name: "eJPT Prep", code: "SPW-eJPT", color: "magenta", hex: "255,0,255" },
                { name: "Red Team", code: "SPN-03", color: "orange", hex: "255,165,0" },
                { name: "OSCP Prep", code: "SPW-OSCP", color: "red", hex: "255,0,0" },
                { name: "Ghost Operator", code: "SPN-04", color: "purple", hex: "128,0,128" },
                { name: "Legend", code: "SPW-LEG", color: "gold", hex: "255,215,0" },
              ].map((cert, i) => (
                <div key={i} className="shrink-0 w-64 snap-center relative flex items-center">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-lg border border-border bg-background flex flex-col items-center text-center w-full z-10"
                    style={{ 
                      borderColor: `rgba(${cert.hex}, 0.3)`,
                      boxShadow: `0 0 20px rgba(${cert.hex}, 0.1)`,
                    }}
                  >
                    <div 
                      className="w-16 h-16 rounded-full mb-4 flex items-center justify-center font-bold"
                      style={{ 
                        backgroundColor: `rgba(${cert.hex}, 0.1)`,
                        color: `rgb(${cert.hex})`,
                        border: `1px solid rgba(${cert.hex}, 0.5)`
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="font-mono font-bold text-foreground mb-1">{cert.code}</div>
                    <div className="text-sm text-muted-foreground">{cert.name}</div>
                  </motion.div>
                  {i < 6 && (
                    <div className="absolute right-[-1rem] top-1/2 -translate-y-1/2 w-4 h-[2px] bg-border z-0 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE */}
      <section className="py-20 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(155,85,249,0.08)_0,transparent_60%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeIn} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/10 text-secondary font-mono text-xs mb-4">
              <Sparkles className="h-3 w-3" /> NUEVO
            </div>
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4 flex items-center justify-center gap-3">
              <ShoppingBag className="h-8 w-8 text-secondary" />
              <span>MARKETPLACE <span className="text-secondary">HACKER</span></span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Recursos, writeups, herramientas y cursos creados por la comunidad. Compra con SPC o euros.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { icon: BookOpen, label: "Writeups", count: "48", color: "#ff4db8", desc: "Soluciones paso a paso" },
              { icon: Wrench, label: "Herramientas", count: "23", color: "#9b55f9", desc: "Scripts y exploits" },
              { icon: FileText, label: "Plantillas", count: "17", color: "#f59e0b", desc: "Reportes profesionales" },
              { icon: Code2, label: "Mini-cursos", count: "31", color: "#34d399", desc: "Módulos especializados" },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative p-5 rounded-xl border bg-card/30 hover:bg-card/60 transition-all cursor-pointer group"
                style={{ borderColor: `${item.color}30`, boxShadow: `0 0 0 ${item.color}00` }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 20px ${item.color}18`)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 0 ${item.color}00`)}>
                <item.icon className="h-7 w-7 mb-3 transition-transform group-hover:scale-110" style={{ color: item.color }} />
                <div className="font-mono font-black text-2xl mb-0.5" style={{ color: item.color }}>{item.count}</div>
                <div className="font-mono font-bold text-sm text-white mb-1">{item.label}</div>
                <div className="text-[11px] text-muted-foreground">{item.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Featured items strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              { title: "WriteUp — Máquina Phantom", type: "Writeup", price: "150 SPC", badge: "POPULAR", color: "#ff4db8" },
              { title: "Script AutoRecon Pro v2", type: "Herramienta", price: "€4.99", badge: "NUEVO", color: "#9b55f9" },
              { title: "Plantilla Reporte OSCP", type: "Plantilla", price: "80 SPC", badge: "TOP", color: "#f59e0b" },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 p-4 rounded-xl border bg-black/40 hover:bg-black/60 transition-all cursor-pointer group"
                style={{ borderColor: `${item.color}25` }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                  <ShoppingBag className="h-5 w-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${item.color}20`, color: item.color }}>{item.badge}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.type}</span>
                  </div>
                  <p className="font-mono font-bold text-sm text-white truncate">{item.title}</p>
                </div>
                <div className="flex items-center gap-1 font-mono font-black text-sm shrink-0" style={{ color: item.color }}>
                  <Coins className="h-3.5 w-3.5" /> {item.price}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/marketplace" className="inline-flex">
              <Button size="lg" className="font-mono font-bold h-12 px-8 glitch-hover shadow-[0_0_20px_rgba(155,85,249,0.3)]"
                style={{ background: "linear-gradient(135deg,#9b55f9,#7c3aed)", color: "#fff" }}>
                <ShoppingBag className="mr-2 h-5 w-5" /> VER MARKETPLACE COMPLETO
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-t border-border/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4">Preguntas Frecuentes</h2>
            <p className="text-muted-foreground">Resolvemos tus dudas antes de iniciar.</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-border rounded-lg overflow-hidden bg-card/30"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left flex justify-between items-center font-mono font-bold hover:bg-card/80 transition-colors focus:outline-none"
                >
                  <span className={openFaq === i ? "text-primary" : ""}>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform ${openFaq === i ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-6 pt-0 text-muted-foreground text-sm border-t border-border/50">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section className="py-24 border-y border-primary/20 bg-primary/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-secondary/10 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div {...fadeIn}>
              <h2 className="text-4xl md:text-5xl font-mono font-bold mb-6 glitch-hover inline-block">Inicia tu Acceso Root</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Pago único. Acceso de por vida. Actualizaciones futuras incluidas.
              </p>
              <div className="inline-block p-8 rounded-xl border border-primary/40 bg-background/90 backdrop-blur-md mb-8 shadow-[0_0_30px_rgba(255,77,184,0.15)] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary text-secondary-foreground font-mono text-xs font-bold px-4 py-1 rounded-full">
                  MEJOR VALOR
                </div>
                <div className="text-sm font-mono text-secondary mb-2 uppercase tracking-widest mt-2">Oferta Lanzamiento</div>
                <div className="text-6xl font-mono font-bold text-foreground mb-6 flex items-start justify-center gap-2">
                  <span className="text-3xl text-muted-foreground mt-2">€</span>97
                </div>
                <ul className="text-left space-y-3 mb-8 text-muted-foreground">
                  <li className="flex items-center gap-3"><Target className="h-4 w-4 text-primary shrink-0" /> <span>8 Módulos de contenido práctico</span></li>
                  <li className="flex items-center gap-3"><Target className="h-4 w-4 text-primary shrink-0" /> <span>+40 Máquinas resueltas paso a paso</span></li>
                  <li className="flex items-center gap-3"><Target className="h-4 w-4 text-primary shrink-0" /> <span>Comunidad VIP en Discord</span></li>
                  <li className="flex items-center gap-3"><Target className="h-4 w-4 text-primary shrink-0" /> <span>Soporte directo de Chiara</span></li>
                  <li className="flex items-center gap-3"><Target className="h-4 w-4 text-primary shrink-0" /> <span>Plantillas de reporte profesional</span></li>
                </ul>
                <Button size="lg" className="w-full bg-primary text-background hover:bg-primary/90 font-mono font-bold h-14 glitch-hover text-lg shadow-[0_0_15px_rgba(255,77,184,0.3)]">
                  COMPRAR EL CURSO <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
                  <Lock className="h-3 w-3" /> Pago 100% seguro
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-primary/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 text-primary font-mono font-bold text-lg">
              <TerminalIcon className="h-5 w-5" />
              <span>Chiara_Spettro_Web</span>
            </div>
            <div className="text-sm text-muted-foreground text-center md:text-left">
              © 2024 Chiara Spettro. Hacking ético y educación.<br/>
              Rompe sistemas, no leyes.
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-mono text-sm glitch-hover">[YouTube]</a>
              <a href="#" className="text-muted-foreground hover:text-secondary transition-colors font-mono text-sm glitch-hover">[Discord]</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-mono text-sm glitch-hover">[Twitter]</a>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <a href="#">Términos y Condiciones</a>
              <a href="#">Política de Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}