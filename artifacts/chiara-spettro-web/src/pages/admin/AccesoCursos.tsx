import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

async function adminApi<T = unknown>(path: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch(BASE + "api/admin" + path, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-Admin-Key": sessionStorage.getItem("adminKey") || "" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error || "Error");
  return d as T;
}

interface CourseRow { id: number; title: string; price: string; instructor: string; instructorId: number | null; published: boolean; isFree: boolean; enrolledCount: number }
interface Access { userId: number; username: string; email: string; enrolledAt: string; progress: number }

const inp = "w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2.5 text-sm font-mono text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60";
const lbl = "block font-mono text-[10px] text-muted-foreground tracking-widest uppercase mb-1.5";

const isExternalPaid = (c: CourseRow) => c.instructorId != null && Number(c.price) > 0 && !c.isFree;

export default function AccesoCursos() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [courseId, setCourseId] = useState(0);
  const [who, setWho] = useState("");
  const [list, setList] = useState<Access[]>([]);
  const [busy, setBusy] = useState(false);

  const fail = (title: string, e: unknown) => toast({ title, description: (e as Error).message, variant: "destructive" });

  useEffect(() => {
    adminApi<CourseRow[]>("/course-access/courses").then((rows) => {
      const sorted = [...rows].sort((a, b) => Number(isExternalPaid(b)) - Number(isExternalPaid(a)));
      setCourses(sorted);
      setCourseId((cur) => cur || sorted[0]?.id || 0);
    }).catch((e) => fail("No se pudieron cargar los cursos", e));
  }, []);

  const loadList = useCallback(() => {
    if (!courseId) { setList([]); return; }
    adminApi<Access[]>("/course-access?courseId=" + courseId).then(setList).catch((e) => fail("No se pudo cargar la lista", e));
  }, [courseId]);
  useEffect(() => { loadList(); }, [loadList]);

  const grant = async () => {
    if (!courseId) { toast({ title: "Elige un curso", variant: "destructive" }); return; }
    if (!who.trim()) { toast({ title: "Escribe el usuario o el email del alumno", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const r = await adminApi<{ already: boolean; username: string }>("/course-access", "POST", { courseId, user: who.trim() });
      toast({ title: r.already ? "Ya tenía acceso" : "✓ Acceso concedido", description: r.username });
      setWho("");
      loadList();
    } catch (e) { fail("No se pudo dar acceso", e); }
    setBusy(false);
  };

  const revoke = async (a: Access) => {
    if (!window.confirm("¿Quitar el acceso a " + a.username + "?")) return;
    try {
      await adminApi("/course-access?courseId=" + courseId + "&userId=" + a.userId, "DELETE");
      loadList();
    } catch (e) { fail("No se pudo quitar", e); }
  };

  const sel = courses.find((c) => c.id === courseId) || null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary">Acceso a cursos</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">
          Cuando un alumno pague un curso de pago, confírmalo aquí para abrirle las lecciones.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#06060f] p-5 space-y-4">
        <div>
          <label className={lbl}>Curso</label>
          <select className={inp} value={courseId} onChange={(e) => setCourseId(Number(e.target.value))}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {(c.instructorId != null ? "Profesor " + c.instructor : "Plataforma") + " — " + c.title + " (" + (Number(c.price) > 0 ? c.price + " €" : "gratis") + ")" + (c.published ? "" : " [sin publicar]")}
              </option>
            ))}
          </select>
          {sel && !isExternalPaid(sel) && (
            <p className="font-mono text-[10px] text-amber-400/80 mt-1.5">Este curso no es de pago de un profesor externo; puedes darle acceso igualmente.</p>
          )}
        </div>
        <div>
          <label className={lbl}>Alumno (nombre de usuario o email)</label>
          <div className="flex gap-2">
            <input className={inp} value={who} placeholder="tekilla_mi_bb  o  alumno@correo.com"
              onChange={(e) => setWho(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !busy) grant(); }} />
            <button onClick={grant} disabled={busy}
              className="shrink-0 rounded-lg px-4 font-mono text-xs font-bold text-black disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ff4db8,#9b55f9)" }}>
              CONFIRMAR PAGO Y DAR ACCESO
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#06060f] p-5">
        <p className={lbl}>Alumnos con acceso ({list.length})</p>
        {list.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground">Nadie tiene acceso a este curso todavía.</p>
        ) : (
          <div className="space-y-2">
            {list.map((a) => (
              <div key={a.userId} className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/30 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm text-white truncate">{a.username}</p>
                  <p className="font-mono text-[10px] text-muted-foreground truncate">{a.email} · desde {new Date(a.enrolledAt).toLocaleDateString("es-ES")} · {a.progress}%</p>
                </div>
                <button onClick={() => revoke(a)} className="rounded-md border border-red-500/40 px-3 py-1.5 font-mono text-[11px] font-bold text-red-400 hover:bg-red-500/10">QUITAR</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
