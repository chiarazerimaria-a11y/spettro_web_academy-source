import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Trophy, Search, Swords, Download, Flag } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type Room = {
  id: number; tournamentName: string; round: string;
  squad1Name: string; squad2Name: string;
  squad1Score: number; squad2Score: number;
  machineName: string; machineIp: string;
  machineDownloadUrl: string | null;
  flagFormat: string; flagValue: string | null;
  difficulty: string; status: string;
  maxParticipants: number; currentParticipants: number;
  startedAt: string | null; endedAt: string | null;
  winnerName: string | null; createdAt: string;
};

type RoomForm = {
  tournamentName: string; round: string;
  squad1Name: string; squad2Name: string;
  squad1Score: number; squad2Score: number;
  machineName: string; machineIp: string;
  machineDownloadUrl: string;
  flagFormat: string; flagValue: string;
  difficulty: string; status: string;
  maxParticipants: number; winnerName: string;
};

const EMPTY: RoomForm = {
  tournamentName: "Infiltration Cup 2026", round: "fase de grupos",
  squad1Name: "", squad2Name: "",
  squad1Score: 0, squad2Score: 0,
  machineName: "", machineIp: "10.10.0.1",
  machineDownloadUrl: "",
  flagFormat: "SpettroWeb{...}", flagValue: "",
  difficulty: "medio", status: "esperando",
  maxParticipants: 20, winnerName: "",
};

const statusColor: Record<string, string> = {
  esperando: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  activa: "bg-green-500/20 text-green-400 border-green-500/40",
  finalizada: "bg-muted text-muted-foreground border-muted-foreground/30",
  cancelada: "bg-red-500/20 text-red-400 border-red-500/40",
};

const diffColor: Record<string, string> = {
  facil: "bg-green-500/20 text-green-400 border-green-500/40",
  medio: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  dificil: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  insano: "bg-red-500/20 text-red-400 border-red-500/40",
};

export default function AdminTorneos() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(EMPTY);

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["admin-tournament-rooms"],
    queryFn: () => fetch(`${BASE}api/admin/tournament-rooms`).then(r => r.json()),
  });

  const save = useMutation({
    mutationFn: async (data: RoomForm) => {
      const body = { ...data, winnerName: data.winnerName || null };
      const url = editing ? `${BASE}api/admin/tournament-rooms/${editing.id}` : `${BASE}api/admin/tournament-rooms`;
      const r = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Error al guardar");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-tournament-rooms"] }); toast({ title: editing ? "Sala actualizada" : "Sala creada" }); handleClose(); },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}api/admin/tournament-rooms/${id}`, { method: "DELETE" }).then(() => {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-tournament-rooms"] }); toast({ title: "Sala eliminada" }); },
  });

  const handleOpen = (r?: Room) => {
    if (r) {
      setEditing(r);
      setForm({ tournamentName: r.tournamentName, round: r.round, squad1Name: r.squad1Name, squad2Name: r.squad2Name, squad1Score: r.squad1Score, squad2Score: r.squad2Score, machineName: r.machineName, machineIp: r.machineIp, machineDownloadUrl: r.machineDownloadUrl ?? "", flagFormat: r.flagFormat, flagValue: r.flagValue ?? "", difficulty: r.difficulty, status: r.status, maxParticipants: r.maxParticipants, winnerName: r.winnerName ?? "" });
    } else { setEditing(null); setForm(EMPTY); }
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditing(null); setForm(EMPTY); };

  const filtered = rooms.filter(r =>
    r.tournamentName.toLowerCase().includes(search.toLowerCase()) ||
    r.squad1Name.toLowerCase().includes(search.toLowerCase()) ||
    r.squad2Name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = { esperando: 0, activa: 0, finalizada: 0, cancelada: 0 };
  rooms.forEach(r => { if (r.status in counts) counts[r.status as keyof typeof counts]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-mono flex items-center gap-2">
            <Trophy className="h-6 w-6" /> Torneos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rooms.length} salas · <span className="text-green-400">{counts.activa} activas</span> · <span className="text-amber-400">{counts.esperando} esperando</span>
          </p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90 text-black font-mono">
          <Plus className="h-4 w-4 mr-2" /> Nueva Sala
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar torneos o escuadras..." className="pl-9 bg-card border-primary/20 font-mono" />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12 font-mono">Cargando...</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(r => (
            <Card key={r.id} className="bg-card border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-mono font-bold text-foreground text-sm">{r.tournamentName}</span>
                      <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary/70">{r.round}</Badge>
                      <Badge className={statusColor[r.status] ?? "bg-muted text-muted-foreground"}>{r.status}</Badge>
                      <Badge className={diffColor[r.difficulty] ?? "bg-muted text-muted-foreground"}>{r.difficulty}</Badge>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-secondary font-bold">{r.squad1Name}</span>
                      <div className="flex items-center gap-1 text-primary font-bold text-lg">
                        <span>{r.squad1Score}</span>
                        <Swords className="h-4 w-4 text-muted-foreground mx-1" />
                        <span>{r.squad2Score}</span>
                      </div>
                      <span className="text-secondary font-bold">{r.squad2Name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs font-mono text-muted-foreground/60">
                      <span>Máquina: {r.machineName} ({r.machineIp})</span>
                      <span>{r.currentParticipants}/{r.maxParticipants} participantes</span>
                      {r.flagValue && <span className="flex items-center gap-1 text-green-400"><Flag className="h-3 w-3" />flag configurada</span>}
                      {r.machineDownloadUrl && <a href={r.machineDownloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline" onClick={e => e.stopPropagation()}><Download className="h-3 w-3" />descargar VM</a>}
                      {r.winnerName && <span className="text-primary">🏆 {r.winnerName}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleOpen(r)} className="border-primary/30 hover:border-primary text-primary hover:bg-primary/10">
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
                          <AlertDialogTitle>¿Eliminar sala?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la sala «{r.tournamentName} — {r.squad1Name} vs {r.squad2Name}».</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del.mutate(r.id)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-12 font-mono border border-dashed border-primary/20 rounded-lg">
              {search ? "Sin resultados" : "No hay salas de torneo creadas todavía"}
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={v => !v && handleClose()}>
        <DialogContent className="bg-card border-primary/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary">{editing ? "Editar Sala" : "Nueva Sala de Torneo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs font-mono text-muted-foreground">NOMBRE DEL TORNEO</Label>
                <Input value={form.tournamentName} onChange={e => setForm(f => ({ ...f, tournamentName: e.target.value }))} className="bg-background border-primary/20 font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">RONDA</Label>
                <Select value={form.round} onValueChange={v => setForm(f => ({ ...f, round: v }))}>
                  <SelectTrigger className="bg-background border-primary/20 font-mono"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    {["fase de grupos","octavos","cuartos","semifinal","final"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">ESTADO</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-background border-primary/20 font-mono"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    {["esperando","activa","finalizada","cancelada"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">ESCUADRA 1</Label>
                <Input value={form.squad1Name} onChange={e => setForm(f => ({ ...f, squad1Name: e.target.value }))} className="bg-background border-primary/20 font-mono" placeholder="Ghost Protocol" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">ESCUADRA 2</Label>
                <Input value={form.squad2Name} onChange={e => setForm(f => ({ ...f, squad2Name: e.target.value }))} className="bg-background border-primary/20 font-mono" placeholder="Red Storm" />
              </div>
            </div>
            {editing && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-mono text-muted-foreground">PUNTOS ESC. 1</Label>
                  <Input type="number" value={form.squad1Score} onChange={e => setForm(f => ({ ...f, squad1Score: +e.target.value }))} className="bg-background border-primary/20 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-mono text-muted-foreground">PUNTOS ESC. 2</Label>
                  <Input type="number" value={form.squad2Score} onChange={e => setForm(f => ({ ...f, squad2Score: +e.target.value }))} className="bg-background border-primary/20 font-mono" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">MÁQUINA</Label>
                <Input value={form.machineName} onChange={e => setForm(f => ({ ...f, machineName: e.target.value }))} className="bg-background border-primary/20 font-mono" placeholder="Matrix Zero" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">IP MÁQUINA</Label>
                <Input value={form.machineIp} onChange={e => setForm(f => ({ ...f, machineIp: e.target.value }))} className="bg-background border-primary/20 font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground flex items-center gap-1.5"><Download className="h-3 w-3 text-primary" />LINK DE DESCARGA DE LA MÁQUINA</Label>
              <Input value={form.machineDownloadUrl} onChange={e => setForm(f => ({ ...f, machineDownloadUrl: e.target.value }))} className="bg-background border-primary/20 font-mono" placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground flex items-center gap-1.5"><Flag className="h-3 w-3 text-green-400" />FLAG SECRETA (solo admin)</Label>
              <Input value={form.flagValue} onChange={e => setForm(f => ({ ...f, flagValue: e.target.value }))} className="bg-background border-green-500/30 font-mono focus:border-green-500/60" placeholder="SpettroWeb{s3cr3t_fl4g_h3r3}" />
              <p className="text-xs text-muted-foreground/50">El equipo que envíe esta flag exacta gana automáticamente la sala.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">DIFICULTAD</Label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
                  <SelectTrigger className="bg-background border-primary/20 font-mono"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    {["facil","medio","dificil","insano"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">MÁX. PARTICIPANTES</Label>
                <Input type="number" value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: +e.target.value }))} className="bg-background border-primary/20 font-mono" />
              </div>
            </div>
            {editing && (
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">GANADORA (dejar vacío si no hay)</Label>
                <Input value={form.winnerName} onChange={e => setForm(f => ({ ...f, winnerName: e.target.value }))} className="bg-background border-primary/20 font-mono" placeholder="Nombre de la escuadra ganadora" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} className="font-mono border-primary/20">Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.squad1Name || !form.squad2Name} className="bg-primary hover:bg-primary/90 text-black font-mono">
              {save.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear sala"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
