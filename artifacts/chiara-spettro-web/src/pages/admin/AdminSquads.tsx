import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Shield, Search, Trophy, Skull } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type Squad = {
  id: number; name: string; slug: string; captainName: string;
  description: string | null; emblem: string; memberCount: number;
  totalPoints: number; level: number; wins: number; losses: number;
  status: string; isBot: boolean; aiDifficulty: string | null; createdAt: string;
};

type SquadForm = {
  name: string; captainName: string; description: string;
  emblem: string; status: string; isBot: boolean; aiDifficulty: string;
  totalPoints: number; wins: number; losses: number;
};

const EMPTY: SquadForm = {
  name: "", captainName: "", description: "", emblem: "skull",
  status: "activa", isBot: false, aiDifficulty: "", totalPoints: 0, wins: 0, losses: 0,
};

const statusColor: Record<string, string> = {
  activa: "bg-green-500/20 text-green-400 border-green-500/40",
  inactiva: "bg-muted text-muted-foreground border-muted-foreground/30",
  suspendida: "bg-red-500/20 text-red-400 border-red-500/40",
};

export default function AdminSquads() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Squad | null>(null);
  const [form, setForm] = useState<SquadForm>(EMPTY);

  const { data: squads = [], isLoading } = useQuery<Squad[]>({
    queryKey: ["admin-squads"],
    queryFn: () => fetch(`${BASE}api/admin/squads`).then(r => r.json()),
  });

  const save = useMutation({
    mutationFn: async (data: SquadForm) => {
      const body = { ...data, aiDifficulty: data.aiDifficulty || null };
      const url = editing ? `${BASE}api/admin/squads/${editing.id}` : `${BASE}api/admin/squads`;
      const r = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Error al guardar");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-squads"] }); toast({ title: editing ? "Squad actualizado" : "Squad creado" }); handleClose(); },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}api/admin/squads/${id}`, { method: "DELETE" }).then(() => {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-squads"] }); toast({ title: "Squad eliminado" }); },
  });

  const handleOpen = (s?: Squad) => {
    if (s) {
      setEditing(s);
      setForm({ name: s.name, captainName: s.captainName, description: s.description ?? "", emblem: s.emblem, status: s.status, isBot: s.isBot, aiDifficulty: s.aiDifficulty ?? "", totalPoints: s.totalPoints, wins: s.wins, losses: s.losses });
    } else { setEditing(null); setForm(EMPTY); }
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditing(null); setForm(EMPTY); };

  const filtered = squads.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.captainName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-mono flex items-center gap-2">
            <Shield className="h-6 w-6" /> Escuadras
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{squads.length} escuadras · {squads.filter(s => s.isBot).length} bots</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90 text-black font-mono">
          <Plus className="h-4 w-4 mr-2" /> Nueva Escuadra
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar escuadras..." className="pl-9 bg-card border-primary/20 font-mono" />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12 font-mono">Cargando...</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(s => (
            <Card key={s.id} className="bg-card border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-2xl w-10 text-center shrink-0" title={s.emblem}>{s.emblem === "skull" ? "💀" : s.emblem === "ghost" ? "👻" : s.emblem === "dragon" ? "🐉" : s.emblem === "wolf" ? "🐺" : "🛡️"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-foreground">{s.name}</span>
                    {s.isBot && <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/40 text-xs">BOT</Badge>}
                    <Badge className={statusColor[s.status] ?? "bg-muted text-muted-foreground"}>{s.status}</Badge>
                    <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">Lvl {s.level}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">Capitán: {s.captainName} · {s.memberCount} miembros</p>
                  <div className="flex gap-3 mt-1.5 text-xs font-mono">
                    <span className="text-green-400 flex items-center gap-1"><Trophy className="h-3 w-3" />{s.wins}W</span>
                    <span className="text-red-400 flex items-center gap-1"><Skull className="h-3 w-3" />{s.losses}L</span>
                    <span className="text-primary">{s.totalPoints} pts</span>
                    {s.isBot && s.aiDifficulty && <span className="text-violet-400">IA: {s.aiDifficulty}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleOpen(s)} className="border-primary/30 hover:border-primary text-primary hover:bg-primary/10">
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
                        <AlertDialogTitle>¿Eliminar escuadra?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará «{s.name}».</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => del.mutate(s.id)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-12 font-mono border border-dashed border-primary/20 rounded-lg">
              {search ? "Sin resultados" : "No hay escuadras creadas todavía"}
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={v => !v && handleClose()}>
        <DialogContent className="bg-card border-primary/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary">{editing ? "Editar Escuadra" : "Nueva Escuadra"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">NOMBRE</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-background border-primary/20 font-mono" placeholder="Ghost Protocol" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">CAPITÁN</Label>
                <Input value={form.captainName} onChange={e => setForm(f => ({ ...f, captainName: e.target.value }))} className="bg-background border-primary/20 font-mono" placeholder="user_name" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground">DESCRIPCIÓN (opcional)</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background border-primary/20 font-mono resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">EMBLEMA</Label>
                <Select value={form.emblem} onValueChange={v => setForm(f => ({ ...f, emblem: v }))}>
                  <SelectTrigger className="bg-background border-primary/20 font-mono"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    {[["skull","💀 Calavera"],["ghost","👻 Fantasma"],["dragon","🐉 Dragón"],["wolf","🐺 Lobo"],["shield","🛡️ Escudo"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">ESTADO</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-background border-primary/20 font-mono"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    {["activa","inactiva","suspendida"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editing && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-mono text-muted-foreground">PUNTOS</Label>
                  <Input type="number" value={form.totalPoints} onChange={e => setForm(f => ({ ...f, totalPoints: +e.target.value }))} className="bg-background border-primary/20 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-mono text-muted-foreground">VICTORIAS</Label>
                  <Input type="number" value={form.wins} onChange={e => setForm(f => ({ ...f, wins: +e.target.value }))} className="bg-background border-primary/20 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-mono text-muted-foreground">DERROTAS</Label>
                  <Input type="number" value={form.losses} onChange={e => setForm(f => ({ ...f, losses: +e.target.value }))} className="bg-background border-primary/20 font-mono" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isBot" checked={form.isBot} onChange={e => setForm(f => ({ ...f, isBot: e.target.checked }))} className="accent-violet-500" />
                <Label htmlFor="isBot" className="text-sm font-mono cursor-pointer">Es un bot (IA)</Label>
              </div>
              {form.isBot && (
                <Select value={form.aiDifficulty || "facil"} onValueChange={v => setForm(f => ({ ...f, aiDifficulty: v }))}>
                  <SelectTrigger className="bg-background border-primary/20 font-mono w-36"><SelectValue placeholder="Dificultad IA" /></SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    {["facil","medio","dificil","insano"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} className="font-mono border-primary/20">Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.name || !form.captainName} className="bg-primary hover:bg-primary/90 text-black font-mono">
              {save.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear escuadra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
