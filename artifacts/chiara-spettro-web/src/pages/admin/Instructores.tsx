import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookMarked, CheckCircle, XCircle, Clock, Search, BookOpen, ChevronDown, ChevronUp, Wallet, Video, Euro } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

interface Application {
  id: number;
  name: string;
  email: string;
  role: string;
  experience: string;
  links: string | null;
  message: string;
  payoutIban: string | null;
  payoutPaypal: string | null;
  status: string;
  createdAt: string;
}

interface CourseSubmission {
  id: number;
  userId: number | null;
  title: string;
  description: string;
  level: string;
  price: string;
  durationHours: number;
  videoUrl: string | null;
  syllabus: string | null;
  status: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, { badge: string; label: string; icon: React.FC<{ className?: string }> }> = {
  pendiente: { badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", label: "Pendiente", icon: Clock },
  aprobado: { badge: "bg-green-500/10 text-green-400 border-green-500/30", label: "Aprobado", icon: CheckCircle },
  rechazado: { badge: "bg-red-500/10 text-red-400 border-red-500/30", label: "Rechazado", icon: XCircle },
};

const ROLE_LABELS: Record<string, string> = {
  instructor: "Instructor",
  streamer: "Streamer",
  machine: "Máquinas",
  both: "Pack Completo",
};

const LEVEL_COLORS: Record<string, string> = {
  principiante: "text-primary",
  intermedio: "text-secondary",
  avanzado: "text-orange-400",
  experto: "text-red-400",
};

export default function Instructores() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"solicitudes" | "cursos">("solicitudes");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: applications = [], isLoading: loadingApps } = useQuery<Application[]>({
    queryKey: ["admin-instructores"],
    queryFn: () => fetch(`${BASE}api/admin/instructores`).then(r => r.json()),
  });

  const { data: submissions = [], isLoading: loadingSubs } = useQuery<CourseSubmission[]>({
    queryKey: ["admin-submissions"],
    queryFn: () => fetch(`${BASE}api/admin/submissions`).then(r => r.json()),
  });

  const updateApp = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`${BASE}api/admin/instructores/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-instructores"] }); toast({ title: "Solicitud actualizada" }); },
    onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
  });

  const updateSub = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`${BASE}api/admin/submissions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-submissions"] }); toast({ title: "Curso actualizado" }); },
    onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
  });

  const filteredApps = applications
    .filter(a => filterStatus === "todos" || a.status === filterStatus)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

  const filteredSubs = submissions
    .filter(s => filterStatus === "todos" || s.status === filterStatus)
    .filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()));

  const pending = applications.filter(a => a.status === "pendiente").length;
  const approved = applications.filter(a => a.status === "aprobado").length;
  const pendingSubs = submissions.filter(s => s.status === "pendiente").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary flex items-center gap-2"><BookMarked className="h-6 w-6" /> Instructores</h1>
        <p className="text-muted-foreground text-sm mt-1">Solicitudes de colaboradores y cursos enviados</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Solicitudes totales", value: applications.length, color: "text-secondary" },
          { label: "Pendientes revisión", value: pending, color: "text-yellow-400" },
          { label: "Colaboradores activos", value: approved, color: "text-green-400" },
          { label: "Cursos por revisar", value: pendingSubs, color: "text-primary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-border rounded-lg p-4 bg-card/30">
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border">
        <button onClick={() => setTab("solicitudes")}
          className={`px-4 py-2 font-mono text-sm font-bold border-b-2 transition-colors ${tab === "solicitudes" ? "border-secondary text-secondary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          SOLICITUDES {pending > 0 && <span className="ml-2 bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded font-mono">{pending}</span>}
        </button>
        <button onClick={() => setTab("cursos")}
          className={`px-4 py-2 font-mono text-sm font-bold border-b-2 transition-colors ${tab === "cursos" ? "border-secondary text-secondary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          CURSOS ENVIADOS {pendingSubs > 0 && <span className="ml-2 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded font-mono">{pendingSubs}</span>}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 max-w-xs font-mono text-sm bg-black/50 border-secondary/20 h-8" />
        </div>
        {["todos", "pendiente", "aprobado", "rechazado"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all ${filterStatus === s ? "bg-secondary text-black" : "bg-card border border-border text-muted-foreground hover:border-secondary/50"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* SOLICITUDES tab */}
      {tab === "solicitudes" && (
        <div className="space-y-3">
          {loadingApps ? (
            <div className="text-center py-12 text-muted-foreground font-mono">Cargando solicitudes...</div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-mono">No hay solicitudes{search ? " con ese filtro" : ""}</div>
          ) : filteredApps.map((app, i) => {
            const st = STATUS_STYLE[app.status] || STATUS_STYLE.pendiente;
            const Icon = st.icon;
            const isExp = expanded === app.id;
            return (
              <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="border border-border rounded-lg bg-card/20 overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : app.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold font-mono text-foreground">{app.name}</span>
                      <Badge className="text-[10px] font-mono border bg-secondary/10 text-secondary border-secondary/30">
                        {ROLE_LABELS[app.role] || app.role}
                      </Badge>
                      <Badge className={`text-[10px] font-mono border ${st.badge}`}>
                        <Icon className="h-2.5 w-2.5 mr-1" />{st.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{app.email} · {new Date(app.createdAt).toLocaleDateString("es-ES")}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {app.status === "pendiente" && (
                      <>
                        <Button size="sm" onClick={e => { e.stopPropagation(); updateApp.mutate({ id: app.id, status: "aprobado" }); }}
                          className="h-7 text-xs font-mono bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" /> APROBAR
                        </Button>
                        <Button size="sm" onClick={e => { e.stopPropagation(); updateApp.mutate({ id: app.id, status: "rechazado" }); }}
                          className="h-7 text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">
                          <XCircle className="h-3 w-3 mr-1" /> RECHAZAR
                        </Button>
                      </>
                    )}
                    {isExp ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
                {isExp && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="border-t border-border/50 p-4 bg-black/20 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">EXPERIENCIA</p>
                      <p className="text-sm text-foreground/80">{app.experience}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">PROPUESTA</p>
                      <p className="text-sm text-foreground/80">{app.message}</p>
                    </div>
                    {app.links && (
                      <div>
                        <p className="text-xs text-muted-foreground font-mono mb-1">LINKS</p>
                        <p className="text-sm text-primary">{app.links}</p>
                      </div>
                    )}
                    <div className="flex gap-4 flex-wrap pt-1">
                      {app.payoutIban && (
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Wallet className="h-3.5 w-3.5 text-green-400" />
                          <span className="text-muted-foreground">IBAN:</span>
                          <span className="text-green-400">{app.payoutIban.slice(0, 8)}···</span>
                        </div>
                      )}
                      {app.payoutPaypal && (
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Wallet className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-muted-foreground">PayPal:</span>
                          <span className="text-blue-400">{app.payoutPaypal}</span>
                        </div>
                      )}
                      {!app.payoutIban && !app.payoutPaypal && (
                        <span className="text-xs text-muted-foreground font-mono">Sin datos de cobro registrados</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CURSOS ENVIADOS tab */}
      {tab === "cursos" && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-border bg-card/50 text-muted-foreground text-xs uppercase">
                <th className="text-left px-4 py-3">Curso</th>
                <th className="text-center px-4 py-3">Nivel</th>
                <th className="text-center px-4 py-3">Precio</th>
                <th className="text-center px-4 py-3">Horas</th>
                <th className="text-center px-4 py-3">Vídeo</th>
                <th className="text-center px-4 py-3">Estado</th>
                <th className="text-center px-4 py-3">Fecha</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingSubs ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Cargando cursos...</td></tr>
              ) : filteredSubs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No hay cursos enviados{search ? " con ese filtro" : ""}</td></tr>
              ) : filteredSubs.map((s, i) => {
                const st = STATUS_STYLE[s.status] || STATUS_STYLE.pendiente;
                const Icon = st.icon;
                return (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-border/50 hover:bg-card/40 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-foreground truncate">{s.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{s.description}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold ${LEVEL_COLORS[s.level] || "text-primary"}`}>{s.level}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-400 font-bold flex items-center justify-center gap-0.5">
                        <Euro className="h-3 w-3" />{Number(s.price).toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{s.durationHours}h</td>
                    <td className="px-4 py-3 text-center">
                      {s.videoUrl ? (
                        <a href={s.videoUrl} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80">
                          <Video className="h-4 w-4 mx-auto" />
                        </a>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`text-[10px] font-mono border ${st.badge}`}>
                        <Icon className="h-2.5 w-2.5 mr-1" />{st.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                      {new Date(s.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === "pendiente" && (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" onClick={() => updateSub.mutate({ id: s.id, status: "aprobado" })}
                            className="h-7 text-xs font-mono bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" onClick={() => updateSub.mutate({ id: s.id, status: "rechazado" })}
                            className="h-7 text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
