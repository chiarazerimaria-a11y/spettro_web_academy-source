import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff, Search, FlaskConical, Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
const BASE = import.meta.env.BASE_URL;

const ANDROID_IMAGES = Array.from({ length: 40 }, (_, i) =>
  `${BASE}androids/android-${String(i + 1).padStart(2, "0")}.png`
);

const DIFFICULTIES = [
  { value: "facil", label: "FÁCIL", color: "#34d399" },
  { value: "medio", label: "MEDIO", color: "#f59e0b" },
  { value: "dificil", label: "DIFÍCIL", color: "#9b55f9" },
  { value: "insano", label: "INSANO", color: "#ef4444" },
];

const OS_OPTIONS = ["Linux", "Windows"];

const CHARACTER_TYPES = ["skull", "robot", "demon", "spider", "ghost", "dragon", "virus", "ninja", "phantom", "cyber", "wolf", "eye", "kraken"];

function ThumbnailPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  return (
    <div>
      <p className="text-[10px] font-mono text-muted-foreground mb-2 tracking-widest">MINIATURA — ELIGE UN ANDROIDE</p>
      <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1 rounded-xl border border-white/5 bg-black/40">
        {ANDROID_IMAGES.map((src, i) => {
          const isSelected = value === src;
          return (
            <button
              key={src}
              type="button"
              onClick={() => onChange(src)}
              title={`Androide ${i + 1}`}
              className="relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 aspect-square bg-[#0a0a0f]"
              style={{
                borderColor: isSelected ? "#ff4db8" : "rgba(255,255,255,0.06)",
                boxShadow: isSelected ? "0 0 14px rgba(255,77,184,0.6)" : undefined,
              }}
            >
              <img src={src} alt={`Androide ${i + 1}`} className="w-full h-full object-cover" />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                  <Check className="h-5 w-5 text-white drop-shadow" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {value && (
        <div className="mt-2 flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-[#0a0a0f] border border-primary/30 overflow-hidden">
            <img src={value} alt="Seleccionado" className="w-full h-full object-cover" />
          </div>
          <span className="text-[10px] font-mono text-primary truncate flex-1">{value.split("/").pop()}</span>
          <button type="button" onClick={() => onChange("")} className="text-muted-foreground hover:text-red-400 ml-auto shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

interface LabMachine {
  id: number;
  name: string;
  slug: string;
  os: string;
  difficulty: string;
  characterType: string;
  points: number;
  description: string;
  vulnerability: string;
  techniques: string;
  hints: string | null;
  ip: string | null;
  thumbnailUrl: string | null;
  downloadUrl: string | null;
  writeupUrl: string | null;
  videoUrl: string | null;
  isActive: boolean;
}

const emptyForm = (): Partial<LabMachine> => ({
  name: "", slug: "", os: "Linux", difficulty: "facil", characterType: "skull",
  points: 20, description: "", vulnerability: "", techniques: "",
  hints: "", ip: "", thumbnailUrl: "", downloadUrl: "", writeupUrl: "", videoUrl: "",
  isActive: true,
});

function MachineCard({ m, diffColor, diffLabel, toggleActive, openEdit, handleDelete, deleting }: {
  m: LabMachine;
  diffColor: Record<string, string>;
  diffLabel: Record<string, string>;
  toggleActive: (m: LabMachine) => void;
  openEdit: (m: LabMachine) => void;
  handleDelete: (id: number) => void;
  deleting: number | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="relative rounded-xl border bg-card/60 overflow-hidden"
      style={{ borderColor: m.isActive ? `${diffColor[m.difficulty]}30` : "rgba(255,255,255,0.05)" }}>
      <div className="h-0.5 w-full" style={{
        background: m.isActive
          ? `linear-gradient(90deg, transparent, ${diffColor[m.difficulty]}, transparent)`
          : "transparent"
      }} />
      <div className="p-4 flex gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0f] shrink-0 flex items-center justify-center">
          {m.thumbnailUrl
            ? <img src={m.thumbnailUrl} alt={m.name} className="w-full h-full object-cover" />
            : <span className="text-2xl">💀</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono font-black text-sm text-foreground truncate">{m.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground">/{m.slug}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => toggleActive(m)} className="p-1.5 rounded-lg transition-all"
                style={{ color: m.isActive ? "#34d399" : "#6b7280", background: m.isActive ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)" }}
                title={m.isActive ? "Desactivar" : "Activar"}>
                {m.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${diffColor[m.difficulty]}15`, color: diffColor[m.difficulty], border: `1px solid ${diffColor[m.difficulty]}30` }}>
              {diffLabel[m.difficulty] ?? m.difficulty.toUpperCase()}
            </span>
            <Badge variant="outline" className="font-mono text-[10px]">{m.os}</Badge>
            <Badge variant="outline" className="font-mono text-[10px] text-yellow-400 border-yellow-400/30">+{m.points} XP</Badge>
            {m.downloadUrl && <Badge variant="outline" className="font-mono text-[10px] text-sky-400 border-sky-400/30">DL</Badge>}
            {!m.isActive && <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">OCULTA</Badge>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminLabMachines() {
  const { toast } = useToast();
  const [machines, setMachines] = useState<LabMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<LabMachine>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "facil" | "medio" | "dificil" | "insano">("all");
  const [osFilter, setOsFilter] = useState<"all" | "Linux" | "Windows">("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}api/admin/lab-machines`, { cache: "no-store" });
      if (r.ok) setMachines(await r.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMachines(); }, []);

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleField = (k: keyof LabMachine, v: any) => {
    setForm(prev => {
      const updated = { ...prev, [k]: v };
      if (k === "name" && !editingId) updated.slug = autoSlug(v as string);
      return updated;
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (m: LabMachine) => {
    setEditingId(m.id);
    setForm({ ...m });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { toast({ title: "Nombre requerido", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = editingId
        ? `${BASE}api/admin/lab-machines/${editingId}`
        : `${BASE}api/admin/lab-machines`;
      const r = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          thumbnailUrl: form.thumbnailUrl || null,
          downloadUrl: form.downloadUrl || null,
          writeupUrl: form.writeupUrl || null,
          videoUrl: form.videoUrl || null,
          hints: form.hints || null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: editingId ? "Máquina actualizada" : "Máquina creada en el lab" });
      setShowForm(false);
      fetchMachines();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await fetch(`${BASE}api/admin/lab-machines/${id}`, { method: "DELETE" });
      toast({ title: "Máquina eliminada" });
      fetchMachines();
    } finally { setDeleting(null); }
  };

  const toggleActive = async (m: LabMachine) => {
    const next = !m.isActive;
    setMachines(prev => prev.map(x => x.id === m.id ? { ...x, isActive: next } : x));
    const r = await fetch(`${BASE}api/admin/lab-machines/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    if (!r.ok) {
      setMachines(prev => prev.map(x => x.id === m.id ? { ...x, isActive: m.isActive } : x));
      toast({ title: "Error al cambiar estado", variant: "destructive" });
    }
  };

  const diffColor: Record<string, string> = {
    facil: "#34d399", medio: "#f59e0b", dificil: "#9b55f9", insano: "#ef4444",
  };

  const diffLabel: Record<string, string> = {
    facil: "FÁCIL", medio: "MEDIO", dificil: "DIFÍCIL", insano: "INSANO",
  };

  const filtered = machines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.slug.toLowerCase().includes(search.toLowerCase());
    const matchDiff = activeTab === "all" || m.difficulty === activeTab;
    const matchOs = osFilter === "all" || m.os === osFilter;
    return matchSearch && matchDiff && matchOs;
  });

  const toggleGroup = (key: string) =>
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const DIFF_ORDER = ["facil", "medio", "dificil", "insano"] as const;

  const countBy = (diff: string) =>
    machines.filter(m => m.difficulty === diff && (osFilter === "all" || m.os === osFilter)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary font-mono">&gt;_ LAB MACHINES</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {machines.filter(m => m.isActive).length} activas · {machines.length} total
            {osFilter !== "all" && <span className="text-primary/70"> · {osFilter}</span>}
          </p>
        </div>
        <Button onClick={openCreate} className="font-mono gap-2 bg-primary text-black hover:brightness-110">
          <Plus className="h-4 w-4" /> NUEVA MÁQUINA
        </Button>
      </div>

      {/* Search + OS filter row */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 font-mono text-sm bg-card border-primary/20"
            placeholder="buscar por nombre o slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {/* OS toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-card border border-white/8">
          {(["all", "Linux", "Windows"] as const).map(os => (
            <button
              key={os}
              onClick={() => setOsFilter(os)}
              className="px-3 py-1 rounded-md font-mono text-[11px] transition-all"
              style={osFilter === os
                ? { background: "rgba(255,77,184,0.2)", color: "#ff4db8", border: "1px solid rgba(255,77,184,0.4)" }
                : { color: "#6b7280", border: "1px solid transparent" }}>
              {os === "all" ? "TODO" : os === "Linux" ? "🐧 Linux" : "🪟 Windows"}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/6 flex-wrap">
        <button
          onClick={() => setActiveTab("all")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[11px] font-bold transition-all"
          style={activeTab === "all"
            ? { background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }
            : { color: "#6b7280", border: "1px solid transparent" }}>
          TODAS
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}>
            {machines.filter(m => osFilter === "all" || m.os === osFilter).length}
          </span>
        </button>
        {DIFF_ORDER.map(d => {
          const count = countBy(d);
          return (
            <button
              key={d}
              onClick={() => setActiveTab(d)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[11px] font-bold transition-all"
              style={activeTab === d
                ? { background: `${diffColor[d]}18`, color: diffColor[d], border: `1px solid ${diffColor[d]}50` }
                : { color: "#6b7280", border: "1px solid transparent" }}>
              {diffLabel[d]}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: `${diffColor[d]}12`, color: diffColor[d] }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Machine list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground font-mono">
          <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No hay máquinas en esta categoría.</p>
          <p className="text-xs mt-1 opacity-60">Prueba otro filtro o crea una nueva máquina.</p>
        </div>
      ) : activeTab !== "all" ? (
        /* ── Flat list when a specific difficulty tab is active ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(m => <MachineCard key={m.id} m={m} diffColor={diffColor} diffLabel={diffLabel}
              toggleActive={toggleActive} openEdit={openEdit} handleDelete={handleDelete} deleting={deleting} />)}
          </AnimatePresence>
        </div>
      ) : (
        /* ── Grouped by difficulty when "TODAS" is active ── */
        <div className="space-y-6">
          {DIFF_ORDER.map(d => {
            const group = filtered.filter(m => m.difficulty === d);
            if (group.length === 0) return null;
            const collapsed = collapsedGroups.has(d);
            return (
              <div key={d} className="rounded-xl border overflow-hidden"
                style={{ borderColor: `${diffColor[d]}25` }}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(d)}
                  className="w-full flex items-center justify-between px-5 py-3 transition-all hover:brightness-110"
                  style={{ background: `${diffColor[d]}0e` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: diffColor[d], boxShadow: `0 0 8px ${diffColor[d]}` }} />
                    <span className="font-mono font-black text-sm" style={{ color: diffColor[d] }}>
                      {diffLabel[d]}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: `${diffColor[d]}18`, color: diffColor[d] }}>
                      {group.length} máquina{group.length !== 1 ? "s" : ""}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {group.filter(m => m.isActive).length} activas
                    </span>
                  </div>
                  {collapsed
                    ? <ChevronRight className="h-4 w-4" style={{ color: diffColor[d] }} />
                    : <ChevronDown className="h-4 w-4" style={{ color: diffColor[d] }} />}
                </button>
                {/* Group body */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden">
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {group.map(m => <MachineCard key={m.id} m={m} diffColor={diffColor} diffLabel={diffLabel}
                          toggleActive={toggleActive} openEdit={openEdit} handleDelete={handleDelete} deleting={deleting} />)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FORM MODAL ── */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 22, stiffness: 180 }}
              className="fixed top-0 right-0 h-screen w-full max-w-2xl z-50 bg-background border-l border-primary/20 shadow-2xl flex flex-col overflow-hidden">

              <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/60 shrink-0">
                <div>
                  <p className="font-mono text-[10px] text-primary/60 tracking-widest">ADMIN / LAB</p>
                  <h2 className="font-mono font-bold text-white">{editingId ? "EDITAR MÁQUINA" : "NUEVA MÁQUINA DEL LAB"}</h2>
                </div>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/5">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Name + Slug row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">NOMBRE *</label>
                    <Input value={form.name || ""} onChange={e => handleField("name", e.target.value)}
                      placeholder="GitHacker" className="font-mono bg-black/50 border-white/10" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">SLUG (auto)</label>
                    <Input value={form.slug || ""} onChange={e => handleField("slug", e.target.value)}
                      placeholder="githacker" className="font-mono bg-black/50 border-white/10" />
                  </div>
                </div>

                {/* Difficulty + OS + Points */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">DIFICULTAD</label>
                    <div className="grid grid-cols-2 gap-1">
                      {DIFFICULTIES.map(d => (
                        <button key={d.value} type="button" onClick={() => handleField("difficulty", d.value)}
                          className="px-2 py-1.5 rounded-lg font-mono text-[10px] font-bold border transition-all"
                          style={form.difficulty === d.value
                            ? { background: `${d.color}20`, borderColor: d.color, color: d.color }
                            : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "#6b7280" }}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">OS</label>
                    <div className="flex flex-col gap-1">
                      {OS_OPTIONS.map(os => (
                        <button key={os} type="button" onClick={() => handleField("os", os)}
                          className="px-2 py-1.5 rounded-lg font-mono text-[10px] border transition-all"
                          style={form.os === os
                            ? { background: "rgba(255,77,184,0.15)", borderColor: "#ff4db8", color: "#ff4db8" }
                            : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "#6b7280" }}>
                          {os === "Linux" ? "🐧" : "🪟"} {os}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">PUNTOS XP</label>
                    <Input type="number" value={form.points || 20} onChange={e => handleField("points", Number(e.target.value))}
                      min={5} max={500} className="font-mono bg-black/50 border-white/10" />
                    <p className="text-[9px] text-muted-foreground mt-1 font-mono">User flag: {Math.floor((form.points || 20) / 2)} XP · Root: {form.points || 20} XP</p>
                  </div>
                </div>

                {/* Thumbnail picker */}
                <ThumbnailPicker value={form.thumbnailUrl || ""} onChange={v => handleField("thumbnailUrl", v)} />

                {/* Description */}
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">DESCRIPCIÓN</label>
                  <textarea value={form.description || ""} onChange={e => handleField("description", e.target.value)}
                    rows={2} placeholder="Breve descripción de la máquina..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 resize-none" />
                </div>

                {/* Vulnerability */}
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">VULNERABILIDAD PRINCIPAL</label>
                  <Input value={form.vulnerability || ""} onChange={e => handleField("vulnerability", e.target.value)}
                    placeholder="SQL Injection en login, sin sanitización de entrada" className="font-mono bg-black/50 border-white/10" />
                </div>

                {/* Techniques */}
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">TÉCNICAS (separadas por coma)</label>
                  <Input value={form.techniques || ""} onChange={e => handleField("techniques", e.target.value)}
                    placeholder="SQLi, RCE, sudo abuse, SUID" className="font-mono bg-black/50 border-white/10" />
                </div>

                {/* Hints */}
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">PISTA (opcional)</label>
                  <Input value={form.hints || ""} onChange={e => handleField("hints", e.target.value)}
                    placeholder="Revisa los archivos de configuración..." className="font-mono bg-black/50 border-white/10" />
                </div>

                {/* Flags section */}
                <div className="border border-red-500/20 rounded-xl bg-red-500/5 p-4 space-y-3">
                  <p className="font-mono text-[10px] font-bold text-red-400 tracking-widest flex items-center gap-2">
                    🚩 FLAGS SECRETAS (solo visible para admin)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">USER FLAG</label>
                      <Input value={(form as any).userFlag || ""} onChange={e => handleField("userFlag" as any, e.target.value)}
                        placeholder="SpettroWeb{user_flag_here}" className="font-mono bg-black/60 border-red-500/20 text-red-300" />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">ROOT FLAG</label>
                      <Input value={(form as any).rootFlag || ""} onChange={e => handleField("rootFlag" as any, e.target.value)}
                        placeholder="SpettroWeb{root_flag_here}" className="font-mono bg-black/60 border-red-500/20 text-red-300" />
                    </div>
                  </div>
                </div>

                {/* URLs */}
                <div className="space-y-3">
                  <p className="font-mono text-[10px] text-muted-foreground tracking-widest">URLS Y RED</p>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">IP DE LA MÁQUINA VÍCTIMA</label>
                    <Input value={form.ip || ""} onChange={e => handleField("ip", e.target.value)}
                      placeholder="192.168.1.100" className="font-mono bg-black/50 border-white/10" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">DESCARGAR MÁQUINA (.ova / .zip)</label>
                    <Input value={form.downloadUrl || ""} onChange={e => handleField("downloadUrl", e.target.value)}
                      placeholder="https://..." className="font-mono bg-black/50 border-white/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground block mb-1">WRITEUP URL</label>
                      <Input value={form.writeupUrl || ""} onChange={e => handleField("writeupUrl", e.target.value)}
                        placeholder="https://..." className="font-mono bg-black/50 border-white/10" />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground block mb-1">VIDEO URL</label>
                      <Input value={form.videoUrl || ""} onChange={e => handleField("videoUrl", e.target.value)}
                        placeholder="https://youtube.com/..." className="font-mono bg-black/50 border-white/10" />
                    </div>
                  </div>
                </div>

                {/* Character type */}
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-1.5">TIPO DE CRIATURA (fallback si sin miniatura)</label>
                  <div className="flex flex-wrap gap-2">
                    {CHARACTER_TYPES.map(ct => (
                      <button key={ct} type="button" onClick={() => handleField("characterType", ct)}
                        className="px-2.5 py-1 rounded-lg font-mono text-[10px] border transition-all"
                        style={form.characterType === ct
                          ? { background: "rgba(255,77,184,0.15)", borderColor: "#ff4db8", color: "#ff4db8" }
                          : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "#6b7280" }}>
                        {ct}
                      </button>
                    ))}
                  </div>
                </div>

                {/* isActive toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/2">
                  <div>
                    <p className="font-mono text-sm font-bold">PUBLICAR EN EL LAB</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Visible para todos los usuarios del laboratorio</p>
                  </div>
                  <button type="button" onClick={() => handleField("isActive", !form.isActive)}
                    className="relative w-12 h-6 rounded-full transition-all"
                    style={{ background: form.isActive ? "#ff4db8" : "rgba(255,255,255,0.1)" }}>
                    <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: form.isActive ? "calc(100% - 22px)" : "2px" }} />
                  </button>
                </div>
              </div>

              <div className="p-5 border-t border-white/10 bg-black/60 flex gap-3 shrink-0">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 font-mono">
                  CANCELAR
                </Button>
                <Button onClick={handleSave} disabled={saving}
                  className="flex-1 font-mono gap-2 bg-primary text-black hover:brightness-110">
                  {saving ? <><div className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" /> GUARDANDO...</> : <><Check className="h-4 w-4" />{editingId ? "ACTUALIZAR" : "CREAR MÁQUINA"}</>}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
