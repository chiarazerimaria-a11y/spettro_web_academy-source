import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Terminal, Zap, CheckCircle, Send, BookOpen, Cpu, Radio,
  ChevronDown, Star, DollarSign, Shield, Users, Clock, Video,
  Twitch, Youtube, Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PublicNav } from "@/components/PublicNav";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const ROLES = [
  {
    id: "instructor",
    icon: BookOpen,
    label: "DA TU CURSO",
    sublabel: "Instructor",
    colorHex: "#9b55f9",
    colorClass: "secondary",
    headline: "Publica tu curso y gana el 80% de cada venta",
    desc: "Sube tus vídeos, define el temario y pon tu precio. SpettroWeb gestiona pagos, alojamiento y marketing. Tú solo enseñas.",
    perks: [
      { icon: DollarSign, text: "80% de ingresos por venta" },
      { icon: Star, text: "Tú fijas el precio del curso" },
      { icon: Users, text: "Acceso a +3.400 estudiantes activos" },
      { icon: Clock, text: "Pago mensual garantizado" },
      { icon: Shield, text: "Panel de instructor con métricas" },
      { icon: Video, text: "Hosting de vídeos incluido" },
    ],
    faqs: [
      { q: "¿Qué formato de vídeo acepta la plataforma?", a: "MP4 en cualquier resolución. Recomendamos 1080p mínimo. Los vídeos se reencoden automáticamente." },
      { q: "¿Cómo recibo los pagos?", a: "Transferencia bancaria mensual a partir de €50 acumulados. Necesitas NIF/CIF y cuenta en zona SEPA." },
      { q: "¿Puedo actualizar el contenido del curso?", a: "Sí, en cualquier momento y sin límite de actualizaciones desde tu panel." },
    ],
    formPlaceholder: "¿Sobre qué tema es tu curso? ¿Tienes experiencia docente o contenido previo? ¿Cuántas horas de vídeo aproximadamente?",
  },
  {
    id: "streamer",
    icon: Radio,
    label: "TRANSMITE EN VIVO",
    sublabel: "Streamer",
    colorHex: "#9146FF",
    colorClass: "primary",
    headline: "Haz streaming de hacking para miles de viewers",
    desc: "Conecta tu canal de Twitch o YouTube y comparte tus sesiones de hacking en tiempo real con la comunidad de SpettroWeb.",
    perks: [
      { icon: Zap, text: "Integración con Twitch y YouTube" },
      { icon: Users, text: "Comunidad activa en Discord incluida" },
      { icon: DollarSign, text: "Monetización con tips de la comunidad" },
      { icon: Star, text: "Destacado en la home durante el stream" },
      { icon: Shield, text: "Insignia de streamer verificado" },
      { icon: Clock, text: "Horario totalmente flexible" },
    ],
    faqs: [
      { q: "¿Qué tipo de contenido está permitido?", a: "CTFs, máquinas de VulnYX/HTB/THM, análisis de CVEs, Bug Bounty con permiso, Red Team en labs propios. No se permite contenido ilegal." },
      { q: "¿Necesito equipo especial?", a: "Solo una buena conexión, micrófono decente y Kali/Parrot. El software de streaming (OBS) es gratuito." },
      { q: "¿Hay un mínimo de horas por semana?", a: "No. Puedes streamear cuando quieras. Recomendamos al menos 2h/semana para mantener audiencia." },
    ],
    formPlaceholder: "¿Tienes canal de Twitch o YouTube? ¿Qué tipo de contenido de hacking harías en los streams? ¿Cuántos seguidores tienes actualmente?",
  },
  {
    id: "machine",
    icon: Cpu,
    label: "CREA MÁQUINAS",
    sublabel: "Machine Creator",
    colorHex: "#ff4db8",
    colorClass: "primary",
    headline: "Diseña retos reales para el laboratorio",
    desc: "Crea máquinas vulnerables para los 3.400+ estudiantes del lab de SpettroWeb. Tu nombre y créditos públicos en cada máquina.",
    perks: [
      { icon: DollarSign, text: "Compensación económica por máquina" },
      { icon: Star, text: "Crédito público en el laboratorio" },
      { icon: Shield, text: "Revisión técnica incluida" },
      { icon: Cpu, text: "Infraestructura de hosting gestionada" },
      { icon: Users, text: "Emblema de creador verificado" },
      { icon: Zap, text: "Acceso anticipado a nuevas features" },
    ],
    faqs: [
      { q: "¿En qué formato entrego la máquina?", a: "OVA/VHD exportado desde VirtualBox/VMware. Deben funcionar en entornos bridge/NAT y contener al menos una flag root." },
      { q: "¿Qué dificultades acepta la plataforma?", a: "FÁCIL, MEDIO, DIFÍCIL e INSANO. Necesitamos de todos los niveles, especialmente FÁCIL y MEDIO para principiantes." },
      { q: "¿Puedo crear máquinas con temáticas específicas?", a: "Sí. Valorizamos máquinas con temáticas reales (CVEs, Active Directory, Web, IoT). Cuéntanos tu idea en el formulario." },
    ],
    formPlaceholder: "¿Qué tipo de máquinas crearías? ¿Qué técnicas explotarías (SQLi, RCE, LFI, AD...)? ¿Qué nivel de dificultad? ¿Has creado máquinas para otras plataformas?",
  },
  {
    id: "both",
    icon: Zap,
    label: "PACK COMPLETO",
    sublabel: "Todo a la vez",
    colorHex: "#ffaa00",
    colorClass: "primary",
    headline: "Instructor + Streamer + Creador de máquinas",
    desc: "El paquete elite para hackers con experiencia total. Combina los tres roles y accede a beneficios exclusivos de la academia.",
    perks: [
      { icon: Star, text: "Todos los beneficios de los 3 roles" },
      { icon: Zap, text: "Prioridad máxima en revisión y publicación" },
      { icon: Users, text: "Canal exclusivo #elite en Discord" },
      { icon: Shield, text: "Acceso anticipado a todas las features" },
      { icon: DollarSign, text: "Comisión reducida al 15%" },
      { icon: Video, text: "Mentoría directa con el equipo Spettro" },
    ],
    faqs: [
      { q: "¿Puedo empezar con un rol y añadir otros después?", a: "Sí, absolutamente. Puedes empezar como instructor y añadir el rol de creador de máquinas en cualquier momento." },
      { q: "¿La comisión reducida (15%) aplica desde el primer día?", a: "Sí, desde el momento en que se aprueba tu acceso al Pack Completo." },
    ],
    formPlaceholder: "Cuéntanos qué roles te interesan y con cuál quieres empezar. ¿Tienes contenido de curso, experiencia en streams o ideas de máquinas?",
  },
];

export default function TrabajaConNosotros() {
  const [selectedRole, setSelectedRole] = useState("instructor");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<number[]>([]);
  const [payoutMethod, setPayoutMethod] = useState<"iban" | "paypal">("iban");
  const [payoutIban, setPayoutIban] = useState("");
  const [payoutPaypal, setPayoutPaypal] = useState("");
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", experience: "", links: "", message: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const role = ROLES.find(r => r.id === selectedRole)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, role: selectedRole,
          payoutIban: payoutMethod === "iban" ? payoutIban || null : null,
          payoutPaypal: payoutMethod === "paypal" ? payoutPaypal || null : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al enviar");
      }
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (i: number) =>
    setOpenFaqs(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <PublicNav />

      {/* Hero */}
      <section className="relative py-14 md:py-24 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(155,85,249,0.07)_0,transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div {...fadeIn}>
            <Badge className="mb-5 bg-secondary/10 text-secondary border-secondary/30 font-mono text-xs">ÚNETE AL EQUIPO</Badge>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-mono font-bold mb-5 leading-tight">
              TRABAJA_<span className="text-secondary">CON_NOSOTROS</span>.exe
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              ¿Eres hacker con algo que enseñar? Elige tu rol, envía tu solicitud y únete a la academia en español más técnica del mercado.
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div {...fadeIn} className="flex flex-wrap justify-center gap-6 md:gap-10 mt-10">
            {[["12+", "Instructores activos"], ["3.400+", "Estudiantes"], ["99", "Máquinas en lab"], ["4.8/5", "Valoración"]].map(([n, l]) => (
              <div key={l} className="text-center min-w-[70px]">
                <div className="text-2xl md:text-3xl font-mono font-bold text-secondary">{n}</div>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Role selector */}
      <section className="py-10 md:py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <motion.h2 {...fadeIn} className="font-mono text-xl md:text-2xl font-bold text-center mb-8 text-primary">
            &gt; ELIGE TU ROL
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            {ROLES.map((r, i) => {
              const Icon = r.icon;
              const sel = selectedRole === r.id;
              return (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => { setSelectedRole(r.id); setOpenFaqs([]); }}
                  className={`flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all text-center ${sel ? "border-secondary bg-secondary/5 shadow-[0_0_20px_rgba(155,85,249,0.12)]" : "border-border hover:border-secondary/40 bg-card/30"}`}
                >
                  <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${r.colorHex}15` }}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: r.colorHex }} />
                  </div>
                  <span className="font-mono text-[11px] md:text-xs font-bold leading-tight" style={{ color: sel ? r.colorHex : undefined }}>
                    {r.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{r.sublabel}</span>
                  {sel && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: r.colorHex }} />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role Detail */}
      <AnimatePresence mode="wait">
        <motion.section
          key={selectedRole}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="py-10 md:py-16 border-b border-border"
        >
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              {/* Left: info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${role.colorHex}15` }}>
                    <role.icon className="h-6 w-6" style={{ color: role.colorHex }} />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] text-muted-foreground">{role.sublabel}</p>
                    <h3 className="font-mono font-bold text-lg leading-tight" style={{ color: role.colorHex }}>{role.label}</h3>
                  </div>
                </div>

                <h2 className="text-xl md:text-2xl font-bold font-mono mb-3 leading-snug">{role.headline}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{role.desc}</p>

                {/* Streaming platform badges for streamer role */}
                {selectedRole === "streamer" && (
                  <div className="flex gap-2 mb-6 flex-wrap">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#9146FF]/15 text-[#9146FF] border border-[#9146FF]/30 text-xs font-mono font-bold rounded-lg">
                      <Twitch className="h-3.5 w-3.5" /> TWITCH
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000]/15 text-[#FF0000] border border-[#FF0000]/30 text-xs font-mono font-bold rounded-lg">
                      <Youtube className="h-3.5 w-3.5" /> YOUTUBE
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/30 text-xs font-mono font-bold rounded-lg">
                      <Users className="h-3.5 w-3.5" /> DISCORD
                    </span>
                  </div>
                )}

                {/* Perks */}
                <ul className="space-y-2.5">
                  {role.perks.map((p) => {
                    const Icon = p.icon;
                    return (
                      <li key={p.text} className="flex items-center gap-3 text-sm">
                        <div className="p-1.5 rounded" style={{ backgroundColor: `${role.colorHex}12` }}>
                          <Icon className="h-3.5 w-3.5" style={{ color: role.colorHex }} />
                        </div>
                        <span className="text-muted-foreground">{p.text}</span>
                      </li>
                    );
                  })}
                </ul>

                {/* FAQs */}
                {role.faqs.length > 0 && (
                  <div className="mt-8">
                    <p className="font-mono text-xs text-muted-foreground mb-3">PREGUNTAS FRECUENTES</p>
                    <div className="space-y-2">
                      {role.faqs.map((faq, i) => (
                        <div key={i} className="border border-border rounded-lg overflow-hidden bg-card/20">
                          <button onClick={() => toggleFaq(i)} className="w-full text-left flex items-center justify-between p-3 gap-2 text-xs font-mono font-bold hover:bg-card/60 transition-colors">
                            <span className={openFaqs.includes(i) ? "text-primary" : ""}>{faq.q}</span>
                            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${openFaqs.includes(i) ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
                          </button>
                          <AnimatePresence>
                            {openFaqs.includes(i) && (
                              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }}>
                                <p className="px-3 pb-3 text-xs text-muted-foreground border-t border-border/50 pt-2.5 leading-relaxed">{faq.a}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Form */}
              <div>
                {submitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="border border-primary/30 bg-primary/5 rounded-xl p-8 md:p-10 text-center">
                    <CheckCircle className="h-14 w-14 text-primary mx-auto mb-4" />
                    <h3 className="font-mono text-xl font-bold text-primary mb-2">SOLICITUD ENVIADA</h3>
                    <p className="text-muted-foreground text-sm mb-6">Revisaremos tu solicitud y te contactaremos en menos de 48 horas.</p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <Button onClick={() => setSubmitted(false)} variant="outline" className="font-mono border-primary text-primary">
                        ENVIAR OTRA
                      </Button>
                      <Link href="/">
                        <Button className="font-mono bg-primary text-black hover:brightness-110">VOLVER AL INICIO</Button>
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="border border-border rounded-xl p-5 md:p-6 bg-card/20 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Terminal className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm font-bold text-primary">ENVIAR SOLICITUD</span>
                      <Badge className="ml-auto text-[10px] font-mono" style={{ backgroundColor: `${role.colorHex}20`, color: role.colorHex, borderColor: `${role.colorHex}40` }}>
                        {role.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">NOMBRE COMPLETO *</label>
                        <Input value={form.name} onChange={set("name")} placeholder="Tu nombre" required className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-9" />
                      </div>
                      <div>
                        <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">EMAIL *</label>
                        <Input type="email" value={form.email} onChange={set("email")} placeholder="tu@email.com" required className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-9" />
                      </div>
                    </div>

                    <div>
                      <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">EXPERIENCIA EN CIBERSEGURIDAD *</label>
                      <Textarea value={form.experience} onChange={set("experience")} placeholder="Certificaciones, CTFs, años en el sector, herramientas que dominas..." required rows={3} className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary resize-none" />
                    </div>

                    <div>
                      <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">LINKS (GitHub, LinkedIn, HTB, canal...)</label>
                      <Input value={form.links} onChange={set("links")} placeholder="https://..." className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-9" />
                    </div>

                    <div>
                      <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">TU PROPUESTA *</label>
                      <Textarea value={form.message} onChange={set("message")} placeholder={role.formPlaceholder} required rows={4} className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary resize-none" />
                    </div>

                    {/* Payout section */}
                    <div className="border border-secondary/20 rounded-lg p-4 bg-secondary/5 flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="h-4 w-4 text-secondary" />
                        <span className="font-mono text-xs font-bold text-secondary">DATOS DE COBRO</span>
                        <span className="font-mono text-[10px] text-muted-foreground ml-auto">Opcional ahora, requerido al aprobarte</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
                        ¿Cómo quieres recibir tus pagos? Puedes añadirlo ahora o más tarde cuando te aprobemos.
                      </p>
                      {/* Toggle IBAN / PayPal */}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setPayoutMethod("iban")}
                          className={`flex-1 py-2 rounded font-mono text-xs font-bold border transition-all ${payoutMethod === "iban" ? "border-secondary bg-secondary/10 text-secondary" : "border-border text-muted-foreground hover:border-secondary/40"}`}>
                          IBAN / BANCO
                        </button>
                        <button type="button" onClick={() => setPayoutMethod("paypal")}
                          className={`flex-1 py-2 rounded font-mono text-xs font-bold border transition-all ${payoutMethod === "paypal" ? "border-secondary bg-secondary/10 text-secondary" : "border-border text-muted-foreground hover:border-secondary/40"}`}>
                          PAYPAL
                        </button>
                      </div>
                      {payoutMethod === "iban" ? (
                        <Input value={payoutIban} onChange={e => setPayoutIban(e.target.value.toUpperCase())}
                          placeholder="ES00 0000 0000 00 0000000000" maxLength={34}
                          className="font-mono text-sm bg-black/50 border-secondary/20 focus:border-secondary h-9 tracking-wider" />
                      ) : (
                        <Input value={payoutPaypal} onChange={e => setPayoutPaypal(e.target.value)}
                          type="email" placeholder="tu-paypal@email.com"
                          className="font-mono text-sm bg-black/50 border-secondary/20 focus:border-secondary h-9" />
                      )}
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-11 font-mono font-bold text-sm text-black hover:brightness-110 transition-all"
                      style={{ backgroundColor: role.colorHex, boxShadow: `0 0 20px ${role.colorHex}44` }}>
                      <Send className="mr-2 h-4 w-4" />
                      {loading ? "ENVIANDO..." : "ENVIAR SOLICITUD"}
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground font-mono">
                      Respuesta en menos de 48 horas laborables
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

      {/* Bottom CTA */}
      <section className="py-10 bg-card/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm mb-4 font-mono">¿Quieres ver los cursos disponibles antes de solicitar?</p>
          <Link href="/cursos">
            <Button variant="outline" className="font-mono border-primary/40 text-primary hover:bg-primary/10">
              VER CATÁLOGO DE CURSOS
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
