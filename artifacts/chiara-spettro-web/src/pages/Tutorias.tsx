import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Video, Plus, Clock, Coins, Star, ChevronLeft, CheckCircle,
  Calendar, Search, BookOpen, Shield, Terminal, Network, Bug,
  X, User, Link2, Play, ExternalLink, Lock, Eye, Maximize2
} from "lucide-react";
import { useEffect, useRef } from "react";

const BASE = import.meta.env.BASE_URL;

interface TutoringSession {
  id: number;
  tutorId: number;
  tutorUsername: string;
  studentId: number | null;
  studentUsername: string | null;
  title: string;
  description: string;
  topics: string[] | null;
  durationMinutes: number;
  pricePerSession: number;
  status: string;
  scheduledAt: string | null;
  meetLink: string | null;
  rating: number | null;
  reviewText: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  disponible: { label: "DISPONIBLE", color: "#34d399" },
  reservada: { label: "RESERVADA", color: "#ff4db8" },
  completada: { label: "COMPLETADA", color: "#9ca3af" },
  cancelada: { label: "CANCELADA", color: "#ef4444" },
};

function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function YouTubeThumbnail({ url, title }: { url: string | null; title: string }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return (
      <div className="w-full h-36 rounded-xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#0f0a1e,#1a0f35)" }}>
        <Video className="h-10 w-10 opacity-20" style={{ color: "#9b55f9" }} />
      </div>
    );
  }
  return (
    <div className="relative w-full h-36 rounded-xl overflow-hidden group">
      <img
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={e => {
          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)" }} />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,0,0,0.85)", boxShadow: "0 0 20px rgba(255,0,0,0.4)" }}>
          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
        </div>
      </div>
      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
        YT
      </div>
    </div>
  );
}

interface VideoModalState {
  title: string;
  url: string;
  videoId: string;
  startTime?: number;
}

function extractStartTime(url: string): number | undefined {
  const t = url.match(/[?&]t=(\d+)/);
  return t ? parseInt(t[1]) : undefined;
}

function buildEmbedUrl(videoId: string, startTime?: number): string {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    ...(startTime ? { start: String(startTime) } : {}),
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function VideoModal({ modal, onClose }: { modal: VideoModalState; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      {/* Header */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-3 px-1"
        onClick={e => e.stopPropagation()}>
        <div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-widest mb-0.5">REPRODUCIENDO</div>
          <h2 className="font-mono font-bold text-base text-foreground truncate max-w-[600px]">{modal.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <a href={`https://www.youtube.com/watch?v=${modal.videoId}${modal.startTime ? `&t=${modal.startTime}` : ""}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ExternalLink className="h-3 w-3" /> Abrir en YouTube
          </a>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Video player */}
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 0 80px rgba(155,85,249,0.2), 0 0 160px rgba(0,0,0,0.8)", aspectRatio: "16/9" }}
        onClick={e => e.stopPropagation()}>
        <iframe
          src={buildEmbedUrl(modal.videoId, modal.startTime)}
          title={modal.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>

      <p className="mt-3 font-mono text-[10px] text-white/20">Pulsa ESC o haz clic fuera para cerrar</p>
    </div>
  );
}

export default function Tutorias() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "disponible" | "completada">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [booking, setBooking] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [videoModal, setVideoModal] = useState<VideoModalState | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", topics: "",
    durationMinutes: 60, pricePerSession: 500, meetLink: "",
  });

  const { data: sessions = [], isLoading } = useQuery<TutoringSession[]>({
    queryKey: ["tutoring-sessions"],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/tutoring`);
      return r.json();
    },
    refetchInterval: 30000,
  });

  const filtered = sessions.filter(s => {
    const matchFilter = filter === "all" || s.status === filter;
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.tutorUsername.toLowerCase().includes(search.toLowerCase()) ||
      (s.topics || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const bookSession = async (session: TutoringSession) => {
    if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
    setBooking(session.id);
    try {
      const r = await fetch(`${BASE}api/tutoring/${session.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id, studentUsername: user.username }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: "¡Sesión reservada!", description: `${session.pricePerSession.toLocaleString()} SPC deducidos.` });
      qc.invalidateQueries({ queryKey: ["tutoring-sessions"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBooking(null);
    }
  };

  const createSession = async () => {
    if (!user) { toast({ title: "Inicia sesión primero", variant: "destructive" }); return; }
    if (!form.title || !form.pricePerSession) { toast({ title: "Completa los campos requeridos", variant: "destructive" }); return; }
    try {
      const r = await fetch(`${BASE}api/tutoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: user.id, tutorUsername: user.username,
          title: form.title, description: form.description,
          topics: form.topics ? form.topics.split(",").map(t => t.trim()).filter(Boolean) : [],
          durationMinutes: form.durationMinutes,
          pricePerSession: form.pricePerSession,
          meetLink: form.meetLink || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: "Sesión publicada", description: "Los alumnos ya pueden reservar tu tutoría" });
      setShowCreate(false);
      setForm({ title: "", description: "", topics: "", durationMinutes: 60, pricePerSession: 500, meetLink: "" });
      qc.invalidateQueries({ queryKey: ["tutoring-sessions"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-12 relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 font-mono">
            <ChevronLeft className="h-4 w-4" /> INICIO
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Video className="h-8 w-8 text-secondary" />
                <Badge className="font-mono text-xs" style={{ background: "rgba(155,85,249,0.15)", color: "#9b55f9", border: "1px solid rgba(155,85,249,0.4)" }}>
                  1:1 SESSIONS
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-mono font-bold mb-2" style={{ color: "#9b55f9" }}>
                &gt; TUTORÍAS
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                Aprende con expertos o enseña lo que sabes. Sesiones 1:1 pagadas en SpettroCoin.
              </p>
            </div>
            {user && (
              <Button onClick={() => setShowCreate(true)}
                className="font-mono font-bold shrink-0 gap-2"
                style={{ background: "linear-gradient(135deg,#9b55f9,#ff4db8)", border: "none" }}>
                <Plus className="h-4 w-4" /> OFRECER TUTORÍA
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-sm">
            {[
              { label: "TUTORES", value: new Set(sessions.map(s => s.tutorId)).size },
              { label: "DISPONIBLES", value: sessions.filter(s => s.status === "disponible").length },
              { label: "COMPLETADAS", value: sessions.filter(s => s.status === "completada").length },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-lg border border-secondary/20 bg-secondary/5">
                <div className="text-2xl font-mono font-bold" style={{ color: "#9b55f9" }}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* How it works */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <User className="h-5 w-5" />, step: "01", title: "Elige tu tutor", desc: "Busca por tema, precio y disponibilidad" },
            { icon: <Coins className="h-5 w-5" />, step: "02", title: "Reserva con SPC", desc: "El pago se retiene hasta que confirmes la sesión" },
            { icon: <CheckCircle className="h-5 w-5" />, step: "03", title: "Sesión + pago", desc: "Valida la sesión y el tutor recibe sus SPC" },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-4 p-4 rounded-xl border border-secondary/20 bg-secondary/5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(155,85,249,0.2)", color: "#9b55f9" }}>
                {s.icon}
              </div>
              <div>
                <div className="text-[10px] font-mono text-muted-foreground mb-0.5">PASO {s.step}</div>
                <div className="font-mono font-bold text-sm text-foreground">{s.title}</div>
                <div className="text-xs text-muted-foreground font-mono">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por tutor o tema..."
              className="w-full pl-9 pr-4 py-2 bg-card border border-secondary/20 rounded-lg font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary/50" />
          </div>
          <div className="flex gap-2">
            {(["all", "disponible", "completada"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all
                  ${filter === f ? "bg-secondary/20 border-secondary text-secondary" : "bg-card border-secondary/20 text-muted-foreground hover:border-secondary/40"}`}
                style={filter === f ? { color: "#9b55f9", borderColor: "#9b55f9", background: "rgba(155,85,249,0.15)" } : undefined}>
                {f === "all" ? "TODAS" : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions grid */}
        {isLoading ? (
          <div className="text-center py-20 font-mono animate-pulse" style={{ color: "#9b55f9" }}>Cargando sesiones...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="font-mono text-muted-foreground">No hay tutorías disponibles.</p>
            {user && <Button onClick={() => setShowCreate(true)} className="mt-4 font-mono" variant="outline">Ofrecer la primera</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(session => {
              const status = STATUS_CONFIG[session.status] || STATUS_CONFIG.disponible;
              const isMySession = session.tutorId === user?.id;
              const isBooked = session.studentId === user?.id;
              const canSeeLink = isMySession || isBooked;
              const videoId = extractYouTubeId(session.meetLink);
              const isExpanded = expandedId === session.id;

              return (
                <div key={session.id}
                  className="rounded-2xl border bg-card overflow-hidden transition-all hover:shadow-[0_0_24px_rgba(155,85,249,0.12)] flex flex-col"
                  style={{ borderColor: session.status === "disponible" ? "rgba(155,85,249,0.25)" : "rgba(255,255,255,0.05)" }}>

                  {/* Thumbnail / video area */}
                  <div className="relative cursor-pointer"
                    onClick={() => canSeeLink && videoId ? setVideoModal({
                      title: session.title,
                      url: session.meetLink!,
                      videoId,
                      startTime: extractStartTime(session.meetLink!),
                    }) : undefined}>
                    <YouTubeThumbnail url={session.meetLink} title={session.title} />
                    {/* Status badge over thumbnail */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
                        style={{ background: `${status.color}22`, color: status.color, border: `1px solid ${status.color}55` }}>
                        {status.label}
                      </span>
                    </div>
                    {/* Access indicator */}
                    <div className="absolute top-2.5 right-2.5">
                      {canSeeLink ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm"
                          style={{ background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.5)" }}>
                          <Eye className="h-3 w-3" style={{ color: "#34d399" }} />
                        </div>
                      ) : session.status === "disponible" ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm"
                          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)" }}>
                          <Lock className="h-3 w-3 text-white/60" />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    {/* Title + rating */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-mono font-bold text-sm leading-snug flex-1">{session.title}</h3>
                      {session.rating && (
                        <div className="flex items-center gap-1 text-yellow-400 shrink-0">
                          <Star className="h-3 w-3 fill-yellow-400" />
                          <span className="text-xs font-mono">{session.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Description — expandable */}
                    <div className="mb-3">
                      <p className={`text-xs text-muted-foreground font-mono leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                        {session.description}
                      </p>
                      {session.description.length > 100 && (
                        <button onClick={() => setExpandedId(isExpanded ? null : session.id)}
                          className="text-[10px] font-mono mt-1 transition-colors"
                          style={{ color: "#9b55f9" }}>
                          {isExpanded ? "Ver menos ↑" : "Ver más ↓"}
                        </button>
                      )}
                    </div>

                    {/* Topics */}
                    {(session.topics || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(session.topics || []).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                            style={{ background: "rgba(155,85,249,0.1)", color: "#9b55f9", border: "1px solid rgba(155,85,249,0.2)" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mb-3">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {session.durationMinutes} min</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> @{session.tutorUsername}</span>
                    </div>

                    <div className="flex-1" />

                    {/* Price + action */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="text-lg font-mono font-bold flex items-center gap-1" style={{ color: "#ff4db8" }}>
                        <Coins className="h-4 w-4" /> {session.pricePerSession.toLocaleString()}
                        <span className="text-xs text-muted-foreground">SPC</span>
                      </div>

                      {canSeeLink && session.meetLink && videoId ? (
                        <Button size="sm" className="font-mono text-xs font-bold gap-1.5"
                          style={{ background: "linear-gradient(135deg,#ff0000,#cc0000)", border: "none", color: "white" }}
                          onClick={() => setVideoModal({
                            title: session.title,
                            url: session.meetLink!,
                            videoId,
                            startTime: extractStartTime(session.meetLink!),
                          })}>
                          <Play className="h-3 w-3 fill-white" /> VER VIDEO
                        </Button>
                      ) : canSeeLink && session.meetLink ? (
                        <a href={session.meetLink} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="font-mono text-xs font-bold gap-1.5"
                            style={{ background: "linear-gradient(135deg,#9b55f9,#ff4db8)", border: "none", color: "white" }}>
                            <ExternalLink className="h-3 w-3" /> ABRIR ENLACE
                          </Button>
                        </a>
                      ) : (
                        <Button
                          size="sm"
                          disabled={booking === session.id || session.status !== "disponible" || isMySession}
                          onClick={() => bookSession(session)}
                          className="font-mono text-xs font-bold"
                          style={session.status === "disponible" && !isMySession
                            ? { background: "linear-gradient(135deg,rgba(155,85,249,0.3),rgba(255,77,184,0.2))", border: "1px solid rgba(155,85,249,0.5)", color: "#9b55f9" }
                            : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }}>
                          {booking === session.id ? "..." : isMySession ? "TUYA" : session.status === "disponible" ? "RESERVAR" : session.status.toUpperCase()}
                        </Button>
                      )}
                    </div>

                    {/* Meet link for booked / tutor */}
                    {canSeeLink && session.meetLink && (
                      <a href={session.meetLink} target="_blank" rel="noopener noreferrer"
                        className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono rounded-lg px-3 py-1.5 transition-colors"
                        style={{ background: "rgba(155,85,249,0.08)", color: "#9b55f9", border: "1px solid rgba(155,85,249,0.2)" }}>
                        <ExternalLink className="h-3 w-3" />
                        {session.meetLink.length > 48 ? session.meetLink.slice(0, 48) + "…" : session.meetLink}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video player modal */}
      {videoModal && (
        <VideoModal modal={videoModal} onClose={() => setVideoModal(null)} />
      )}

      {/* Create session modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-[0_0_60px_rgba(155,85,249,0.2)]"
            style={{ borderColor: "rgba(155,85,249,0.3)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-mono font-bold text-lg" style={{ color: "#9b55f9" }}>OFRECER TUTORÍA</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">TÍTULO DE LA SESIÓN *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Sesión de Linux Privilege Escalation..."
                  className="w-full px-3 py-2 bg-background border border-secondary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-secondary/50" />
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">DESCRIPCIÓN</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Qué aprenderán, nivel requerido, qué traer..."
                  className="w-full px-3 py-2 bg-background border border-secondary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-secondary/50 resize-none" />
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">TEMAS (separados por coma)</label>
                <input value={form.topics} onChange={e => setForm(f => ({ ...f, topics: e.target.value }))}
                  placeholder="Linux Privesc, Active Directory, Web..."
                  className="w-full px-3 py-2 bg-background border border-secondary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-secondary/50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1 block">DURACIÓN (min)</label>
                  <div className="flex gap-1">
                    {[30, 60, 90, 120].map(d => (
                      <button key={d} onClick={() => setForm(f => ({ ...f, durationMinutes: d }))}
                        className={`flex-1 py-1.5 rounded text-xs font-mono border transition-all
                          ${form.durationMinutes === d ? "border-secondary bg-secondary/20" : "border-secondary/20 text-muted-foreground"}`}
                        style={form.durationMinutes === d ? { color: "#9b55f9", borderColor: "#9b55f9" } : undefined}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1 block">PRECIO (SPC) *</label>
                  <input type="number" min={100} value={form.pricePerSession}
                    onChange={e => setForm(f => ({ ...f, pricePerSession: parseInt(e.target.value) || 500 }))}
                    className="w-full px-3 py-2 bg-background border border-secondary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-secondary/50" />
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">
                    Recibirás: <span className="text-green-400">{Math.floor(form.pricePerSession * 0.9).toLocaleString()} SPC</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-1 block">ENLACE DE VIDEO / REUNIÓN *</label>
                <input value={form.meetLink} onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... o https://meet.google.com/..."
                  className="w-full px-3 py-2 bg-background border border-secondary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-secondary/50" />
                <p className="text-[10px] text-muted-foreground font-mono mt-1">
                  YouTube, Google Meet, Zoom... solo visible para alumnos que reserven o para ti.
                </p>
                {form.meetLink && extractYouTubeId(form.meetLink) && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-secondary/20">
                    <img src={`https://img.youtube.com/vi/${extractYouTubeId(form.meetLink)}/hqdefault.jpg`}
                      alt="preview" className="w-full h-28 object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 font-mono border-secondary/20">
                CANCELAR
              </Button>
              <Button onClick={createSession} className="flex-1 font-mono font-bold gap-2"
                style={{ background: "linear-gradient(135deg,#9b55f9,#ff4db8)", border: "none" }}>
                <Plus className="h-4 w-4" /> PUBLICAR
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
