import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListPayments, useCreatePayment, useUpdatePayment, useDeletePayment, getListPaymentsQueryKey, Payment, PaymentMethod, PaymentStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, Terminal, CheckCircle2, XCircle, RotateCcw, CreditCard, Receipt } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Payments() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: payments, isLoading } = useListPayments();
  
  const createPayment = useCreatePayment({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() }); toast({ title: "Pago registrado" }); setCreateOpen(false); } } });
  const updatePayment = useUpdatePayment({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() }); toast({ title: "Pago actualizado" }); setEditOpen(false); setEditingPayment(null); } } });
  const deletePayment = useDeletePayment({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() }); toast({ title: "Pago eliminado" }); } } });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [methodFilter, setMethodFilter] = useState<string>("todos");
  
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter(payment => {
      const searchStr = search.toLowerCase();
      const matchesSearch = payment.reference.toLowerCase().includes(searchStr) || 
                            payment.subscriberName.toLowerCase().includes(searchStr) ||
                            (payment.bank?.toLowerCase() || "").includes(searchStr);
      
      const matchesStatus = statusFilter === "todos" || payment.status === statusFilter;
      const matchesMethod = methodFilter === "todos" || payment.method === methodFilter;
      
      return matchesSearch && matchesStatus && matchesMethod;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [payments, search, statusFilter, methodFilter]);

  const summary = useMemo(() => {
    if (!filteredPayments) return { total: 0, pagado: 0, pendiente: 0 };
    return filteredPayments.reduce((acc, p) => {
      acc.total += p.amount;
      if (p.status === "pagado") acc.pagado += p.amount;
      if (p.status === "pendiente") acc.pendiente += p.amount;
      return acc;
    }, { total: 0, pagado: 0, pendiente: 0 });
  }, [filteredPayments]);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPayment.mutate({
      data: {
        subscriberName: formData.get("subscriberName") as string,
        amount: Number(formData.get("amount")),
        method: formData.get("method") as PaymentMethod,
        status: (formData.get("status") as PaymentStatus) || "pendiente",
        reference: (formData.get("reference") as string) || `REF-${Date.now().toString().slice(-6)}`,
        bank: (formData.get("bank") as string) || null,
      }
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPayment) return;
    const formData = new FormData(e.currentTarget);
    updatePayment.mutate({
      id: editingPayment.id,
      data: {
        amount: Number(formData.get("amount")),
        method: formData.get("method") as PaymentMethod,
        status: formData.get("status") as PaymentStatus,
        reference: formData.get("reference") as string,
        bank: (formData.get("bank") as string) || null,
      }
    });
  };

  const setStatus = (id: number, status: PaymentStatus) => {
    updatePayment.mutate({ id, data: { status } });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pagado": return <Badge className="bg-primary/20 text-primary border-primary/50">Pagado</Badge>;
      case "pendiente": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50">Pendiente</Badge>;
      case "fallido": return <Badge className="bg-secondary/20 text-secondary border-secondary/50">Fallido</Badge>;
      case "reembolsado": return <Badge className="bg-muted text-muted-foreground border-muted-foreground/30">Reembolsado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    return <Badge variant="outline" className="font-mono text-xs uppercase">{method}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <span className="text-secondary animate-pulse">&gt;</span> System.Payments
          </h1>
          <p className="text-muted-foreground">Registro de transacciones y conciliación bancaria.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,77,184,0.3)]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Pago
            </Button>
          </DialogTrigger>
          <DialogContent className="border-primary/50 bg-card max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-mono text-primary flex items-center gap-2">
                <Terminal className="h-4 w-4" /> root@create_tx
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="subscriberName">Abonado (Nombre)</Label>
                  <Input id="subscriberName" name="subscriberName" required className="bg-background/50 border-primary/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Importe (€)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" required className="bg-background/50 border-primary/30 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Referencia</Label>
                  <Input id="reference" name="reference" className="bg-background/50 border-primary/30 font-mono text-sm" placeholder="Auto-generada si se omite" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Método</Label>
                  <Select name="method" defaultValue="transferencia">
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bizum">Bizum</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select name="status" defaultValue="pagado">
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="fallido">Fallido</SelectItem>
                      <SelectItem value="reembolsado">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="bank">Banco / Origen (Opcional)</Label>
                  <Input id="bank" name="bank" className="bg-background/50 border-primary/30" />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createPayment.isPending} className="bg-primary text-primary-foreground w-full">
                  {createPayment.isPending ? "Registrando..." : "Registrar Transacción"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card/40 border border-primary/20 rounded-lg p-2 overflow-x-auto flex gap-2">
        <ToggleGroup type="single" value={statusFilter} onValueChange={(v) => { if(v) setStatusFilter(v); }} className="justify-start">
          <ToggleGroupItem value="todos" className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary border border-transparent hover:border-primary/30">TODOS</ToggleGroupItem>
          <ToggleGroupItem value="pendiente" className="data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-500 border border-transparent hover:border-amber-500/30">PENDIENTES</ToggleGroupItem>
          <ToggleGroupItem value="pagado" className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary border border-transparent hover:border-primary/30">PAGADOS</ToggleGroupItem>
          <ToggleGroupItem value="fallido" className="data-[state=on]:bg-secondary/20 data-[state=on]:text-secondary border border-transparent hover:border-secondary/30">FALLIDOS</ToggleGroupItem>
          <ToggleGroupItem value="reembolsado" className="data-[state=on]:bg-muted data-[state=on]:text-foreground border border-transparent hover:border-muted-foreground/30">REEMBOLSADOS</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Card className="bg-card/40 border-primary/20">
        <div className="p-4 border-b border-primary/10 flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/30">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por referencia, alumno o banco..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-primary/20 focus-visible:ring-primary w-full font-mono text-sm"
            />
          </div>
          <div className="w-full sm:w-auto flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px] bg-background/50 border-primary/20">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Cualquier método</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bizum">Bizum</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="whitespace-nowrap">
              <TableHeader className="bg-background/80">
                <TableRow className="border-primary/20">
                  <TableHead className="font-mono text-xs">REF</TableHead>
                  <TableHead>Abonado</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="hidden md:table-cell">Banco</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-primary/10">
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPayments.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <span className="font-mono text-sm">No se encontraron transacciones.</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="border-primary/10 hover:bg-primary/5 transition-colors group">
                      <TableCell className="font-mono text-xs text-muted-foreground">{payment.reference}</TableCell>
                      <TableCell className="font-medium text-foreground">{payment.subscriberName}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">€{payment.amount.toFixed(2)}</TableCell>
                      <TableCell>{getMethodBadge(payment.method)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{payment.bank || "-"}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {payment.status !== "pagado" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/20" title="Marcar Pagado" onClick={() => setStatus(payment.id, "pagado")}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {payment.status === "pendiente" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary hover:bg-secondary/20" title="Marcar Fallido" onClick={() => setStatus(payment.id, "fallido")}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {payment.status === "pagado" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/50" title="Reembolsar" onClick={() => setStatus(payment.id, "reembolsado")}>
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20" onClick={() => { setEditingPayment(payment); setEditOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/20">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-destructive/50 bg-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                  <Terminal className="h-4 w-4" /> rm tx_{payment.reference}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Eliminar registro de pago {payment.reference}? Esto altera la contabilidad histórica.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-primary/20">Cancelar</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletePayment.mutate({ id: payment.id })}>
                                  Confirmar Eliminación
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
        <div className="bg-primary/5 p-4 border-t border-primary/20 font-mono text-sm flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="text-muted-foreground">&gt;_ Resumen de filtro actual:</div>
          <div className="flex gap-4">
            <div>Facturado: <span className="text-foreground">€{summary.total.toFixed(2)}</span></div>
            <div className="text-primary">Pagado: €{summary.pagado.toFixed(2)}</div>
            <div className="text-amber-500">Pendiente: €{summary.pendiente.toFixed(2)}</div>
          </div>
        </div>
      </Card>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if(!open) setEditingPayment(null); }}>
        <DialogContent className="border-primary/50 bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary flex items-center gap-2">
              <Terminal className="h-4 w-4" /> root@edit_tx --ref={editingPayment?.reference}
            </DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Abonado</Label>
                  <Input value={editingPayment.subscriberName} disabled className="bg-background/30 text-muted-foreground border-primary/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Importe (€)</Label>
                  <Input id="edit-amount" name="amount" type="number" step="0.01" min="0" defaultValue={editingPayment.amount} required className="bg-background/50 border-primary/30 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-reference">Referencia</Label>
                  <Input id="edit-reference" name="reference" defaultValue={editingPayment.reference} required className="bg-background/50 border-primary/30 font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-method">Método</Label>
                  <Select name="method" defaultValue={editingPayment.method}>
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bizum">Bizum</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estado</Label>
                  <Select name="status" defaultValue={editingPayment.status}>
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="fallido">Fallido</SelectItem>
                      <SelectItem value="reembolsado">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-bank">Banco / Origen</Label>
                  <Input id="edit-bank" name="bank" defaultValue={editingPayment.bank || ""} className="bg-background/50 border-primary/30" />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={updatePayment.isPending} className="bg-primary text-primary-foreground w-full">
                  {updatePayment.isPending ? "Guardando..." : "Actualizar Transacción"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
