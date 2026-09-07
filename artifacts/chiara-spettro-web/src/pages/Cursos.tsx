import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen, Clock, Search, Star, Lock, Zap, ShieldCheck, Users,
  ArrowRight, Terminal, Upload, CheckCircle, Crown, Coins,
  Play, Award
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CourseUploadModal } from "@/components/CourseUploadModal";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/LanguageContext";

const BASE = import.meta.env.BASE_URL;

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  category: string;
  instructor: string;
  durationHours: number;
  totalLessons: number;
  price: string | number;
  isFree: boolean;
  isPremium: boolean;
  enrolledCount: number;
  rating: number;
  spcReward: number;
  videoUrl: string | null;
  published: boolean;
}

const LEVEL_COLOR: Record<string, string> = {
  principiante: "#ff4db8",
  intermedio: "#9b55f9",
  avanzado: "#ff6600",
  experto: "#ff0000",
};

const LEVEL_LABEL: Record<string, string> = {
  principiante: "PRINCIPIANTE",
  intermedio: "INTERMEDIO",
  avanzado: "AVANZADO",
  experto: "EXPERTO",
};

const CAT_LABEL: Record<string, string> = {
  general: "General",
  fundamentos: "Fundamentos",
  web: "Hacking Web",
  windows: "Windows/AD",
  redes: "Redes",
  reversing: "Reversing",
  bug_bounty: "Bug Bounty",
  certificacion: "Certificación",
};

const CAT_ICON: Record<string, string> = {
  fundamentos: "🛡️", web: "🌐", windows: "🪟", redes: "🔌",
  reversing: "🔬", bug_bounty: "🐛", certificacion: "🏆", general: "⚡",
};

function CourseCard({ course, enrolled, onEnroll, enrolling, userTier, onNavigate }: {
  course: Course;
  enrolled: boolean;
  onEnroll: (id: number) => void;
  enrolling: boolean;
  userTier: string;
  onNavigate: (id: number) => void;
}) {
  const hex = LEVEL_COLOR[course.level] || "#ff4db8";
  const price = typeof course.price === "string" ? parseFloat(course.price) : course.price;
  const isLocked = course.isPremium && userTier === "libre";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`flex flex-col rounded-xl border bg-[#0d0d14] overflow-hidden group transition-all duration-300 ${isLocked ? "opacity-70" : "hover:shadow-[0_0_25px_rgba(255,77,184,0.07)]"}`}
      style={{ borderColor: isLocked ? "#333" : `${hex}22` }}
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden flex items-center justify-center"
        style={{ background: isLocked ? "linear-gradient(135deg,#111,#1a1a1a)" : `radial-gradient(ellipse at center,${hex}10 0%,#000 80%)` }}>
        <div className="text-6xl font-mono font-black opacity-10 select-none" style={{ color: isLocked ? "#555" : hex }}>
          {CAT_ICON[course.category] || course.title.slice(0, 2).toUpperCase()}
        </div>

        {/* Badges overlay */}
        <div className="absolute inset-0 flex items-start justify-between p-3">
          <Badge className="font-mono text-[10px] font-bold" style={{ backgroundColor: `${hex}20`, color: hex, borderColor: `${hex}40` }}>
            {LEVEL_LABEL[course.level] || course.level.toUpperCase()}
          </Badge>
          <div className="flex gap-1.5">
            {course.isFree && (
              <Badge className="font-mono text-[10px] font-bold bg-green-500/20 text-green-400 border-green-500/40">GRATIS</Badge>
            )}
            {course.isPremium && (
              <Badge className="font-mono text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex items-center gap-1">
                <Crown className="h-2.5 w-2.5"/>ELITE
              </Badge>
            )}
            {!course.isFree && !course.isPremium && price === 0 && (
              <Badge className="font-mono text-[10px] font-bold bg-primary/20 text-primary border-primary/40">LIBRE</Badge>
            )}
          </div>
        </div>

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <Lock className="h-8 w-8 text-yellow-400 mx-auto mb-1"/>
              <span className="font-mono text-xs text-yellow-400 font-bold">SOLO ELITE</span>
            </div>
          </div>
        )}

        {/* Enrolled check */}
        {enrolled && !isLocked && (
          <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-white"/>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[10px] text-muted-foreground">{CAT_LABEL[course.category] || course.category}</span>
          <span className="text-muted-foreground/30">·</span>
          <span className="font-mono text-[10px] text-muted-foreground">{course.instructor}</span>
        </div>
        <h3 className={`font-mono font-bold text-sm mb-2 leading-snug line-clamp-2 ${isLocked ? "text-muted-foreground" : "group-hover:text-primary transition-colors"}`}>
          {course.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1 line-clamp-3">
          {course.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono mb-3">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{course.durationHours}h</span>
          {course.totalLessons > 0 && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3"/>{course.totalLessons} lecciones</span>}
          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400 fill-yellow-400"/>{course.rating.toFixed(1)}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3"/>{course.enrolledCount.toLocaleString()}</span>
        </div>

        {/* SPC reward */}
        <div className="flex items-center gap-1.5 mb-4 font-mono text-[10px] text-primary/70">
          <Coins className="h-3 w-3 text-primary"/><span>+{course.spcReward} SPC al completar</span>
        </div>

        {/* Price + action */}
        <div className="flex items-center justify-between">
          <div className="font-mono font-bold text-lg" style={{ color: isLocked ? "#f59e0b" : (price === 0 ? "#4ade80" : hex) }}>
            {isLocked ? "🔒 ELITE" : price === 0 ? "GRATIS" : `€${price}`}
          </div>
          {isLocked ? (
            <Link href="/suscripcion">
              <Button size="sm" className="font-mono font-bold text-xs h-8 bg-yellow-500 hover:bg-yellow-400 text-black">
                <Crown className="h-3 w-3 mr-1"/>ELITE
              </Button>
            </Link>
          ) : enrolled ? (
            <Button size="sm"
              onClick={() => onNavigate(course.id)}
              className="font-mono font-bold text-xs h-8 bg-primary text-background hover:bg-primary/90">
              <Play className="h-3 w-3 mr-1 fill-background"/>CONTINUAR
            </Button>
          ) : (
            <Button size="sm" disabled={enrolling} onClick={() => onEnroll(course.id)}
              className="font-mono font-bold text-xs h-8" style={{ backgroundColor: hex, color: "#000" }}>
              {enrolling ? "..." : course.isFree ? <><Play className="h-3 w-3 mr-1"/>COMENZAR</> : <><ArrowRight className="h-3 w-3 mr-1"/>INSCRIBIRME</>}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Cursos() {
  const { user } = useAuth();
  const { t } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("todos");
  const [accessFilter, setAccessFilter] = useState<"todos" | "gratis" | "premium">("todos");
  const [uploadOpen, setUploadOpen] = useState(false);

  const userTier = (user as any)?.subscriptionTier ?? "libre";

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["public-courses"],
    queryFn: () => fetch(`${BASE}api/public/courses`).then(r => r.json()),
  });

  const { data: enrollments = [] } = useQuery<{ courseId: number }[]>({
    queryKey: ["enrollments", user?.id],
    queryFn: () => fetch(`${BASE}api/public/enrollments/${user!.id}`).then(r => r.json()),
    enabled: !!user,
  });

  const enrolledIds = new Set(enrollments.map(e => e.courseId));

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      if (!user) throw new Error("Debes iniciar sesión para inscribirte");
      const r = await fetch(`${BASE}api/public/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: (data, courseId) => {
      qc.invalidateQueries({ queryKey: ["enrollments", user?.id] });
      qc.invalidateQueries({ queryKey: ["public-courses"] });
      qc.invalidateQueries({ queryKey: ["wallet", user?.id] });
      if (data.alreadyEnrolled) {
        navigate(`/cursos/${courseId}`);
      } else {
        toast({ title: "¡Inscripción exitosa!", description: "Iniciando el curso..." });
        navigate(`/cursos/${courseId}`);
      }
    },
    onError: (e: Error) => {
      if (e.message.includes("sesión")) {
        toast({ title: "Acceso denegado", description: "Inicia sesión o regístrate para inscribirte.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    },
  });

  const levels = ["todos", "principiante", "intermedio", "avanzado", "experto"];
  const freeCourses = courses.filter(c => c.isFree);
  const premiumCourses = courses.filter(c => c.isPremium);
  const paidCourses = courses.filter(c => !c.isFree && !c.isPremium);

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q);
    const matchLevel = levelFilter === "todos" || c.level === levelFilter;
    const matchAccess = accessFilter === "todos" || (accessFilter === "gratis" && c.isFree) || (accessFilter === "premium" && c.isPremium);
    return matchSearch && matchLevel && matchAccess;
  });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <PublicNav />

      {/* Hero */}
      <section className="relative py-14 md:py-20 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,77,184,0.06)_0,transparent_60%)] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-xs mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {courses.length} CURSOS DISPONIBLES
            </div>
            <h1 className="text-4xl md:text-6xl font-mono font-bold mb-4 leading-tight">
              Aprende a <span className="text-primary">Hackear</span>.<br />En Español.
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-6">
              Cursos técnicos de ciberseguridad ofensiva con laboratorios reales. Regístrate gratis y empieza hoy.
            </p>

            {/* Access tiers visual */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 font-mono text-xs text-green-400">
                <ShieldCheck className="h-3.5 w-3.5"/>LIBRE — {freeCourses.length} cursos gratis
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 font-mono text-xs text-primary">
                <BookOpen className="h-3.5 w-3.5"/>OPERATIVO — {paidCourses.length} cursos
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 font-mono text-xs text-yellow-400">
                <Crown className="h-3.5 w-3.5"/>ELITE — {premiumCourses.length} cursos exclusivos
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {[
                { icon: Users, label: "3.400+ estudiantes" },
                { icon: Star, label: "4.8/5 valoración" },
                { icon: Award, label: "Certificados incluidos" },
                { icon: Coins, label: "Gana SPC estudiando" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                  <Icon className="h-4 w-4 text-primary" />{label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 py-3 border-b border-border bg-[#0a0a0f]/95 backdrop-blur-md">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cursos..." className="pl-9 font-mono bg-black/50 border-primary/20 h-9" />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {/* Access filter */}
            {(["todos", "gratis", "premium"] as const).map(a => (
              <button key={a} onClick={() => setAccessFilter(a)}
                className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase transition-all ${accessFilter === a ? a === "gratis" ? "bg-green-500 text-black" : a === "premium" ? "bg-yellow-500 text-black" : "bg-primary text-black" : "bg-card border border-border text-muted-foreground hover:border-primary/50"}`}>
                {a === "gratis" ? "🆓 GRATIS" : a === "premium" ? "👑 ELITE" : "TODOS"}
              </button>
            ))}
            <div className="w-px h-5 bg-border/50"/>
            {/* Level filter */}
            {levels.map(l => (
              <button key={l} onClick={() => setLevelFilter(l)}
                className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase transition-all ${levelFilter === l ? "bg-primary text-black" : "bg-card border border-border text-muted-foreground hover:border-primary/50"}`}>
                {l === "todos" ? "NIVEL" : l.slice(0, 3).toUpperCase()}
              </button>
            ))}
            {user && (
              <button onClick={() => setUploadOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] font-bold bg-secondary/10 border border-secondary/40 text-secondary hover:bg-secondary/20 transition-all">
                <Upload className="h-3 w-3" /> SUBIR
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Subscription upsell for libre users */}
      {user && userTier === "libre" && (
        <div className="bg-yellow-500/5 border-b border-yellow-500/20 py-3">
          <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 font-mono text-xs">
              <Crown className="h-4 w-4 text-yellow-400"/>
              <span className="text-yellow-400 font-bold">Plan LIBRE</span>
              <span className="text-muted-foreground">— Acceso a {freeCourses.length} cursos gratuitos. Suscríbete para desbloquear todo.</span>
            </div>
            <Link href="/suscripcion">
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-bold text-xs">
                <Crown className="h-3 w-3 mr-1"/>VER PLANES
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Course Grid */}
      <section className="py-10 flex-1">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="rounded-xl border border-border bg-[#0d0d14] h-80 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground font-mono">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No se encontraron cursos con ese filtro.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  enrolled={enrolledIds.has(course.id)}
                  onEnroll={(id) => enrollMutation.mutate(id)}
                  enrolling={enrollMutation.isPending && enrollMutation.variables === course.id}
                  userTier={userTier}
                  onNavigate={(id) => navigate(`/cursos/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12 border-t border-primary/20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-mono text-2xl font-bold mb-3 text-primary">&gt; ¿Tienes contenido de calidad?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">Publica tu propio curso en SpettroWeb y cobra el 70% de cada venta. Pago mensual automático.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {user ? (
              <Button onClick={() => setUploadOpen(true)} className="font-mono font-bold bg-secondary text-black hover:brightness-110 shadow-[0_0_15px_rgba(155,85,249,0.3)]">
                <Upload className="mr-2 h-4 w-4" /> SUBIR MI CURSO
              </Button>
            ) : (
              <Link href="/trabaja">
                <Button className="font-mono font-bold bg-secondary text-black hover:brightness-110 shadow-[0_0_15px_rgba(155,85,249,0.3)]">
                  <Zap className="mr-2 h-4 w-4" /> CONVIÉRTETE EN INSTRUCTOR
                </Button>
              </Link>
            )}
            <Link href="/wallet">
              <Button variant="outline" className="font-mono font-bold border-primary/40 text-primary">
                <Coins className="mr-2 h-4 w-4" /> MI WALLET SPC
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <CourseUploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
