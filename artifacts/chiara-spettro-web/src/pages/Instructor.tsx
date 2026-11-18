import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL;

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

const inp = "w-full rounded-md bg-black/50 border border-primary/20 px-2 py-1.5 text-sm font-mono text-foreground";
const btn = "rounded-md border border-primary/40 bg-primary/10 text-primary px-3 py-1.5 text-xs font-mono hover:bg-primary/20";
const del = "text-[10px] font-mono text-red-400 hover:text-red-300";
const card = "rounded-lg border border-border/30 p-4 space-y-3";

function LessonsPanel({ course, onChange }: { course: Course; onChange: () => void }) {
  const [items, setItems] = useState<Lesson[]>([]);
  const [f, setF] = useState({ title: "", videoUrl: "", content: "", minutes: "10", isFree: false });
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api<Lesson[]>("/courses/" + course.id + "/lessons").then(setItems).catch((e) => setErr(e.message));
  }, [course.id]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    setErr("");
    try {
      await api("/courses/" + course.id + "/lessons", "POST", {
        title: f.title, videoUrl: f.videoUrl, content: f.content,
        durationMinutes: Number(f.minutes) || 0, isFree: f.isFree,
      });
      setF({ ...f, title: "", videoUrl: "", content: "" });
      load(); onChange();
    } catch (e) { setErr((e as Error).message); }
  };
  const remove = async (id: number) => {
    if (!confirm("¿Borrar esta leccion?")) return;
    try { await api("/lessons/" + id, "DELETE"); load(); onChange(); } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      {err && <div className="text-xs text-red-400 font-mono">{err}</div>}
      <div className={card}>
        <div className="text-xs font-mono text-primary/70 tracking-widest">NUEVA LECCION / TEMA</div>
        <input className={inp} placeholder="Titulo del tema" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className={inp} placeholder="Enlace del video o del informe (https://...)" value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
        <textarea className={inp + " h-24"} placeholder="Notas o informe (markdown)" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
        <div className="flex items-center gap-3">
          <input className={inp + " max-w-[110px]"} type="number" min={0} value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} />
          <span className="text-xs text-muted-foreground">minutos</span>
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <input type="checkbox" checked={f.isFree} onChange={(e) => setF({ ...f, isFree: e.target.checked })} /> vista previa gratis
          </label>
          <button className={btn + " ml-auto"} onClick={add}>Agregar</button>
        </div>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? <div className="text-xs text-muted-foreground italic">Sin lecciones todavia</div> : items.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-3 rounded-md border border-border/20 p-2">
            <div className="min-w-0">
              <div className="text-sm font-mono truncate">{l.order}. {l.title}</div>
              <div className="text-[10px] text-muted-foreground truncate">{l.videoUrl || "sin enlace"} · {Math.round(l.duration / 60)} min{l.isFree ? " · gratis" : ""}</div>
            </div>
            <button className={del} onClick={() => remove(l.id)}>borrar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExamsPanel({ course }: { course: Course }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [qs, setQs] = useState<Question[]>([]);
  const [ef, setEf] = useState({ title: "", passScore: "60" });
  const [qf, setQf] = useState({ question: "", o: ["", "", "", ""], correct: 0 });
  const [err, setErr] = useState("");

  const loadExams = useCallback(() => {
    api<Exam[]>("/courses/" + course.id + "/exams").then(setExams).catch((e) => setErr(e.message));
  }, [course.id]);
  const loadQs = useCallback(() => {
    if (sel) api<Question[]>("/exams/" + sel + "/questions").then(setQs).catch((e) => setErr(e.message));
    else setQs([]);
  }, [sel]);
  useEffect(() => { loadExams(); setSel(null); }, [loadExams]);
  useEffect(() => { loadQs(); }, [loadQs]);

  const addExam = async () => {
    setErr("");
    try {
      await api("/courses/" + course.id + "/exams", "POST", { title: ef.title, passScore: Number(ef.passScore) || 60 });
      setEf({ title: "", passScore: "60" });
      loadExams();
    } catch (e) { setErr((e as Error).message); }
  };
  const delExam = async (id: number) => {
    if (!confirm("¿Borrar el examen y sus preguntas?")) return;
    try { await api("/exams/" + id, "DELETE"); if (sel === id) setSel(null); loadExams(); } catch (e) { setErr((e as Error).message); }
  };
  const addQ = async () => {
    setErr("");
    const options = qf.o.map((x) => x.trim()).filter(Boolean);
    const correctText = qf.o[qf.correct]?.trim();
    const correctIndex = options.indexOf(correctText);
    try {
      await api("/exams/" + sel + "/questions", "POST", { question: qf.question, options, correctIndex });
      setQf({ question: "", o: ["", "", "", ""], correct: 0 });
      loadQs();
    } catch (e) { setErr((e as Error).message); }
  };
  const delQ = async (id: number) => {
    try { await api("/questions/" + id, "DELETE"); loadQs(); } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      {err && <div className="text-xs text-red-400 font-mono">{err}</div>}
      <div className={card}>
        <div className="text-xs font-mono text-primary/70 tracking-widest">NUEVO EXAMEN</div>
        <div className="flex gap-2">
          <input className={inp} placeholder="Titulo del examen" value={ef.title} onChange={(e) => setEf({ ...ef, title: e.target.value })} />
          <input className={inp + " max-w-[90px]"} type="number" min={1} max={100} value={ef.passScore} onChange={(e) => setEf({ ...ef, passScore: e.target.value })} />
          <button className={btn} onClick={addExam}>Crear</button>
        </div>
        <div className="text-[10px] text-muted-foreground">El numero es la nota minima para aprobar (%).</div>
      </div>

      <div className="space-y-2">
        {exams.length === 0 ? <div className="text-xs text-muted-foreground italic">Sin examenes todavia</div> : exams.map((x) => (
          <div key={x.id} className={"flex items-center justify-between rounded-md border p-2 cursor-pointer " + (sel === x.id ? "border-primary/50" : "border-border/20")} onClick={() => setSel(x.id)}>
            <div className="text-sm font-mono">{x.title} <span className="text-[10px] text-muted-foreground">(aprueba con {x.passScore}%)</span></div>
            <button className={del} onClick={(e) => { e.stopPropagation(); delExam(x.id); }}>borrar</button>
          </div>
        ))}
      </div>

      {sel && (
        <div className={card}>
          <div className="text-xs font-mono text-primary/70 tracking-widest">PREGUNTAS DEL EXAMEN</div>
          {qs.map((q, i) => (
            <div key={q.id} className="rounded-md border border-border/20 p-2 text-xs font-mono space-y-1">
              <div className="flex justify-between gap-2"><span>{i + 1}. {q.question}</span><button className={del} onClick={() => delQ(q.id)}>borrar</button></div>
              {q.options.map((o, j) => (
                <div key={j} className={j === q.correctIndex ? "text-green-400" : "text-muted-foreground"}>{j === q.correctIndex ? "✔ " : "· "}{o}</div>
              ))}
            </div>
          ))}
          <input className={inp} placeholder="Pregunta" value={qf.question} onChange={(e) => setQf({ ...qf, question: e.target.value })} />
          {qf.o.map((val, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={qf.correct === i} onChange={() => setQf({ ...qf, correct: i })} title="Respuesta correcta" />
              <input className={inp} placeholder={"Opcion " + (i + 1)} value={val} onChange={(e) => { const o = [...qf.o]; o[i] = e.target.value; setQf({ ...qf, o }); }} />
            </div>
          ))}
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Marca el circulo de la respuesta correcta.</span>
            <button className={btn} onClick={addQ}>Agregar pregunta</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Instructor() {
  const [me, setMe] = useState<{ loggedIn: boolean; isInstructor: boolean; username: string | null } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [tab, setTab] = useState<"lessons" | "exams">("lessons");
  const [err, setErr] = useState("");
  const [f, setF] = useState({ title: "", description: "", level: "principiante", category: "general", price: "0", durationHours: "1", videoUrl: "" });

  const loadCourses = useCallback(() => {
    api<Course[]>("/courses").then(setCourses).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    api<{ loggedIn: boolean; isInstructor: boolean; username: string | null }>("/me")
      .then((m) => { setMe(m); if (m.isInstructor) loadCourses(); })
      .catch(() => setMe({ loggedIn: false, isInstructor: false, username: null }));
  }, [loadCourses]);

  const createCourse = async () => {
    setErr("");
    try {
      const c = await api<Course>("/courses", "POST", {
        title: f.title, description: f.description, level: f.level, category: f.category,
        price: Number(f.price) || 0, durationHours: Number(f.durationHours) || 0, videoUrl: f.videoUrl,
      });
      setF({ ...f, title: "", description: "", videoUrl: "" });
      loadCourses(); setSelId(c.id);
    } catch (e) { setErr((e as Error).message); }
  };
  const removeCourse = async (id: number) => {
    if (!confirm("¿Borrar el curso con sus lecciones y examenes?")) return;
    try { await api("/courses/" + id, "DELETE"); if (selId === id) setSelId(null); loadCourses(); } catch (e) { setErr((e as Error).message); }
  };

  if (!me) return <div className="p-10 text-center font-mono text-sm text-muted-foreground">Cargando...</div>;
  if (!me.loggedIn) return <div className="p-10 text-center font-mono text-sm">Inicia sesion para entrar. <Link href="/login" className="text-primary underline">Ir al login</Link></div>;
  if (!me.isInstructor) return <div className="p-10 text-center font-mono text-sm text-muted-foreground">Tu cuenta no tiene rol de profesor. Pidele al administrador que te lo asigne.</div>;

  const sel = courses.find((c) => c.id === selId) || null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary font-mono">Panel del profesor</h1>
        <p className="text-sm text-muted-foreground">Hola {me.username}. Tus cursos quedan pendientes hasta que el administrador los publique.</p>
      </div>
      {err && <div className="text-xs text-red-400 font-mono">{err}</div>}

      <div className={card}>
        <div className="text-xs font-mono text-primary/70 tracking-widest">NUEVO CURSO</div>
        <input className={inp} placeholder="Titulo" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <textarea className={inp + " h-20"} placeholder="Descripcion" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select className={inp} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
            <option value="principiante">principiante</option><option value="intermedio">intermedio</option>
            <option value="avanzado">avanzado</option><option value="experto">experto</option>
          </select>
          <input className={inp} placeholder="Categoria" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <input className={inp} type="number" min={0} placeholder="Precio €" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          <input className={inp} type="number" min={0} placeholder="Horas" value={f.durationHours} onChange={(e) => setF({ ...f, durationHours: e.target.value })} />
        </div>
        <input className={inp} placeholder="Video de presentacion (opcional, https://...)" value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
        <button className={btn} onClick={createCourse}>Crear curso</button>
      </div>

      <div className="space-y-2">
        {courses.length === 0 ? <div className="text-xs text-muted-foreground italic">Todavia no tienes cursos</div> : courses.map((c) => (
          <div key={c.id} onClick={() => setSelId(c.id)} className={"flex items-center justify-between rounded-md border p-3 cursor-pointer " + (selId === c.id ? "border-primary/50 bg-primary/5" : "border-border/30")}>
            <div>
              <div className="font-mono font-bold">{c.title}</div>
              <div className="text-[10px] text-muted-foreground">{c.level} · {c.totalLessons} lecciones · {c.price} €</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={c.published ? "border-green-500/30 text-green-400" : ""}>{c.published ? "publicado" : "pendiente"}</Badge>
              <button className={del} onClick={(e) => { e.stopPropagation(); removeCourse(c.id); }}>borrar</button>
            </div>
          </div>
        ))}
      </div>

      {sel && (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-border/30 pb-2">
            <button className={btn + (tab === "lessons" ? "" : " opacity-50")} onClick={() => setTab("lessons")}>Lecciones</button>
            <button className={btn + (tab === "exams" ? "" : " opacity-50")} onClick={() => setTab("exams")}>Examenes</button>
            <span className="ml-auto text-xs font-mono text-muted-foreground self-center">{sel.title}</span>
          </div>
          {tab === "lessons" ? <LessonsPanel course={sel} onChange={loadCourses} /> : <ExamsPanel course={sel} />}
        </div>
      )}
    </div>
  );
}
