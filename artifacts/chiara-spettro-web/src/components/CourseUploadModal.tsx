import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, Upload, BookOpen, Clock, DollarSign, Video, List, CheckCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const LEVELS = [
  { id: "principiante", label: "Principiante", color: "#ff4db8" },
  { id: "intermedio", label: "Intermedio", color: "#9b55f9" },
  { id: "avanzado", label: "Avanzado", color: "#ff6600" },
  { id: "experto", label: "Experto", color: "#ff0000" },
];

interface CourseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CourseUploadModal({ isOpen, onClose }: CourseUploadModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("principiante");
  const [price, setPrice] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [modules, setModules] = useState<string[]>(["", "", ""]);

  const addModule = () => setModules(m => [...m, ""]);
  const removeModule = (i: number) => setModules(m => m.filter((_, idx) => idx !== i));
  const setModule = (i: number, v: string) => setModules(m => m.map((x, idx) => idx === i ? v : x));

  const handleClose = () => {
    setStep("form");
    setTitle(""); setDescription(""); setLevel("principiante");
    setPrice(""); setDurationHours(""); setVideoUrl("");
    setModules(["", "", ""]);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Debes iniciar sesión", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const syllabus = modules.filter(Boolean).join("\n");
      const res = await fetch(`${import.meta.env.BASE_URL}api/courses/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title, description, level,
          price: price || "0",
          durationHours: durationHours || "1",
          videoUrl: videoUrl || null,
          syllabus: syllabus || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al enviar");
      }
      setStep("success");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selectedLevel = LEVELS.find(l => l.id === level)!;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full max-w-2xl bg-[#07070f] border border-secondary/30 shadow-[0_0_60px_rgba(155,85,249,0.12)] rounded-xl overflow-hidden max-h-[90dvh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-secondary/20 bg-black/60 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-secondary" />
                  <span className="font-mono text-sm font-bold text-secondary tracking-widest">SUBIR_CURSO.exe</span>
                  {user && <Badge className="ml-2 text-[10px] font-mono bg-secondary/10 text-secondary border-secondary/30">{user.username.toUpperCase()}</Badge>}
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {step === "success" ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-12 text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
                      <CheckCircle className="h-8 w-8 text-secondary" />
                    </div>
                    <h3 className="font-mono text-2xl font-bold text-secondary">CURSO ENVIADO</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Tu curso <strong className="text-white">"{title}"</strong> está en revisión. El equipo de SpettroWeb lo revisará en 48-72h y te contactaremos por email.
                    </p>
                    <div className="flex gap-3 mt-4 flex-wrap justify-center">
                      <Button onClick={() => setStep("form")} variant="outline" className="font-mono border-secondary text-secondary">
                        SUBIR OTRO CURSO
                      </Button>
                      <Button onClick={handleClose} className="font-mono bg-secondary text-black hover:brightness-110">
                        CERRAR
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    {/* Info banner */}
                    <div className="flex items-start gap-3 bg-secondary/5 border border-secondary/20 rounded-lg p-3.5">
                      <BookOpen className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                        Tu curso será revisado por el equipo en <span className="text-secondary">48-72h</span>. Una vez aprobado, se publicará y ganarás el <span className="text-secondary font-bold">80% de cada venta</span>.
                      </p>
                    </div>

                    {/* Title & Level */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">TÍTULO DEL CURSO *</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} required
                          placeholder="Ej: Pentesting Web desde Cero con OWASP Top 10"
                          className="font-mono text-sm bg-black/50 border-secondary/20 focus:border-secondary" />
                      </div>
                      <div>
                        <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">NIVEL *</label>
                        <select value={level} onChange={e => setLevel(e.target.value)}
                          className="w-full h-10 px-3 rounded-md font-mono text-sm bg-black/50 border border-secondary/20 focus:border-secondary focus:outline-none text-foreground">
                          {LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">DESCRIPCIÓN DEL CURSO *</label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3}
                        placeholder="¿Qué aprenderán los estudiantes? ¿Qué herramientas y técnicas se cubren? ¿A quién va dirigido?"
                        className="font-mono text-sm bg-black/50 border-secondary/20 focus:border-secondary resize-none" />
                    </div>

                    {/* Price & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">PRECIO EN EUROS *</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input value={price} onChange={e => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                            placeholder="97" type="text" required
                            className="pl-9 font-mono text-sm bg-black/50 border-secondary/20 focus:border-secondary" />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">Tu ganancia: €{price ? (Number(price) * 0.8).toFixed(0) : "0"} por venta</p>
                      </div>
                      <div>
                        <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">DURACIÓN (HORAS) *</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input value={durationHours} onChange={e => setDurationHours(e.target.value.replace(/\D/g, ""))}
                            placeholder="20" type="text" required
                            className="pl-9 font-mono text-sm bg-black/50 border-secondary/20 focus:border-secondary" />
                        </div>
                      </div>
                    </div>

                    {/* Video URL */}
                    <div>
                      <label className="font-mono text-[11px] text-muted-foreground mb-1.5 block">URL DE VÍDEO DEMO (YouTube / Vimeo)</label>
                      <div className="relative">
                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="pl-9 font-mono text-sm bg-black/50 border-secondary/20 focus:border-secondary" />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">Vídeo de presentación o trailer de 2-5 minutos. Aumenta las conversiones.</p>
                    </div>

                    {/* Modules / Syllabus */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <List className="h-3.5 w-3.5" /> TEMARIO / MÓDULOS
                        </label>
                        <button type="button" onClick={addModule} className="flex items-center gap-1 text-[10px] font-mono text-secondary hover:text-secondary/80 transition-colors">
                          <Plus className="h-3 w-3" /> AÑADIR MÓDULO
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {modules.map((mod, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <span className="font-mono text-[11px] text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                            <Input value={mod} onChange={e => setModule(i, e.target.value)}
                              placeholder={`Módulo ${i + 1}: Ej. Introducción al Hacking Web`}
                              className="flex-1 font-mono text-sm bg-black/50 border-secondary/10 focus:border-secondary h-8 text-xs" />
                            {modules.length > 1 && (
                              <button type="button" onClick={() => removeModule(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-12 font-mono font-bold text-sm text-black hover:brightness-110 mt-2"
                      style={{ backgroundColor: selectedLevel.color, boxShadow: `0 0 20px ${selectedLevel.color}44` }}>
                      <Upload className="mr-2 h-4 w-4" />
                      {loading ? "ENVIANDO..." : "ENVIAR CURSO PARA REVISIÓN"}
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground font-mono">
                      Revisión en 48-72h · 80% de cada venta para ti · Pago mensual
                    </p>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
