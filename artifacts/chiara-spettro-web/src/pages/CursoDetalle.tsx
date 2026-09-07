import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/AuthModal";
import { useLang } from "@/contexts/LanguageContext";
import {
  ChevronLeft, Play, CheckCircle, Lock, Clock, BookOpen,
  Star, Users, Coins, ChevronRight, FileText,
  Zap, Crown, Award, AlertCircle, Wifi, BookMarked,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface Course {
  id: number; title: string; description: string; level: string;
  category: string; instructor: string; durationHours: number;
  totalLessons: number; price: string; isFree: boolean; isPremium: boolean;
  enrolledCount: number; rating: number; spcReward: number;
  videoUrl: string | null; published: boolean;
}
interface Lesson {
  id: number; courseId: number; order: number; title: string;
  description: string; videoUrl: string | null;
  videoUrls: Record<string, string>; // { es, en, it, fr, pl, ro, sq }
  duration: number; isFree: boolean; content: string | null;
}
interface LessonProgress {
  lessonId: number; completed: boolean; watchedSeconds: number;
}

const LEVEL_COLOR: Record<string, string> = {
  principiante: "#ff4db8", intermedio: "#9b55f9",
  avanzado: "#ff6600", experto: "#ff0000",
};

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MarkdownContent({ content }: { content: string }) {
  const html = content
    .replace(/^### (.+)$/gm, "<h3 class='text-base font-mono font-bold text-primary mb-2 mt-4'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-lg font-mono font-bold text-foreground mb-3 mt-5'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-xl font-mono font-bold text-primary mb-3 mt-4'>$1</h1>")
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_: string, _lang: string, code: string) =>
      `<pre class='bg-black/60 border border-primary/20 rounded-lg p-4 my-3 overflow-x-auto font-mono text-xs text-green-400 leading-relaxed'><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code class='bg-black/60 text-green-400 font-mono text-xs px-1.5 py-0.5 rounded'>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong class='text-foreground font-bold'>$1</strong>")
    .replace(/^\| (.+)$/gm, "<tr class='border-b border-border/30'><td class='px-3 py-1.5 font-mono text-xs'>$1</td></tr>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 text-sm text-muted-foreground list-disc'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 text-sm text-muted-foreground list-decimal'>$2</li>")
    .replace(/\n\n/g, "<p class='mb-3'></p>");

  return <div className="prose-spettro" dangerouslySetInnerHTML={{ __html: html }} />;
}

function VideoPlayer({ url, onProgress }: { url: string; onProgress?: (secs: number) => void }) {
  const isYoutube = url.includes("youtube.com/embed") || url.includes("youtu.be");

  if (isYoutube) {
    const embedUrl = url.includes("embed") ? url : url.replace("watch?v=", "embed/");
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={`${embedUrl}?rel=0&modestbranding=1&autoplay=0`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lección"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video
        src={url}
        controls
        className="w-full h-full"
        onTimeUpdate={(e) => onProgress?.((e.target as HTMLVideoElement).currentTime)}
      />
    </div>
  );
}

/** Picks the best available video URL for the current language.
 *  Fallback: requested lang → es → en → first available → null */
function resolveVideoUrl(lesson: Lesson, lang: string): string | null {
  const urls = lesson.videoUrls ?? {};
  return urls[lang] ?? urls["es"] ?? urls["en"] ?? Object.values(urls)[0] ?? lesson.videoUrl ?? null;
}

function LessonVideoArea({
  lesson, lang, canWatch, content, comingSoon, videoSpanish,
  onShowAuth, onNavigate, onEnroll, enrollPending,
  isFree, price, enrollLabel, accessFreeLabel, beEliteLabel, enrollFirstLabel,
  user, isLocked,
}: {
  lesson: Lesson; lang: string;
  canWatch: boolean; content: string | null;
  comingSoon: string; videoSpanish: string;
  onShowAuth: () => void; onNavigate: (p: string) => void;
  onEnroll: () => void; enrollPending: boolean;
  isFree: boolean; price: string;
  enrollLabel: string; accessFreeLabel: string; beEliteLabel: string; enrollFirstLabel: string;
  user: boolean; isLocked: boolean;
}) {
  const resolvedUrl = resolveVideoUrl(lesson, lang);
  const availableLangs = Object.keys(lesson.videoUrls ?? {});
  const activeLangCode = lesson.videoUrls?.[lang]
    ? lang
    : lesson.videoUrls?.["es"] ? "es"
    : lesson.videoUrls?.["en"] ? "en"
    : availableLangs[0] ?? null;
  const isLangFallback = !lesson.videoUrls?.[lang] && !!activeLangCode;

  if (!canWatch) {
    return (
      <div className="w-full aspect-video bg-card/30 rounded-xl border border-border/50 flex flex-col items-center justify-center gap-4">
        {!user ? (
          <>
            <Lock className="h-12 w-12 text-primary/40" />
            <p className="font-mono text-muted-foreground text-sm">Inicia sesión para ver esta lección</p>
            <Button onClick={onShowAuth} className="font-mono font-bold bg-primary text-background">
              <Zap className="mr-2 h-4 w-4" /> {accessFreeLabel}
            </Button>
          </>
        ) : isLocked ? (
          <>
            <Crown className="h-12 w-12 text-yellow-400/60" />
            <p className="font-mono text-muted-foreground text-sm">Contenido exclusivo Elite</p>
            <Button onClick={() => onNavigate("/suscripcion")} className="font-mono font-bold bg-yellow-500 text-black">
              <Crown className="mr-2 h-4 w-4" /> {beEliteLabel}
            </Button>
          </>
        ) : (
          <>
            <Lock className="h-12 w-12 text-primary/40" />
            <p className="font-mono text-muted-foreground text-sm">Inscríbete para desbloquear todas las lecciones</p>
            <Button onClick={onEnroll} disabled={enrollPending} className="font-mono font-bold bg-primary text-background">
              <Play className="mr-2 h-4 w-4" />
              {isFree ? enrollFirstLabel : `${enrollLabel} — €${parseFloat(price)}`}
            </Button>
          </>
        )}
      </div>
    );
  }

  if (resolvedUrl) {
    return (
      <div>
        <VideoPlayer url={resolvedUrl} />
        {availableLangs.length > 0 && (
          <div className="flex items-center gap-2 mt-2 px-1 flex-wrap">
            <span className="font-mono text-[10px] text-muted-foreground">IDIOMA:</span>
            {availableLangs.map(lc => (
              <span
                key={lc}
                className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  lc === activeLangCode
                    ? "bg-primary/20 border-primary/60 text-primary font-bold"
                    : "border-border/40 text-muted-foreground/60"
                }`}
              >
                {lc.toUpperCase()}
              </span>
            ))}
            {isLangFallback && (
              <span className="font-mono text-[10px] text-muted-foreground/50 ml-1">
                ({videoSpanish})
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-primary/20 bg-[#0d0d14] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40 bg-primary/5">
        <BookMarked className="h-4 w-4 text-primary" />
        <span className="font-mono text-xs font-bold text-primary tracking-widest">CONTENIDO DE LA LECCIÓN</span>
      </div>
      {content ? (
        <div className="p-5 max-h-[480px] overflow-y-auto">
          <MarkdownContent content={content} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <FileText className="h-10 w-10 opacity-20" />
          <p className="font-mono text-sm">{comingSoon}</p>
        </div>
      )}
    </div>
  );
}

export default function CursoDetalle() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id ?? "0");
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [tab, setTab] = useState<"video" | "notas">("video");
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { data: course, isLoading: loadingCourse } = useQuery<Course>({
    queryKey: ["course", courseId],
    queryFn: () => fetch(`${BASE}api/public/courses/${courseId}`).then(r => r.json()),
    enabled: !!courseId,
  });

  const { data: lessons = [], isLoading: loadingLessons } = useQuery<Lesson[]>({
    queryKey: ["course-lessons", courseId],
    queryFn: () => fetch(`${BASE}api/public/courses/${courseId}/lessons`).then(r => r.json()),
    enabled: !!courseId,
  });

  const { data: enrollments = [] } = useQuery<{ courseId: number; progress: number; completed: boolean }[]>({
    queryKey: ["enrollments", user?.id],
    queryFn: () => fetch(`${BASE}api/public/enrollments/${user!.id}`).then(r => r.json()),
    enabled: !!user,
  });

  const { data: progressList = [] } = useQuery<LessonProgress[]>({
    queryKey: ["lesson-progress", courseId, user?.id],
    queryFn: () => fetch(`${BASE}api/public/courses/${courseId}/progress/${user!.id}`).then(r => r.json()),
    enabled: !!user && !!courseId,
  });

  const enrollment = enrollments.find(e => e.courseId === courseId);
  const isEnrolled = !!enrollment;
  const userTier = (user as any)?.subscriptionTier ?? "libre";
  const isLocked = !!(course?.isPremium && userTier === "libre");

  const completedIds = new Set(progressList.filter(p => p.completed).map(p => p.lessonId));
  const completedCount = completedIds.size;
  const totalCount = lessons.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Auto-select first lesson
  useEffect(() => {
    if (lessons.length > 0 && !activeLesson) {
      const first = lessons[0];
      setActiveLesson(first);
    }
  }, [lessons]);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("login");
      const r = await fetch(`${BASE}api/public/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments", user?.id] });
      toast({ title: "¡Inscripción exitosa!", description: "Ya puedes ver todas las lecciones. ¡Suerte, hacker!" });
    },
    onError: (e: Error) => {
      if (e.message === "login") { setShowAuth(true); return; }
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      if (!user) throw new Error("no user");
      const r = await fetch(`${BASE}api/public/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, courseId }),
      });
      return r.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["lesson-progress", courseId, user?.id] });
      qc.invalidateQueries({ queryKey: ["enrollments", user?.id] });
      if (data.courseCompleted) {
        toast({
          title: `🏆 ¡CURSO COMPLETADO!`,
          description: `+${data.spcEarned} SPC añadidos a tu wallet. ¡Eres una crack!`,
        });
        qc.invalidateQueries({ queryKey: ["wallet", user?.id] });
      } else {
        toast({ title: "✅ Lección completada", description: "Progreso guardado." });
      }
    },
  });

  const canWatch = (lesson: Lesson) => {
    if (lesson.isFree) return true;
    if (!user) return false;
    if (isLocked) return false;
    return isEnrolled;
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!canWatch(lesson)) {
      if (!user) { setShowAuth(true); return; }
      if (isLocked) { navigate("/suscripcion"); return; }
      enrollMutation.mutate();
      return;
    }
    setActiveLesson(lesson);
    setTab("video");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (!activeLesson) return;
    const idx = lessons.findIndex(l => l.id === activeLesson.id);
    if (idx < lessons.length - 1) handleLessonClick(lessons[idx + 1]);
  };

  const levelHex = LEVEL_COLOR[course?.level ?? "principiante"] ?? "#ff4db8";

  if (loadingCourse) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono">
          <AlertCircle className="h-6 w-6 mr-2" /> Curso no encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <PublicNav />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialTab="register" />

      {/* Top bar */}
      <div className="border-b border-border/50 bg-card/20 backdrop-blur-sm sticky top-16 z-30">
        <div className="container mx-auto px-4 py-2 flex items-center gap-4">
          <button onClick={() => navigate("/cursos")} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> CURSOS
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-mono font-bold text-sm truncate">{course.title}</p>
          </div>
          {/* Progress bar */}
          {isEnrolled && (
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="font-mono text-xs text-primary">{progressPct}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 container mx-auto px-4 py-6 gap-6 max-w-7xl">

        {/* ── LEFT: Video + content ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Video area */}
          {activeLesson ? (
            <LessonVideoArea
              lesson={activeLesson}
              lang={lang}
              canWatch={canWatch(activeLesson)}
              content={activeLesson.content}
              comingSoon={t.courses.comingSoon}
              videoSpanish={t.courses.videoSpanish}
              onShowAuth={() => setShowAuth(true)}
              onNavigate={navigate}
              onEnroll={() => enrollMutation.mutate()}
              enrollPending={enrollMutation.isPending}
              isFree={course.isFree}
              price={course.price}
              enrollLabel={t.courses.enroll}
              accessFreeLabel={t.courses.accessFree}
              beEliteLabel={t.courses.beElite}
              enrollFirstLabel={t.courses.enrollFirst}
              user={!!user}
              isLocked={isLocked}
            />
          ) : (
            <div className="w-full aspect-video bg-card/30 rounded-xl border border-border/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/50">
            {(["video", "notas"] as const).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest border-b-2 transition-all -mb-px ${tab === tabKey ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tabKey === "video" ? <><Play className="inline h-3 w-3 mr-1" />{t.courses.lesson}</> : <><FileText className="inline h-3 w-3 mr-1" />{t.courses.notes}</>}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "video" && activeLesson && (
              <motion.div key="video-info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">LECCIÓN {activeLesson.order}</span>
                      <span className="font-mono text-xs text-muted-foreground">·</span>
                      <span className="font-mono text-xs text-muted-foreground">{fmtDuration(activeLesson.duration)}</span>
                      {activeLesson.isFree && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">PREVIEW</span>
                      )}
                    </div>
                    <h2 className="text-xl font-mono font-bold text-foreground">{activeLesson.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{activeLesson.description}</p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {isEnrolled && !completedIds.has(activeLesson.id) && (
                      <Button
                        size="sm"
                        onClick={() => completeMutation.mutate(activeLesson.id)}
                        disabled={completeMutation.isPending}
                        className="font-mono text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        {completeMutation.isPending ? "..." : t.courses.markDone}
                      </Button>
                    )}
                    {completedIds.has(activeLesson.id) && (
                      <span className="flex items-center gap-1.5 text-xs font-mono text-green-400 font-bold px-3 py-1.5 rounded bg-green-500/10 border border-green-500/20">
                        <CheckCircle className="h-3.5 w-3.5" /> {t.courses.completed.toUpperCase()}
                      </span>
                    )}
                    <Button size="sm" onClick={handleNext} variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                      {t.courses.next} <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "notas" && activeLesson && (
              <motion.div key="notas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {activeLesson.content ? (
                  <div className="rounded-xl border border-border/50 bg-card/20 p-5">
                    <MarkdownContent content={activeLesson.content} />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground font-mono text-sm">
                    <FileText className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    No hay notas para esta lección.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Course info (collapsed on mobile) */}
          <div className="rounded-xl border border-border/50 bg-card/20 p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: levelHex }} />
                <span className="font-mono text-xs font-bold uppercase" style={{ color: levelHex }}>{course.level}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <Clock className="h-3 w-3" />{course.durationHours}h
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <BookOpen className="h-3 w-3" />{totalCount} lecciones
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />{course.rating.toFixed(1)}
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <Users className="h-3 w-3" />{course.enrolledCount.toLocaleString()} {t.courses.students}
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-primary/80">
                <Coins className="h-3 w-3 text-primary" />+{course.spcReward} {t.courses.spcOnComplete}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{course.description}</p>
          </div>
        </div>

        {/* ── RIGHT: Lesson sidebar ── */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0" ref={sidebarRef}>
          <div className="lg:sticky lg:top-32 space-y-3">

            {/* Enroll CTA (if not enrolled) */}
            {!isEnrolled && (
              <div className="rounded-xl border p-4 space-y-3 bg-card/30" style={{ borderColor: `${levelHex}30` }}>
                <div className="font-mono font-black text-2xl" style={{ color: course.isFree ? "#4ade80" : levelHex }}>
                  {course.isFree ? "GRATIS" : `€${parseFloat(course.price)}`}
                </div>
                {isLocked ? (
                  <Button className="w-full font-mono font-bold bg-yellow-500 text-black hover:bg-yellow-400" onClick={() => navigate("/suscripcion")}>
                    <Crown className="mr-2 h-4 w-4" /> SUSCRIPCIÓN ELITE
                  </Button>
                ) : (
                  <Button className="w-full font-mono font-bold h-11" style={{ backgroundColor: levelHex, color: "#000" }}
                    disabled={enrollMutation.isPending} onClick={() => user ? enrollMutation.mutate() : setShowAuth(true)}>
                    {enrollMutation.isPending ? "..." : course.isFree ? <><Play className="mr-2 h-4 w-4 fill-black" />COMENZAR GRATIS</> : <><Zap className="mr-2 h-4 w-4" />INSCRIBIRME</>}
                  </Button>
                )}
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <Award className="h-3 w-3 text-primary" /> {t.courses.certIncluded} · +{course.spcReward} SPC
                </div>
              </div>
            )}

            {/* Progress card (if enrolled) */}
            {isEnrolled && (
              <div className="rounded-xl border border-primary/20 p-4 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-primary font-bold">{t.courses.yourProgress}</span>
                  <span className="text-primary font-bold">{progressPct}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {completedCount} / {totalCount} {t.courses.lessons} {t.courses.completed}
                </div>
                {progressPct === 100 && (
                  <div className="flex items-center gap-2 text-xs font-mono text-green-400 font-bold pt-1">
                    <Award className="h-4 w-4" /> {t.courses.courseCompleted}
                  </div>
                )}
              </div>
            )}

            {/* Lesson list */}
            <div className="rounded-xl border border-border/50 bg-card/20 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground">LECCIONES ({totalCount})</span>
                <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                  <Wifi className="h-3 w-3 text-green-400" /> {t.courses.online}
                </div>
              </div>

              {loadingLessons ? (
                <div className="p-4 space-y-2">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-border/20 rounded animate-pulse" />)}
                </div>
              ) : (
                <div className="divide-y divide-border/30 max-h-[60vh] overflow-y-auto">
                  {lessons.map((lesson) => {
                    const active = activeLesson?.id === lesson.id;
                    const done = completedIds.has(lesson.id);
                    const accessible = canWatch(lesson);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all hover:bg-card/40 ${active ? "bg-primary/10 border-l-2 border-primary" : ""}`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {done ? (
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <CheckCircle className="h-3.5 w-3.5 text-white" />
                            </div>
                          ) : accessible ? (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${active ? "bg-primary" : "bg-card border border-border"}`}>
                              <Play className={`h-3 w-3 ${active ? "text-black fill-black" : "text-muted-foreground"}`} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center">
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`font-mono text-xs leading-tight line-clamp-2 ${active ? "text-primary font-bold" : done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                              {lesson.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground">{fmtDuration(lesson.duration)}</span>
                            {lesson.isFree && !isEnrolled && (
                              <span className="font-mono text-[9px] font-bold px-1 rounded bg-green-500/20 text-green-400">PREVIEW</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
