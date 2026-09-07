import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListSubscribers, useCreateSubscriber, useUpdateSubscriber, useDeleteSubscriber, getListSubscribersQueryKey, Subscriber, SubscriberStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Plus, Edit, Trash2, CheckCircle, Clock, XCircle, Terminal } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Subscribers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: subscribers, isLoading, isError } = useListSubscribers();
  
  const createSub = useCreateSubscriber({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListSubscribersQueryKey() }); toast({ title: "Abonado creado", description: "El abonado ha sido registrado con éxito." }); setCreateOpen(false); } } });
  const updateSub = useUpdateSubscriber({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListSubscribersQueryKey() }); toast({ title: "Abonado actualizado" }); setEditOpen(false); setEditingSub(null); } } });
  const deleteSub = useDeleteSubscriber({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListSubscribersQueryKey() }); toast({ title: "Abonado eliminado" }); } } });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscriber | null>(null);

  const filteredSubscribers = useMemo(() => {
    if (!subscribers) return [];
    return subscribers.filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(search.toLowerCase()) || sub.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "todos" || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscribers, search, statusFilter]);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSub.mutate({
      data: {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        plan: (formData.get("plan") as string) || "Basico",
        status: (formData.get("status") as SubscriberStatus) || "active",
        notes: (formData.get("notes") as string) || null,
      }
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSub) return;
    const formData = new FormData(e.currentTarget);
    updateSub.mutate({
      id: editingSub.id,
      data: {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        plan: (formData.get("plan") as string),
        status: formData.get("status") as SubscriberStatus,
        notes: formData.get("notes") as string,
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-primary/20 text-primary border-primary/50 hover:bg-primary/30">Activo</Badge>;
      case "trial": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50 hover:bg-amber-500/30">Trial</Badge>;
      case "inactive": return <Badge className="bg-muted text-muted-foreground border-muted-foreground/30 hover:bg-muted/80">Inactivo</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <span className="text-secondary animate-pulse">&gt;</span> System.Subscribers
          </h1>
          <p className="text-muted-foreground">Gestión de alumnos matriculados en la academia.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,77,184,0.3)]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo abonado
            </Button>
          </DialogTrigger>
          <DialogContent className="border-primary/50 bg-card">
            <DialogHeader>
              <DialogTitle className="font-mono text-primary flex items-center gap-2">
                <Terminal className="h-4 w-4" /> root@create_subscriber
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" required className="bg-background/50 border-primary/30 focus-visible:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="bg-background/50 border-primary/30 focus-visible:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Input id="plan" name="plan" defaultValue="Basico" className="bg-background/50 border-primary/30 focus-visible:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select name="status" defaultValue="active">
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" name="notes" className="bg-background/50 border-primary/30 focus-visible:ring-primary" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createSub.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {createSub.isPending ? "Creando..." : "Registrar Abonado"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/40 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-primary/20 focus-visible:ring-primary w-full"
              />
            </div>
            <div className="w-full sm:w-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Estado:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-background/50 border-primary/20">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="trial">Trials</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-primary/20 overflow-x-auto">
            <Table>
              <TableHeader className="bg-background/50">
                <TableRow className="border-primary/20 hover:bg-transparent">
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Alta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-primary/10">
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSubscribers.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                        <Terminal className="h-8 w-8 mb-2 opacity-50" />
                        <p className="font-mono text-lg text-primary/70">&gt;_ No hay abonados todavia.</p>
                        <p className="font-mono text-sm opacity-70">Esperando primer registro...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <TableRow key={sub.id} className="border-primary/10 hover:bg-primary/5 transition-colors">
                      <TableCell className="font-mono text-muted-foreground">#{sub.id}</TableCell>
                      <TableCell className="font-medium text-foreground">{sub.name}</TableCell>
                      <TableCell className="text-muted-foreground">{sub.email}</TableCell>
                      <TableCell className="font-mono text-xs">{sub.plan}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(sub.joinedAt), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="hidden sm:flex border border-primary/20 rounded-md overflow-hidden bg-background/30 mr-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-8 w-8 rounded-none hover:bg-primary/20 hover:text-primary ${sub.status === 'active' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                              onClick={() => updateSub.mutate({ id: sub.id, data: { status: "active" } })}
                              title="Marcar activo"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-8 w-8 rounded-none hover:bg-amber-500/20 hover:text-amber-500 ${sub.status === 'trial' ? 'bg-amber-500/10 text-amber-500' : 'text-muted-foreground'}`}
                              onClick={() => updateSub.mutate({ id: sub.id, data: { status: "trial" } })}
                              title="Marcar trial"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-8 w-8 rounded-none hover:bg-muted/80 hover:text-foreground ${sub.status === 'inactive' ? 'bg-muted/50 text-foreground' : 'text-muted-foreground'}`}
                              onClick={() => updateSub.mutate({ id: sub.id, data: { status: "inactive" } })}
                              title="Marcar inactivo"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 border-primary/30 hover:bg-primary/20 hover:text-primary"
                            onClick={() => { setEditingSub(sub); setEditOpen(true); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8 border-destructive/30 hover:bg-destructive/20 hover:text-destructive text-destructive/70">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-destructive/50 bg-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                  <Terminal className="h-4 w-4" /> sudo rm -rf /subscribers/{sub.id}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que deseas eliminar al abonado <span className="font-bold text-foreground">{sub.name}</span>? Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-primary/20 hover:bg-primary/10">Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteSub.mutate({ id: sub.id })}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if(!open) setEditingSub(null); }}>
        <DialogContent className="border-primary/50 bg-card">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary flex items-center gap-2">
              <Terminal className="h-4 w-4" /> root@edit_subscriber --id={editingSub?.id}
            </DialogTitle>
          </DialogHeader>
          {editingSub && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input id="edit-name" name="name" defaultValue={editingSub.name} required className="bg-background/50 border-primary/30 focus-visible:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" name="email" type="email" defaultValue={editingSub.email} required className="bg-background/50 border-primary/30 focus-visible:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-plan">Plan</Label>
                  <Input id="edit-plan" name="plan" defaultValue={editingSub.plan} className="bg-background/50 border-primary/30 focus-visible:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estado</Label>
                  <Select name="status" defaultValue={editingSub.status}>
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notas</Label>
                <Textarea id="edit-notes" name="notes" defaultValue={editingSub.notes || ""} className="bg-background/50 border-primary/30 focus-visible:ring-primary" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateSub.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {updateSub.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
