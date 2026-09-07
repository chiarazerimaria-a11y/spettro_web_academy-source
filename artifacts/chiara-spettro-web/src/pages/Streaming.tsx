import { useState } from "react";
import { PublicNav } from "@/components/PublicNav";
import { Link } from "wouter";
import { ChevronLeft, Radio, Calendar, Clock, Users, Lock, Play, Zap, Star, Shield, Video, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

type Stream = {
  id: number;
  title: string;
  instructor: string;
  description: string | null;
  scheduledAt: string | null;
  durationMinutes: number;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  roomUrl: string | null;
  type: string;
  priceEur: string;
};

function formatDate(iso: string | null) {
  if (!iso) return "Por confirmar";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status: string) {
  if (status === "en_vivo") return <span className="flex items-center gap-1.5 text-xs font-mono text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-0.5 rounded-full animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"/>EN VIVO</span>;
  if (status === "programado") return <span className="flex items-center gap-1.5 text-xs font-mono text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full"><Calendar className="h-3 w-3"/>PROGRAMADO</span>;
  return <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full">FINALIZADO</span>;
}

function typeBadge(type: string) {
  if (type === "personalizado") return <Badge className="bg-secondary/20 text-secondary border-secondary/40 font-mono text-[10px]">🎯 PERSONALIZADO</Badge>;
  return <Badge className="bg-primary/20 text-primary border-primary/40 font-mono text-[10px]">👥 GRUPAL</Badge>;
}

function StreamCard({ stream, onJoin }: { stream: Stream; onJoin: (s: Stream) => void }) {
  const isFull = stream.currentParticipants >= stream.maxParticipants;
  const isLive = stream.status === "en_vivo";

  return (
    <div className={`relative rounded-xl border bg-[#0d0d14] overflow-hidden transition-all group hover:border-primary/40 ${isLive ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-border/40"}`}>
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent"/>
      )}
      {/* Header */}
      <div className="p-5 border-b border-border/30">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge(stream.status)}
            {typeBadge(stream.type)}
          </div>
          <span className="font-mono font-bold text-lg text-primary whitespace-nowrap">€{parseFloat(stream.priceEur).toFixed(2)}</span>
        </div>
        <h3 className="font-mono font-bold text-base text-foreground mb-1 group-hover:text-primary transition-colors leading-snug">{stream.title}</h3>
        <p className="text-xs text-muted-foreground">con {stream.instructor}</p>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{stream.description}</p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Calendar className="h-3 w-3 text-primary/60"/>
            {formatDate(stream.scheduledAt)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Clock className="h-3 w-3 text-primary/60"/>
            {stream.durationMinutes} min
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Users className="h-3 w-3 text-primary/60"/>
            {stream.currentParticipants}/{stream.maxParticipants} plazas
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Shield className="h-3 w-3 text-primary/60"/>
            {stream.type === "personalizado" ? "Solo tú + instructor" : "Pequeño grupo"}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
            <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${(stream.currentParticipants / stream.maxParticipants) * 100}%` }}/>
          </div>
          {isFull && <p className="text-[10px] font-mono text-red-400 mt-1">SESIÓN COMPLETA</p>}
        </div>

        <Button
          onClick={() => onJoin(stream)}
          disabled={isFull || stream.status === "finalizado"}
          className={`w-full font-mono font-bold mt-2 ${isLive ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]" : "bg-primary text-background hover:bg-primary/90"}`}
        >
          {isLive ? <><Play className="h-4 w-4 mr-2"/>UNIRSE AHORA</> : isFull ? "COMPLETO" : <><Zap className="h-4 w-4 mr-2"/>RESERVAR PLAZA</>}
        </Button>
      </div>
    </div>
  );
}

export default function Streaming() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [bookingStream, setBookingStream] = useState<Stream | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({ topic: "", level: "principiante", preferredDate: "", message: "" });

  const { data: streams = [], isLoading } = useQuery<Stream[]>({
    queryKey: ["streams"],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/streams`);
      return r.json();
    },
    refetchInterval: 30000,
  });

  const joinMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${BASE}api/streams/${id}/join`, { method: "POST" });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["streams"] });
      setBookingStream(null);
      toast({ title: "¡Plaza reservada!", description: "Recibirás un email con el enlace de acceso." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const liveStreams = streams.filter(s => s.status === "en_vivo");
  const upcoming = streams.filter(s => s.status === "programado");
  const ended = streams.filter(s => s.status === "finalizado");

  const handleJoin = (stream: Stream) => {
    if (!user) {
      toast({ title: "Acceso requerido", description: "Inicia sesión para reservar una sesión.", variant: "destructive" });
      return;
    }
    setBookingStream(stream);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <PublicNav />

      {/* ── HERO ── */}
      <div className="relative w-full pt-12 pb-10 border-b border-secondary/20 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(155,85,249,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(155,85,249,0.07) 1px, transparent 1px)", backgroundSize: "40px 40px" }}/>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(155,85,249,0.06)_0,transparent_65%)]"/>
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="h-3.5 w-3.5"/><span className="tracking-widest">INICIO</span>
            </Link>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2 font-mono text-[10px] text-secondary/70 tracking-[0.4em]">
              <Radio className="h-3 w-3 animate-pulse"/>TRANSMISIONES EN VIVO — CURSOS PERSONALIZADOS<Radio className="h-3 w-3 animate-pulse"/>
            </div>
            <h1 className="font-mono font-black text-4xl md:text-6xl leading-none">
              <span className="text-foreground">&gt; </span>
              <span className="text-secondary">STREAMING</span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm md:text-base">
              Sesiones en directo con instructores expertos. <span className="text-secondary font-semibold">100% personalizadas</span> a tu nivel y objetivos. Aprende hacking real, en tiempo real.
            </p>
            <div className="flex items-center gap-6 pt-2 font-mono text-xs">
              <div className="flex items-center gap-2 text-muted-foreground"><Video className="h-3.5 w-3.5 text-secondary"/>Videollamada privada</div>
              <div className="flex items-center gap-2 text-muted-foreground"><MessageCircle className="h-3.5 w-3.5 text-secondary"/>Chat en directo</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Shield className="h-3.5 w-3.5 text-secondary"/>Entorno seguro</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="bg-secondary/5 border-b border-secondary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Star className="h-4 w-4 text-secondary"/>, label: "Instructor experto", desc: "Certificado y con experiencia real" },
              { icon: <Lock className="h-4 w-4 text-secondary"/>, label: "Solo para ti", desc: "Sesiones 1:1 privadas o grupos pequeños" },
              { icon: <Zap className="h-4 w-4 text-secondary"/>, label: "Aprende rápido", desc: "El ritmo que tú marcas" },
              { icon: <CheckCircle className="h-4 w-4 text-secondary"/>, label: "Grabación incluida", desc: "Accede al replay después" },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                <div className="mt-0.5">{f.icon}</div>
                <div>
                  <p className="font-mono text-xs font-bold text-foreground">{f.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-10">

        {/* Live Now */}
        {liveStreams.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"/>
              <h2 className="font-mono font-bold text-xl text-red-400">EN DIRECTO AHORA</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {liveStreams.map(s => <StreamCard key={s.id} stream={s} onJoin={handleJoin}/>)}
            </div>
          </section>
        )}

        {/* Upcoming */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-mono font-bold text-xl text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary"/>PRÓXIMAS SESIONES
            </h2>
            <Button variant="outline" onClick={() => setShowRequestForm(true)}
              className="border-secondary/40 text-secondary hover:bg-secondary/10 font-mono text-xs">
              + SOLICITAR SESIÓN PERSONALIZADA
            </Button>
          </div>
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-5">
              {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-xl bg-[#0d0d14] border border-border/30 animate-pulse"/>)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-mono">
              <Radio className="h-8 w-8 mx-auto mb-3 text-secondary/40"/>
              <p>No hay sesiones programadas por ahora.</p>
              <Button variant="outline" onClick={() => setShowRequestForm(true)} className="mt-4 border-secondary/40 text-secondary hover:bg-secondary/10 font-mono text-xs">
                SOLICITAR MI SESIÓN
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {upcoming.map(s => <StreamCard key={s.id} stream={s} onJoin={handleJoin}/>)}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="border border-secondary/20 rounded-2xl bg-secondary/5 p-8">
          <h2 className="font-mono font-bold text-xl text-center mb-8 text-secondary">¿CÓMO FUNCIONA?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Elige tu sesión", desc: "Selecciona el tema y el instructor. Si no encuentras lo que buscas, solicita una sesión a medida." },
              { step: "02", title: "Reserva y paga", desc: "Pago seguro por transferencia, PayPal o crypto. Confirmas tu plaza al instante." },
              { step: "03", title: "Conéctate y aprende", desc: "Recibes el enlace privado. Sesión en directo con el instructor, preguntas en tiempo real, grabación incluida." },
            ].map((s, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full border border-secondary/40 flex items-center justify-center mx-auto">
                  <span className="font-mono font-black text-secondary text-lg">{s.step}</span>
                </div>
                <h3 className="font-mono font-bold text-sm text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Past sessions */}
        {ended.length > 0 && (
          <section>
            <h2 className="font-mono font-bold text-base text-muted-foreground mb-4">SESIONES PASADAS</h2>
            <div className="grid md:grid-cols-2 gap-4 opacity-50">
              {ended.map(s => <StreamCard key={s.id} stream={s} onJoin={handleJoin}/>)}
            </div>
          </section>
        )}
      </div>

      {/* ── BOOKING MODAL ── */}
      {bookingStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setBookingStream(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"/>
          <div className="relative z-10 bg-[#0d0d14] border border-secondary/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_40px_rgba(155,85,249,0.15)]" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono font-bold text-lg text-secondary mb-1">CONFIRMAR RESERVA</h3>
            <p className="text-sm text-muted-foreground mb-5">{bookingStream.title}</p>
            <div className="space-y-3 mb-6 bg-background/50 rounded-xl p-4 border border-border/30">
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-foreground">Sesión</span>
                <span className="text-foreground">{bookingStream.type === "personalizado" ? "1:1 Personalizada" : "Grupal"}</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-foreground">Instructor</span>
                <span className="text-foreground">{bookingStream.instructor}</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-foreground">Duración</span>
                <span className="text-foreground">{bookingStream.durationMinutes} min</span>
              </div>
              <div className="flex justify-between font-mono text-sm border-t border-border/30 pt-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-secondary font-bold text-lg">€{parseFloat(bookingStream.priceEur).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Al confirmar recibirás un email con instrucciones de pago y el enlace privado de la sesión. Pago por transferencia bancaria, PayPal o crypto.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setBookingStream(null)} className="flex-1 border-border/40 font-mono">CANCELAR</Button>
              <Button onClick={() => joinMutation.mutate(bookingStream.id)} disabled={joinMutation.isPending}
                className="flex-1 bg-secondary text-background hover:bg-secondary/90 font-mono font-bold">
                {joinMutation.isPending ? "..." : "CONFIRMAR RESERVA"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── REQUEST FORM MODAL ── */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowRequestForm(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"/>
          <div className="relative z-10 bg-[#0d0d14] border border-primary/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_40px_rgba(255,77,184,0.1)]" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono font-bold text-lg text-primary mb-1">SOLICITAR SESIÓN PERSONALIZADA</h3>
            <p className="text-sm text-muted-foreground mb-5">Cuéntanos qué quieres aprender y te contactaremos en 24h.</p>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">TEMA / ÁREA DE HACKING</label>
                <input value={formData.topic} onChange={e => setFormData(p => ({ ...p, topic: e.target.value }))}
                  placeholder="Ej: Web hacking, Active Directory, OSINT..."
                  className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60"/>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">TU NIVEL</label>
                <select value={formData.level} onChange={e => setFormData(p => ({ ...p, level: e.target.value }))}
                  className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60">
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">MENSAJE (OPCIONAL)</label>
                <textarea value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  rows={3} placeholder="Cuéntanos más sobre lo que quieres lograr..."
                  className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60 resize-none"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowRequestForm(false)} className="flex-1 border-border/40 font-mono">CANCELAR</Button>
              <Button onClick={() => { setShowRequestForm(false); toast({ title: "¡Solicitud enviada!", description: "Te contactaremos en menos de 24 horas." }); }}
                className="flex-1 bg-primary text-background hover:bg-primary/90 font-mono font-bold">
                ENVIAR SOLICITUD
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
