import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, GraduationCap, BookOpen, Plus, Trash2, X, Clock, FileText,
  ClipboardList, CheckCircle2, Eye, Lock, ChevronRight, RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const BASE = import.meta.env.BASE_URL;
const PINK = "#ff4db8";
const PURPLE = "#9b55f9";

async function api<T = unknown>(path: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch(BASE + "api/instructor" + path, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error || "Error");
  return d as T;
}

interface Course { id: number; title: string; description: string; level: string; category: string; price: string; durationHours: number; totalLessons: number; videoUrl: string | null; published: boolean }
interface Lesson { id: number; order: number; title: string; videoUrl: string | null; content: string | null; duration: number; isFree: boolean }
interface Exam { id: number; title: string; passScore: number }
interface Question { id: number; question: string; options: string[]; correctIndex: number }

const inp = "w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2.5 text-sm font-mono text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors";
const lbl = "block font-mono text-[10px] text-muted-foreground tracking-widest uppercase mb-1.5";
const gradient = { background: "linear-gradient(135deg, " + PINK + ", " + PURPLE + ")", boxShadow: "0 0 20px rgba(255,77,184,0.25)" };
const ghostBtn = "rounded-lg border border-white/10 px-3 py-2 font-mono text-xs text-muted-foreground hover:text-white hover:border-white/25 transition-colors";
const dangerBtn = "rounded-md p-1.5 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-colors";

const priceLabel = (c: Course) => (Number(c.price) > 0 ? c.price + " €" : "GRATIS");

function Spinner() {
  return <RotateCcw className="h-3.5 w-3.5 animate-spin" />;
}

// ─── Modal: nuevo curso ──────────────────────────────────────────────────────
function NewCourseModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (c: Course) => void }) {
  const empty = { title: "", description: "", level: "principiante", category: "general", price: "0", durationHours: "1", videoUrl: "" };
  const [f, setF] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (open) { setF(empty); setErr(""); } }, [open]);

  const submit = async () => {
    if (!f.title.trim()) { setErr("Ponle un título al curso."); return; }
    setSaving(true); setErr("");
    try {
      const c = await api<Course>("/courses", "POST", {
        title: f.title.trim(), description: f.description.trim(), level: f.level, category: f.category.trim() || "general",
        price: Number(f.price) || 0, durationHours: Number(f.durationHours) || 0, videoUrl: f.videoUrl.trim(),
      });
      onCreated(c);
    } catch (e) { setErr((e as Error).message); }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="w-full max-w-xl max-h-[92dvh] overflow-y-auto bg-[#06060f] border border-primary/30 rounded-2xl"
            style={{ boxShadow: "0 0 60px rgba(255,77,184,0.12)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h2 className="font-mono font-bold text-primary text-sm tracking-widest">&gt; NUEVO_CURSO</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-white p-1 rounded hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={lbl}>Título *</label>
                <input className={inp} value={f.title} maxLength={120} autoFocus placeholder="Ej: Hacking web desde cero" onChange={(e) => setF({ ...f, title: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Descripción</label>
                <textarea className={inp + " h-24 resize-none"} value={f.description} placeholder="¿Qué van a aprender tus alumnos?" onChange={(e) => setF({ ...f, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Nivel</label>
                  <select className={inp} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
                    <option value="principiante">principiante</option><option value="intermedio">intermedio</option>
                    <option value="avanzado">avanzado</option><option value="experto">experto</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Categoría</label>
                  <input className={inp} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>Precio (€, 0 = gratis)</label>
                  <input className={inp} type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>Duración (horas)</label>
                  <input className={inp} type="number" min={0} value={f.durationHours} onChange={(e) => setF({ ...f, durationHours: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={lbl}>Video de presentación (opcional)</label>
                <input className={inp} value={f.videoUrl} placeholder="https://youtube.com/watch?v=…" onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
              </div>
              {err && <p className="font-mono text-xs text-red-400">{err}</p>}
              <p className="font-mono text-[10px] text-muted-foreground/60">Tu curso quedará pendiente hasta que el administrador lo publique.</p>
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className={ghostBtn + " flex-1"}>CANCELAR</button>
                <button onClick={submit} disabled={saving} style={gradient}
                  className="flex-1 rounded-lg py-2.5 font-mono text-xs font-bold text-black disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Spinner /> : <Plus className="h-3.5 w-3.5" />} CREAR CURSO
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Pestaña: lecciones ──────────────────────────────────────────────────────
function LessonsTab({ course, onChange }: { course: Course; onChange: () => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState<Lesson[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [f, setF] = useState({ title: "", videoUrl: "", content: "", minutes: "10", isFree: false });
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(() => {
    api<Lesson[]>("/courses/" + course.id + "/lessons").then(setItems)
      .catch((e) => toast({ title: "No se pudieron cargar las lecciones", description: e.message, variant: "destructive" }));
  }, [course.id]);
  useEffect(() => { setPreview(null); setAdding(false); load(); }, [load]);

  const add = async () => {
    if (!f.title.trim()) { toast({ title: "Falta el título del tema", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await api(editId ? "/lessons/" + editId : "/courses/" + course.id + "/lessons", editId ? "PATCH" : "POST", {
        title: f.title.trim(), videoUrl: f.videoUrl.trim(), content: f.content,
        durationMinutes: Number(f.minutes) || 0, isFree: f.isFree,
      });
      setF({ title: "", videoUrl: "", content: "", minutes: "10", isFree: false });
      setEditId(null);
      setAdding(false);
      load(); onChange();
      toast({ title: editId ? "✓ Tema actualizado" : "✓ Tema añadido" });
    } catch (e) { toast({ title: "No se pudo añadir", description: (e as Error).message, variant: "destructive" }); }
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!window.confirm("¿Borrar este tema?")) return;
    try { await api("/lessons/" + id, "DELETE"); load(); onChange(); }
    catch (e) { toast({ title: "No se pudo borrar", description: (e as Error).message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">{items.length} {items.length === 1 ? "tema" : "temas"}</p>
        <button onClick={() => { if (adding) { setEditId(null); setF({ title: "", videoUrl: "", content: "", minutes: "10", isFree: false }); } setAdding((v) => !v); }} style={gradient}
          className="rounded-lg px-3 py-2 font-mono text-xs font-bold text-black flex items-center gap-1.5">
          {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {adding ? "CERRAR" : "NUEVO TEMA"}
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="rounded-xl border border-primary/20 bg-black/40 p-4 space-y-3">
              <div>
                <label className={lbl}>{editId ? "Editando tema" : "Título del tema"} *</label>
                <input className={inp} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Enlace del video o del informe</label>
                <input className={inp} value={f.videoUrl} placeholder="https://…" onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Notas del tema</label>
                <textarea className={inp + " h-24 resize-none"} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <input className={inp + " w-24"} type="number" min={0} value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} />
                  <span className="font-mono text-xs text-muted-foreground">minutos</span>
                </div>
                <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={f.isFree} onChange={(e) => setF({ ...f, isFree: e.target.checked })} /> Vista previa gratis
                </label>
                <button onClick={add} disabled={saving} style={gradient}
                  className="ml-auto rounded-lg px-4 py-2 font-mono text-xs font-bold text-black disabled:opacity-50 flex items-center gap-2">
                  {saving && <Spinner />} {editId ? "GUARDAR CAMBIOS" : "GUARDAR TEMA"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="font-mono text-xs text-muted-foreground">Este curso aún no tiene temas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((l) => {
            const embed = !!l.videoUrl && l.videoUrl.includes("youtube.com/embed");
            return (
              <div key={l.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center font-mono text-xs font-bold"
                    style={{ background: PINK + "18", color: PINK, border: "1px solid " + PINK + "40" }}>{l.order}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm text-white truncate">{l.title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-2">
                      <Clock className="h-2.5 w-2.5" /> {Math.round(l.duration / 60)} min
                      {l.isFree ? <span className="text-green-400">· gratis</span> : <span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> de pago</span>}
                    </p>
                  </div>
                  {l.videoUrl && (
                    embed
                      ? <button onClick={() => setPreview(preview === l.id ? null : l.id)} className={ghostBtn + " flex items-center gap-1.5"}><Eye className="h-3.5 w-3.5" /> Ver</button>
                      : <a href={l.videoUrl} target="_blank" rel="noopener noreferrer" className={ghostBtn + " flex items-center gap-1.5"}><FileText className="h-3.5 w-3.5" /> Abrir</a>
                  )}
                  <button
                    onClick={() => { setEditId(l.id); setF({ title: l.title, videoUrl: l.videoUrl || "", content: l.content || "", minutes: String(Math.round(l.duration / 60)), isFree: l.isFree }); setAdding(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={ghostBtn + " flex items-center gap-1.5"} title="Editar"><FileText className="h-3.5 w-3.5" /> Editar</button>
                  <button onClick={() => remove(l.id)} className={dangerBtn} title="Borrar"><Trash2 className="h-4 w-4" /></button>
                </div>
                {embed && preview === l.id && (
                  <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg border border-white/10">
                    <iframe src={l.videoUrl as string} title={l.title} className="h-full w-full" allowFullScreen />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Pestaña: exámenes ───────────────────────────────────────────────────────
function ExamsTab({ course }: { course: Course }) {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [qs, setQs] = useState<Question[]>([]);
  const [ef, setEf] = useState({ title: "", passScore: "60" });
  const [qf, setQf] = useState({ question: "", o: ["", "", "", ""], correct: 0 });

  const fail = (title: string, e: unknown) => toast({ title, description: (e as Error).message, variant: "destructive" });

  const loadExams = useCallback(() => {
    api<Exam[]>("/courses/" + course.id + "/exams").then(setExams).catch((e) => fail("No se pudieron cargar los exámenes", e));
  }, [course.id]);
  const loadQs = useCallback(() => {
    if (sel) api<Question[]>("/exams/" + sel + "/questions").then(setQs).catch((e) => fail("No se pudieron cargar las preguntas", e));
    else setQs([]);
  }, [sel]);
  useEffect(() => { setSel(null); loadExams(); }, [loadExams]);
  useEffect(() => { loadQs(); }, [loadQs]);

  const addExam = async () => {
    if (!ef.title.trim()) { toast({ title: "Falta el título del examen", variant: "destructive" }); return; }
    try {
      await api("/courses/" + course.id + "/exams", "POST", { title: ef.title.trim(), passScore: Number(ef.passScore) || 60 });
      setEf({ title: "", passScore: "60" });
      loadExams();
      toast({ title: "✓ Examen creado" });
    } catch (e) { fail("No se pudo crear", e); }
  };
  const delExam = async (id: number) => {
    if (!window.confirm("¿Borrar el examen y todas sus preguntas?")) return;
    try { await api("/exams/" + id, "DELETE"); if (sel === id) setSel(null); loadExams(); } catch (e) { fail("No se pudo borrar", e); }
  };
  const addQ = async () => {
    if (!sel) return;
    const filled = qf.o.map((t, i) => ({ t: t.trim(), i })).filter((x) => x.t);
    if (!qf.question.trim()) { toast({ title: "Escribe la pregunta", variant: "destructive" }); return; }
    if (filled.length < 2) { toast({ title: "Pon al menos 2 opciones", variant: "destructive" }); return; }
    const correctIndex = filled.findIndex((x) => x.i === qf.correct);
    if (correctIndex < 0) { toast({ title: "Marca como correcta una opción que no esté vacía", variant: "destructive" }); return; }
    try {
      await api("/exams/" + sel + "/questions", "POST", { question: qf.question.trim(), options: filled.map((x) => x.t), correctIndex });
      setQf({ question: "", o: ["", "", "", ""], correct: 0 });
      loadQs();
    } catch (e) { fail("No se pudo añadir la pregunta", e); }
  };
  const delQ = async (id: number) => {
    try { await api("/questions/" + id, "DELETE"); loadQs(); } catch (e) { fail("No se pudo borrar", e); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-black/40 p-4 space-y-3">
        <p className={lbl + " mb-0"}>Nuevo examen</p>
        <div className="flex gap-2 flex-wrap">
          <input className={inp + " flex-1 min-w-[180px]"} placeholder="Título del examen" value={ef.title} onChange={(e) => setEf({ ...ef, title: e.target.value })} />
          <input className={inp + " w-24"} type="number" min={1} max={100} value={ef.passScore} onChange={(e) => setEf({ ...ef, passScore: e.target.value })} title="Nota mínima (%)" />
          <button onClick={addExam} style={gradient} className="rounded-lg px-4 font-mono text-xs font-bold text-black flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> CREAR</button>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground/60">El número es la nota mínima para aprobar (%).</p>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="font-mono text-xs text-muted-foreground">Este curso aún no tiene exámenes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exams.map((x) => (
            <div key={x.id} onClick={() => setSel(x.id)}
              className="flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-colors"
              style={{ borderColor: sel === x.id ? PINK + "80" : "rgba(255,255,255,0.08)", background: sel === x.id ? PINK + "0d" : "rgba(255,255,255,0.02)" }}>
              <p className="font-mono text-sm text-white">{x.title} <span className="text-[10px] text-muted-foreground">· aprueba con {x.passScore}%</span></p>
              <button onClick={(e) => { e.stopPropagation(); delExam(x.id); }} className={dangerBtn}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      {sel && (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
          <p className={lbl + " mb-0"}>Preguntas del examen</p>
          {qs.map((q, i) => (
            <div key={q.id} className="rounded-lg border border-white/8 bg-black/30 p-3 space-y-1.5">
              <div className="flex justify-between gap-2">
                <p className="font-mono text-xs text-white">{i + 1}. {q.question}</p>
                <button onClick={() => delQ(q.id)} className={dangerBtn}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {q.options.map((o, j) => (
                <p key={j} className={"font-mono text-[11px] flex items-center gap-1.5 " + (j === q.correctIndex ? "text-green-400" : "text-muted-foreground")}>
                  {j === q.correctIndex ? <CheckCircle2 className="h-3 w-3" /> : <span className="w-3 text-center">·</span>} {o}
                </p>
              ))}
            </div>
          ))}
          <div className="rounded-lg border border-primary/20 bg-black/40 p-3 space-y-2">
            <input className={inp} placeholder="Escribe la pregunta" value={qf.question} onChange={(e) => setQf({ ...qf, question: e.target.value })} />
            {qf.o.map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={qf.correct === i} onChange={() => setQf({ ...qf, correct: i })} title="Respuesta correcta" />
                <input className={inp} placeholder={"Opción " + (i + 1)} value={val}
                  onChange={(e) => { const o = [...qf.o]; o[i] = e.target.value; setQf({ ...qf, o }); }} />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground/60">Marca el círculo de la respuesta correcta.</span>
              <button onClick={addQ} style={gradient} className="rounded-lg px-3 py-2 font-mono text-xs font-bold text-black">AÑADIR PREGUNTA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
interface StudentRow {
  userId: number; username: string; enrolledAt: string; progress: number; completed: boolean;
  tier: string; expiresAt: string | null; subActive: boolean;
  paid: number | null; net: number | null; paidAt: string | null;
}
interface StudentsData { summary: { total: number; completed: number; gross: number; net: number }; students: StudentRow[] }

const eur = (n: number) => n.toFixed(2).replace(".", ",") + " €";
const day = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

function StudentsTab({ course }: { course: Course }) {
  const [data, setData] = useState<StudentsData | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setData(null); setErr("");
    api<StudentsData>("/courses/" + course.id + "/students").then(setData).catch((e) => setErr(e.message));
  }, [course.id]);

  if (err) return <p className="font-mono text-xs text-red-400">{err}</p>;
  if (!data) return <div className="p-6 flex justify-center"><Spinner /></div>;

  const kpis = [
    { label: "ALUMNOS", value: String(data.summary.total) },
    { label: "COMPLETARON", value: String(data.summary.completed) },
    { label: "COBRADO", value: eur(data.summary.gross) },
    { label: "TU PARTE (80%)", value: eur(data.summary.net) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="font-mono text-base font-bold text-white">{k.value}</p>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest">{k.label}</p>
          </div>
        ))}
      </div>

      {data.students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
          <GraduationCap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="font-mono text-xs text-muted-foreground">Todavía no hay alumnos en este curso.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.students.map((s) => (
            <div key={s.userId} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="font-mono text-sm font-bold text-white">{s.username}</p>
                <div className="flex items-center gap-2">
                  {s.completed && <Badge variant="outline" className="border-green-500/30 text-green-400">completado</Badge>}
                  <Badge variant="outline" className={s.subActive ? "border-purple-500/40 text-purple-300" : ""}>
                    {s.tier}{s.subActive && s.expiresAt ? " · hasta " + day(s.expiresAt) : s.tier !== "libre" ? " · vencida" : ""}
                  </Badge>
                </div>
              </div>
              <div className="h-1.5 w-full rounded bg-white/5 overflow-hidden">
                <div className="h-full" style={{ width: Math.min(100, s.progress) + "%", background: "linear-gradient(90deg, " + PINK + ", " + PURPLE + ")" }} />
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap font-mono text-[10px] text-muted-foreground">
                <span>Inscrito {day(s.enrolledAt)} · progreso {s.progress}%</span>
                {s.paid !== null && s.net !== null
                  ? <span className="text-green-400">pagó {eur(s.paid)} · tú recibes {eur(s.net)} · {day(s.paidAt as string)}</span>
                  : <span>sin registro de pago</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Instructor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [me, setMe] = useState<{ loggedIn: boolean; isInstructor: boolean; username: string | null } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selId, setSelId] = useState<number | null>(null);
  const [tab, setTab] = useState<"lessons" | "exams" | "students">("lessons");
  const [modalOpen, setModalOpen] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try { setCourses(await api<Course[]>("/courses")); }
    catch (e) { toast({ title: "No se pudieron cargar los cursos", description: (e as Error).message, variant: "destructive" }); }
    setLoadingCourses(false);
  }, []);

  useEffect(() => {
    api<{ loggedIn: boolean; isInstructor: boolean; username: string | null }>("/me")
      .then((m) => { setMe(m); if (m.isInstructor) loadCourses(); })
      .catch(() => setMe({ loggedIn: false, isInstructor: false, username: null }));
  }, [loadCourses]);

  const removeCourse = async (c: Course) => {
    if (!window.confirm("¿Borrar «" + c.title + "» con todos sus temas y exámenes?")) return;
    try {
      await api("/courses/" + c.id, "DELETE");
      if (selId === c.id) setSelId(null);
      loadCourses();
      toast({ title: "Curso borrado" });
    } catch (e) { toast({ title: "No se pudo borrar", description: (e as Error).message, variant: "destructive" }); }
  };

  const Breadcrumb = (
    <nav className="px-4 py-3 border-b border-white/5">
      <div className="container mx-auto max-w-6xl flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Terminal className="h-3 w-3 text-primary" />
        <Link href="/" className="hover:text-primary transition-colors">inicio</Link>
        <span>/</span><span>profesor</span>
      </div>
    </nav>
  );

  if (!me) return <div className="min-h-[100dvh] bg-background p-10 text-center font-mono text-sm text-muted-foreground">Cargando…</div>;

  if (!me.loggedIn || !me.isInstructor) {
    return (
      <div className="min-h-[100dvh] bg-background">
        {Breadcrumb}
        <div className="max-w-md mx-auto mt-16 rounded-2xl border border-white/10 bg-[#06060f] p-8 text-center space-y-4">
          <GraduationCap className="h-10 w-10 mx-auto" style={{ color: PURPLE }} />
          <h1 className="font-mono text-lg font-bold text-white">Panel del profesor</h1>
          {!me.loggedIn ? (
            <>
              <p className="font-mono text-xs text-muted-foreground">Inicia sesión para entrar.</p>
              <Link href="/login" className="inline-block rounded-lg px-5 py-2.5 font-mono text-xs font-bold text-black" style={gradient}>IR AL LOGIN</Link>
            </>
          ) : (
            <>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">Tu cuenta aún no tiene permisos de profesor. El administrador es quien los concede tras revisar tu solicitud.</p>
              <Link href="/trabaja" className="inline-block rounded-lg px-5 py-2.5 font-mono text-xs font-bold text-black" style={gradient}>ENVIAR SOLICITUD</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const sel = courses.find((c) => c.id === selId) || null;
  const published = courses.filter((c) => c.published).length;
  const totalLessons = courses.reduce((n, c) => n + (c.totalLessons || 0), 0);
  const stats = [
    { label: "CURSOS", value: courses.length, color: PINK, icon: <BookOpen className="h-4 w-4" /> },
    { label: "PUBLICADOS", value: published, color: "#34d399", icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: "PENDIENTES", value: courses.length - published, color: "#f59e0b", icon: <Clock className="h-4 w-4" /> },
    { label: "TEMAS", value: totalLessons, color: PURPLE, icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans pb-20 bg-background">
      {Breadcrumb}
      <main className="container mx-auto px-4 pt-8 max-w-6xl space-y-6">

        {/* Cabecera */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative p-6 rounded-2xl border border-white/10 bg-[#06060f] overflow-hidden"
          style={{ boxShadow: "0 0 80px " + PURPLE + "10" }}>
          <div className="absolute top-0 right-0 w-[420px] h-[420px] pointer-events-none -translate-y-1/2 translate-x-1/4 rounded-full blur-[110px]"
            style={{ background: "radial-gradient(circle, " + PURPLE + "22 0%, transparent 70%)" }} />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 flex items-center justify-center bg-black/60 shrink-0"
              style={{ borderColor: PURPLE, boxShadow: "0 0 20px " + PURPLE + "50" }}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : <GraduationCap className="h-7 w-7" style={{ color: PURPLE }} />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-mono text-[10px] font-bold tracking-widest px-2.5 py-1 rounded border"
                style={{ color: PURPLE, borderColor: PURPLE + "50", background: PURPLE + "12" }}>◈ PROFESOR</span>
              <h1 className="mt-2 font-mono text-2xl md:text-3xl font-bold text-white truncate">{me.username}</h1>
              <p className="font-mono text-xs text-muted-foreground mt-1">Tus cursos quedan pendientes hasta que el administrador los publique.</p>
            </div>
            <button onClick={() => setModalOpen(true)} style={gradient}
              className="rounded-lg px-5 py-3 font-mono text-xs font-bold text-black flex items-center justify-center gap-2 shrink-0">
              <Plus className="h-4 w-4" /> NUEVO CURSO
            </button>
          </div>
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="p-2 rounded-lg" style={{ background: s.color + "15", color: s.color }}>{s.icon}</div>
                <div>
                  <div className="font-mono text-xl font-bold text-white leading-none">{s.value}</div>
                  <div className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lista de cursos */}
          <section className="lg:col-span-1 space-y-3">
            <h2 className="text-base font-mono font-bold text-primary flex items-center gap-2"><span className="text-secondary">&gt;</span> MIS_CURSOS</h2>
            {loadingCourses && courses.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">Cargando cursos…</p>
            ) : courses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="font-mono text-xs text-muted-foreground mb-3">Aún no tienes cursos.</p>
                <button onClick={() => setModalOpen(true)} style={gradient} className="rounded-lg px-4 py-2 font-mono text-xs font-bold text-black">CREAR EL PRIMERO</button>
              </div>
            ) : (
              courses.map((c) => (
                <div key={c.id} onClick={() => { setSelId(c.id); setTab("lessons"); }}
                  className="rounded-xl border p-4 cursor-pointer transition-all"
                  style={{
                    borderColor: selId === c.id ? PINK + "80" : "rgba(255,255,255,0.08)",
                    background: selId === c.id ? PINK + "0d" : "#06060f",
                    boxShadow: selId === c.id ? "0 0 24px " + PINK + "18" : "none",
                  }}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-mono text-sm font-bold text-white leading-tight">{c.title}</h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">{c.level} · {c.totalLessons} temas · {priceLabel(c)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className={c.published ? "border-green-500/30 text-green-400 font-mono text-[10px]" : "border-amber-500/30 text-amber-400 font-mono text-[10px]"}>
                      {c.published ? "PUBLICADO" : "PENDIENTE"}
                    </Badge>
                    <button onClick={(e) => { e.stopPropagation(); removeCourse(c); }} className={dangerBtn} title="Borrar curso"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Espacio de trabajo */}
          <section className="lg:col-span-2">
            {!sel ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-mono text-sm text-muted-foreground">Elige un curso para gestionar sus temas y exámenes.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#06060f] p-5 space-y-5">
                <div>
                  <h2 className="font-mono text-lg font-bold text-white">{sel.title}</h2>
                  {sel.description && <p className="font-sans text-sm text-muted-foreground mt-1 leading-relaxed">{sel.description}</p>}
                </div>
                <div className="flex gap-1 p-1 rounded-xl border border-white/8 bg-black/40">
                  {([["lessons", "TEMAS", <BookOpen key="b" className="h-3.5 w-3.5" />], ["exams", "EXÁMENES", <ClipboardList key="c" className="h-3.5 w-3.5" />], ["students", "ALUMNOS", <GraduationCap key="d" className="h-3.5 w-3.5" />]] as const).map(([id, label, icon]) => (
                    <button key={id} onClick={() => setTab(id)}
                      className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wide transition-all " + (tab === id ? "text-black" : "text-muted-foreground hover:text-foreground")}
                      style={tab === id ? gradient : {}}>
                      {icon}{label}
                    </button>
                  ))}
                </div>
                {tab === "lessons" ? <LessonsTab course={sel} onChange={loadCourses} /> : tab === "exams" ? <ExamsTab course={sel} /> : <StudentsTab course={sel} />}
              </div>
            )}
          </section>
        </div>
      </main>

      <NewCourseModal open={modalOpen} onClose={() => setModalOpen(false)}
        onCreated={(c) => { setModalOpen(false); setSelId(c.id); setTab("lessons"); loadCourses(); toast({ title: "✓ Curso creado", description: "Añade sus temas y exámenes." }); }} />
    </div>
  );
}
