import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Target, Search, Download, Flag } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type Mission = {
  id: number; name: string; description: string; difficulty: string;
  points: number; targetIp: string; flagFormat: string;
  flagValue: string | null; downloadUrl: string | null;
  hints: string | null; isActive: boolean; createdAt: string;
};

const EMPTY: Omit<Mission, "id" | "createdAt"> = {
  name: "", description: "", difficulty: "medio", points: 100,
  targetIp: "10.10.0.1", flagFormat: "SpettroWeb{...}",
  flagValue: null, downloadUrl: null, hints: null, isActive: true,
};

const diffColor: Record<string, string> = {
  facil: "bg-green-500/20 text-green-400 border-green-500/40",
  medio: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  dificil: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  insano: "bg-red-500/20 text-red-400 border-red-500/40",
};

export default function AdminMisiones() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [form, setForm] = useState<Omit<Mission, "id" | "createdAt">>(EMPTY);

  const { data: missions = [], isLoading } = useQuery<Mission[]>({
    queryKey: ["admin-ctf-missions"],
    queryFn: () => fetch(`${BASE}api/admin/ctf-missions`).then(r => r.json()),
  });

  const save = useMutation({
    mutationFn: async (data: Omit<Mission, "id" | "createdAt">) => {
      const url = editing ? `${BASE}api/admin/ctf-missions/${editing.id}` : `${BASE}api/admin/ctf-missions`;
      const r = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("Error al guardar");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ctf-missions"] }); toast({ title: editing ? "Misión actualizada" : "Misión creada" }); handleClose(); },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}api/admin/ctf-missions/${id}`, { method: "DELETE" }).then(() => {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ctf-missions"] }); toast({ title: "Misión eliminada" }); },
  });

  const handleOpen = (m?: Mission) => {
    if (m) { setEditing(m); setForm({ name: m.name, description: m.description, difficulty: m.difficulty, points: m.points, targetIp: m.targetIp, flagFormat: m.flagFormat, flagValue: m.flagValue, downloadUrl: m.downloadUrl, hints: m.hints, isActive: m.isActive }); }
    else { setEditing(null); setForm(EMPTY); }
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditing(null); setForm(EMPTY); };

  const filtered = missions.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-mono flex items-center gap-2">
            <Target className="h-6 w-6" /> Misiones CTF
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{missions.length} misiones en total</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90 text-black font-mono">
          <Plus className="h-4 w-4 mr-2" /> Nueva Misión
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar misiones..." className="pl-9 bg-card border-primary/20 font-mono" />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12 font-mono">Cargando...</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(m => (
            <Card key={m.id} className="bg-card border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-foreground">{m.name}</span>
                    <Badge className={diffColor[m.difficulty] ?? "bg-muted text-muted-foreground"}>{m.difficulty}</Badge>
                    <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">{m.points} pts</Badge>
                    {!m.isActive && <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Inactiva</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{m.description}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground/60 font-mono">IP: {m.targetIp}</span>
                    {m.flagValue && <span className="flex items-center gap-1 text-xs text-green-400 font-mono"><Flag className="h-3 w-3" />flag configurada</span>}
                    {m.downloadUrl && <a href={m.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline font-mono" onClick={e => e.stopPropagation()}><Download className="h-3 w-3" />descargar máquina</a>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleOpen(m)} className="border-primary/30 hover:border-primary text-primary hover:bg-primary/10">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-red-500/30 hover:border-red-500 text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-primary/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar misión?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará «{m.name}».</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => del.mutate(m.id)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-12 font-mono border border-dashed border-primary/20 rounded-lg">
              {search ? "Sin resultados" : "No hay misiones creadas todavía"}
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={v => !v && handleClose()}>
        <DialogContent className="bg-card border-primary/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary">{editing ? "Editar Misión" : "Nueva Misión CTF"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground">NOMBRE</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-background border-primary/20 font-mono" placeholder="Ej. Buffer Overflow 101" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground">DESCRIPCIÓN</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background border-primary/20 font-mono resize-none" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">DIFICULTAD</Label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
                  <SelectTrigger className="bg-background border-primary/20 font-mono"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    {["facil", "medio", "dificil", "insano"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">PUNTOS</Label>
                <Input type="number" value={form.points} onChange={e => setForm(f => ({ ...f, points: +e.target.value }))} className="bg-background border-primary/20 font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">IP OBJETIVO</Label>
                <Input value={form.targetIp} onChange={e => setForm(f => ({ ...f, targetIp: e.target.value }))} className="bg-background border-primary/20 font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">FORMATO FLAG</Label>
                <Input value={form.flagFormat} onChange={e => setForm(f => ({ ...f, flagFormat: e.target.value }))} className="bg-background border-primary/20 font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground flex items-center gap-1.5"><Flag className="h-3 w-3 text-green-400" />FLAG SECRETA (solo admin)</Label>
              <Input value={form.flagValue ?? ""} onChange={e => setForm(f => ({ ...f, flagValue: e.target.value || null }))} className="bg-background border-green-500/30 font-mono focus:border-green-500/60" placeholder="SpettroWeb{s3cr3t_fl4g_h3r3}" />
              <p className="text-xs text-muted-foreground/50">La flag que los participantes deben encontrar. No se muestra públicamente.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground flex items-center gap-1.5"><Download className="h-3 w-3 text-primary" />LINK DE DESCARGA DE LA MÁQUINA</Label>
              <Input value={form.downloadUrl ?? ""} onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value || null }))} className="bg-background border-primary/20 font-mono" placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground">PISTAS (opcional)</Label>
              <Textarea value={form.hints ?? ""} onChange={e => setForm(f => ({ ...f, hints: e.target.value || null }))} className="bg-background border-primary/20 font-mono resize-none" rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-pink-500" />
              <Label htmlFor="isActive" className="text-sm font-mono cursor-pointer">Misión activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} className="font-mono border-primary/20">Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.name} className="bg-primary hover:bg-primary/90 text-black font-mono">
              {save.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear misión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
