import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListMachines, useCreateMachine, useUpdateMachine, useDeleteMachine, getListMachinesQueryKey, Machine, MachineDifficulty, MachineStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Terminal, Server, Play, CheckCircle2, Shield, Network, ChevronRight, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLATFORMS = ["HackTheBox", "TryHackMe", "DockerLabs", "VulnYX", "OffSec PG", "Otra"];

export default function Machines() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: machines, isLoading } = useListMachines();
  
  const createMachine = useCreateMachine({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListMachinesQueryKey() }); toast({ title: "Máquina añadida" }); setCreateOpen(false); } } });
  const updateMachine = useUpdateMachine({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListMachinesQueryKey() }); toast({ title: "Máquina actualizada" }); setEditOpen(false); setEditingMachine(null); } } });
  const deleteMachine = useDeleteMachine({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListMachinesQueryKey() }); toast({ title: "Máquina eliminada" }); } } });

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("todas");
  
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const filteredMachines = useMemo(() => {
    if (!machines) return [];
    return machines.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchesPlatform = platformFilter.length === 0 || platformFilter.includes(m.platform);
      const matchesDiff = difficultyFilter === "todas" || m.difficulty === difficultyFilter;
      return matchesSearch && matchesPlatform && matchesDiff;
    });
  }, [machines, search, platformFilter, difficultyFilter]);

  const columns = {
    planificada: filteredMachines.filter(m => m.status === "planificada"),
    en_progreso: filteredMachines.filter(m => m.status === "en_progreso"),
    completada: filteredMachines.filter(m => m.status === "completada"),
  };

  const stats = useMemo(() => {
    if (!machines) return { total: 0, completed: 0, points: 0 };
    return machines.reduce((acc, m) => {
      acc.total++;
      if (m.status === "completada") {
        acc.completed++;
        acc.points += m.points;
      }
      return acc;
    }, { total: 0, completed: 0, points: 0 });
  }, [machines]);

  const togglePlatformFilter = (platform: string) => {
    setPlatformFilter(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMachine.mutate({
      data: {
        name: formData.get("name") as string,
        platform: formData.get("platform") as string,
        difficulty: formData.get("difficulty") as MachineDifficulty,
        status: (formData.get("status") as MachineStatus) || "planificada",
        points: Number(formData.get("points") || 0),
        ip: (formData.get("ip") as string) || null,
        os: (formData.get("os") as string) || null,
        techniques: (formData.get("techniques") as string) || null,
        writeupUrl: (formData.get("writeupUrl") as string) || null,
        videoUrl: (formData.get("videoUrl") as string) || null,
        downloadUrl: (formData.get("downloadUrl") as string) || null,
        thumbnailUrl: (formData.get("thumbnailUrl") as string) || null,
      } as any
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMachine) return;
    const formData = new FormData(e.currentTarget);
    updateMachine.mutate({
      id: editingMachine.id,
      data: {
        name: formData.get("name") as string,
        platform: formData.get("platform") as string,
        difficulty: formData.get("difficulty") as MachineDifficulty,
        status: formData.get("status") as MachineStatus,
        points: Number(formData.get("points") || 0),
        ip: (formData.get("ip") as string) || null,
        os: (formData.get("os") as string) || null,
        techniques: (formData.get("techniques") as string) || null,
        writeupUrl: (formData.get("writeupUrl") as string) || null,
        videoUrl: (formData.get("videoUrl") as string) || null,
        downloadUrl: (formData.get("downloadUrl") as string) || null,
        thumbnailUrl: (formData.get("thumbnailUrl") as string) || null,
      } as any
    });
  };

  const updateStatus = (id: number, status: MachineStatus) => {
    updateMachine.mutate({ id, data: { status } });
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "HackTheBox": return "bg-green-500/20 text-green-500 border-green-500/50";
      case "TryHackMe": return "bg-red-500/20 text-red-500 border-red-500/50";
      case "DockerLabs": return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      case "VulnYX": return "bg-purple-500/20 text-purple-500 border-purple-500/50";
      case "OffSec PG": return "bg-primary/20 text-primary border-primary/50";
      default: return "bg-primary/20 text-primary border-primary/50";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "facil": return "text-primary border-primary/30 shadow-[0_0_10px_rgba(255,77,184,0.1)]";
      case "medio": return "text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
      case "dificil": return "text-secondary border-secondary/30 shadow-[0_0_10px_rgba(155,85,249,0.1)]";
      case "insano": return "text-destructive border-destructive/30 shadow-[0_0_10px_rgba(255,0,0,0.2)]";
      default: return "text-muted-foreground border-border";
    }
  };

  const getDifficultyGlow = (difficulty: string) => {
    switch (difficulty) {
      case "facil": return "border-primary/20 hover:border-primary/50";
      case "medio": return "border-amber-500/20 hover:border-amber-500/50";
      case "dificil": return "border-secondary/20 hover:border-secondary/50";
      case "insano": return "border-destructive/20 hover:border-destructive/50";
      default: return "border-primary/20";
    }
  };

  const MissionCard = ({ machine }: { machine: Machine }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`bg-card/60 backdrop-blur transition-all ${getDifficultyGlow(machine.difficulty)} relative overflow-hidden group`}>
        {/* Animated scanline specific to card */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-primary/30 transform -translate-y-full group-hover:translate-y-[200px] transition-transform duration-1000 ease-linear opacity-0 group-hover:opacity-100" />
        
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <Badge variant="outline" className={`${getPlatformBadge(machine.platform)} font-mono text-[10px]`}>
              {machine.platform}
            </Badge>
            <Badge variant="outline" className={`${getDifficultyColor(machine.difficulty)} font-mono uppercase text-[10px]`}>
              {machine.difficulty}
            </Badge>
          </div>
          
          <div>
            <h3 className="font-mono text-xl font-bold leading-none tracking-tight">{machine.name}</h3>
            {machine.ip && <div className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-1"><Network className="h-3 w-3" /> {machine.ip}</div>}
          </div>

          <div className="flex justify-between items-end border-t border-primary/10 pt-2">
            <div className="text-xs text-muted-foreground font-mono space-y-1">
              {machine.os && <div className="flex items-center gap-1"><Shield className="h-3 w-3" /> {machine.os}</div>}
            </div>
            <div className="font-mono font-bold text-lg text-primary glow-text">+{machine.points} <span className="text-[10px] text-muted-foreground">PTS</span></div>
          </div>

          {machine.techniques && (
            <div className="text-[10px] font-mono text-muted-foreground/80 line-clamp-2 bg-background/50 p-1 rounded border border-primary/10">
              {machine.techniques}
            </div>
          )}

          <div className="flex gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity h-0 group-hover:h-auto overflow-hidden">
            {machine.status === "planificada" && (
              <Button size="sm" className="flex-1 h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => updateStatus(machine.id, "en_progreso")}>
                <Play className="h-3 w-3 mr-1" /> Iniciar
              </Button>
            )}
            {machine.status === "en_progreso" && (
              <Button size="sm" className="flex-1 h-7 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => updateStatus(machine.id, "completada")}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Pwned!
              </Button>
            )}
            <Button size="icon" variant="outline" className="h-7 w-7 border-primary/30 hover:bg-primary/20" onClick={() => { setEditingMachine(machine); setEditOpen(true); }}>
              <Edit className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="outline" className="h-7 w-7 border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-destructive/50 bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive flex items-center gap-2">
                    <Terminal className="h-4 w-4" /> sudo rm -rf /machine/{machine.name}
                  </AlertDialogTitle>
                  <AlertDialogDescription>¿Destruir el registro de la máquina {machine.name}?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-primary/20 hover:bg-primary/10">Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteMachine.mutate({ id: machine.id })}>Destruir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <span className="text-secondary animate-pulse">&gt;</span> System.Missions
          </h1>
          <div className="flex gap-4 font-mono text-sm border border-primary/20 bg-background/50 p-2 rounded-md shadow-[0_0_10px_rgba(255,77,184,0.05)]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Misiones Completadas: <span className="text-foreground">{stats.completed}/{stats.total}</span></span>
            </div>
            <div className="w-px bg-primary/20"></div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Terminal className="h-4 w-4 text-secondary" />
              <span>Puntos Totales: <span className="text-foreground glow-text">{stats.points}</span></span>
            </div>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,77,184,0.3)]">
              <Plus className="mr-2 h-4 w-4" /> Nueva Máquina
            </Button>
          </DialogTrigger>
          <DialogContent className="border-primary/50 bg-card max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-mono text-primary flex items-center gap-2">
                <Terminal className="h-4 w-4" /> root@add_mission
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" required className="bg-background/50 border-primary/30 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Plataforma</Label>
                  <Select name="platform" defaultValue="HackTheBox">
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Dificultad</Label>
                  <Select name="difficulty" defaultValue="facil">
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                      <SelectItem value="insano">Insano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado Inicial</Label>
                  <Select name="status" defaultValue="planificada">
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planificada">Planificada</SelectItem>
                      <SelectItem value="en_progreso">En Progreso</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Puntos</Label>
                  <Input id="points" name="points" type="number" min="0" defaultValue="10" required className="bg-background/50 border-primary/30 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip">IP Obj (Opcional)</Label>
                  <Input id="ip" name="ip" className="bg-background/50 border-primary/30 font-mono" placeholder="10.10.x.x" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="os">OS (Opcional)</Label>
                  <Input id="os" name="os" className="bg-background/50 border-primary/30" placeholder="Linux / Windows" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="techniques">Técnicas / Tags</Label>
                  <Textarea id="techniques" name="techniques" className="bg-background/50 border-primary/30 h-16" placeholder="SQLi, RCE, Privilege Escalation..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="writeupUrl">Writeup URL</Label>
                  <Input id="writeupUrl" name="writeupUrl" className="bg-background/50 border-primary/30" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video Walkthrough URL</Label>
                  <Input id="videoUrl" name="videoUrl" className="bg-background/50 border-primary/30" placeholder="https://youtube.com/..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="downloadUrl">Link de Descarga de la Máquina</Label>
                  <Input id="downloadUrl" name="downloadUrl" className="bg-background/50 border-primary/30" placeholder="https://vulnyx.com/machines/..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Miniatura (URL imagen)</Label>
                  <Input id="thumbnailUrl" name="thumbnailUrl" className="bg-background/50 border-primary/30" placeholder="https://..." />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createMachine.isPending} className="bg-primary text-primary-foreground w-full">
                  {createMachine.isPending ? "Procesando..." : "Cargar Misión"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <div className="bg-card/40 border border-primary/20 rounded-lg p-3 shrink-0 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar misión..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-primary/20 focus-visible:ring-primary h-9 font-mono"
          />
        </div>
        
        <div className="flex-1 overflow-x-auto w-full hide-scrollbar">
          <div className="flex gap-2 min-w-max pb-1">
            <Badge 
              variant="outline" 
              className={`cursor-pointer px-3 py-1 text-sm border-dashed ${platformFilter.length === 0 ? 'bg-primary/20 text-primary border-primary' : 'hover:bg-primary/10'}`}
              onClick={() => setPlatformFilter([])}
            >
              Todas
            </Badge>
            {PLATFORMS.map(p => (
              <Badge 
                key={p} 
                variant="outline" 
                className={`cursor-pointer px-3 py-1 text-sm ${platformFilter.includes(p) ? getPlatformBadge(p) : 'hover:bg-accent/10 border-border'}`}
                onClick={() => togglePlatformFilter(p)}
              >
                {p}
              </Badge>
            ))}
          </div>
        </div>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full md:w-32 bg-background/50 border-primary/20 h-9 text-xs font-mono">
            <SelectValue placeholder="Dificultad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="facil">Fácil</SelectItem>
            <SelectItem value="medio">Medio</SelectItem>
            <SelectItem value="dificil">Difícil</SelectItem>
            <SelectItem value="insano">Insano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6 flex-1 min-h-0">
          {[1,2,3].map(i => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="h-8 w-full bg-card/60" />
              <Skeleton className="h-32 w-full bg-card/40" />
              <Skeleton className="h-32 w-full bg-card/40" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 flex-1 min-h-0 pb-6">
          {/* Column 1 */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <h2 className="font-mono font-bold text-lg text-muted-foreground border-b-2 border-primary/20 pb-2 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-2"><Server className="h-4 w-4" /> PLANIFICADA</span>
              <span className="text-xs bg-background px-2 py-0.5 rounded border border-primary/20">[{columns.planificada.length}]</span>
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <AnimatePresence>
                {columns.planificada.map(m => <MissionCard key={m.id} machine={m} />)}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <h2 className="font-mono font-bold text-lg text-secondary border-b-2 border-secondary/50 pb-2 flex items-center justify-between shrink-0 glow-text">
              <span className="flex items-center gap-2"><Play className="h-4 w-4" /> EN_PROGRESO</span>
              <span className="text-xs bg-secondary/10 px-2 py-0.5 rounded border border-secondary/30">[{columns.en_progreso.length}]</span>
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <AnimatePresence>
                {columns.en_progreso.map(m => <MissionCard key={m.id} machine={m} />)}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <h2 className="font-mono font-bold text-lg text-primary border-b-2 border-primary/50 pb-2 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> COMPLETADA</span>
              <span className="text-xs bg-primary/10 px-2 py-0.5 rounded border border-primary/30">[{columns.completada.length}]</span>
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <AnimatePresence>
                {columns.completada.map(m => <MissionCard key={m.id} machine={m} />)}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if(!open) setEditingMachine(null); }}>
        <DialogContent className="border-primary/50 bg-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary flex items-center gap-2">
              <Terminal className="h-4 w-4" /> root@edit_mission --target={editingMachine?.name}
            </DialogTitle>
          </DialogHeader>
          {editingMachine && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input id="edit-name" name="name" defaultValue={editingMachine.name} required className="bg-background/50 border-primary/30 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-platform">Plataforma</Label>
                  <Select name="platform" defaultValue={editingMachine.platform}>
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-difficulty">Dificultad</Label>
                  <Select name="difficulty" defaultValue={editingMachine.difficulty}>
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                      <SelectItem value="insano">Insano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estado</Label>
                  <Select name="status" defaultValue={editingMachine.status}>
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planificada">Planificada</SelectItem>
                      <SelectItem value="en_progreso">En Progreso</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-points">Puntos</Label>
                  <Input id="edit-points" name="points" type="number" min="0" defaultValue={editingMachine.points} required className="bg-background/50 border-primary/30 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ip">IP Obj</Label>
                  <Input id="edit-ip" name="ip" defaultValue={editingMachine.ip || ""} className="bg-background/50 border-primary/30 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-os">OS</Label>
                  <Input id="edit-os" name="os" defaultValue={editingMachine.os || ""} className="bg-background/50 border-primary/30" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-techniques">Técnicas / Tags</Label>
                  <Textarea id="edit-techniques" name="techniques" defaultValue={editingMachine.techniques || ""} className="bg-background/50 border-primary/30 h-16" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-writeupUrl">Writeup URL</Label>
                  <Input id="edit-writeupUrl" name="writeupUrl" defaultValue={editingMachine.writeupUrl || ""} className="bg-background/50 border-primary/30" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-videoUrl">Video Walkthrough URL</Label>
                  <Input id="edit-videoUrl" name="videoUrl" defaultValue={editingMachine.videoUrl || ""} className="bg-background/50 border-primary/30" placeholder="https://youtube.com/..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-downloadUrl">Link de Descarga de la Máquina</Label>
                  <Input id="edit-downloadUrl" name="downloadUrl" defaultValue={(editingMachine as any).downloadUrl || ""} className="bg-background/50 border-primary/30" placeholder="https://vulnyx.com/machines/..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-thumbnailUrl">Miniatura (URL imagen)</Label>
                  <Input id="edit-thumbnailUrl" name="thumbnailUrl" defaultValue={(editingMachine as any).thumbnailUrl || ""} className="bg-background/50 border-primary/30" placeholder="https://..." />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={updateMachine.isPending} className="bg-primary text-primary-foreground w-full">
                  {updateMachine.isPending ? "Guardando..." : "Actualizar Misión"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
