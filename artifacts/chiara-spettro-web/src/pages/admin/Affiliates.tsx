import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users2, Plus, Trash2, Edit2, Copy, Check, ExternalLink, Euro, TrendingUp, Link2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

interface Affiliate {
  id: number;
  name: string;
  email: string;
  referralCode: string;
  referredCount: number;
  commissionRate: number;
  totalEarned: number;
  status: string;
  payoutIban: string | null;
  payoutPaypal: string | null;
  notes: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  activo: "bg-primary/10 text-primary border-primary/30",
  inactivo: "bg-muted/20 text-muted-foreground border-border",
  suspendido: "bg-red-500/10 text-red-400 border-red-500/30",
};

function generateCode(name: string) {
  return (name.toUpperCase().replace(/\s+/g, "_").slice(0, 8) + "_" + Math.random().toString(36).slice(2, 6).toUpperCase());
}

export default function Affiliates() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Affiliate | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ name: "", email: "", referralCode: "", commissionRate: "15", payoutIban: "", payoutPaypal: "", notes: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: affiliates = [], isLoading } = useQuery<Affiliate[]>({
    queryKey: ["admin-affiliates"],
    queryFn: () => fetch(`${BASE}api/admin/affiliates`).then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: async (body: object) => {
      const url = editing ? `${BASE}api/admin/affiliates/${editing.id}` : `${BASE}api/admin/affiliates`;
      const res = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-affiliates"] }); setOpen(false); toast({ title: editing ? "Afiliado actualizado" : "Afiliado creado" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}api/admin/affiliates/${id}`, { method: "DELETE" }).then(() => {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-affiliates"] }); toast({ title: "Afiliado eliminado" }); },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", email: "", referralCode: "", commissionRate: "15", payoutIban: "", payoutPaypal: "", notes: "" });
    setOpen(true);
  };
  const openEdit = (a: Affiliate) => {
    setEditing(a);
    setForm({ name: a.name, email: a.email, referralCode: a.referralCode, commissionRate: String(a.commissionRate), payoutIban: a.payoutIban || "", payoutPaypal: a.payoutPaypal || "", notes: a.notes || "" });
    setOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, commissionRate: Number(form.commissionRate), referralCode: form.referralCode || generateCode(form.name) });
  };
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(`https://spettroweb.com/?ref=${code}`);
    setCopied(code); setTimeout(() => setCopied(null), 2000);
  };

  const filtered = affiliates
    .filter(a => filterStatus === "todos" || a.status === filterStatus)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()) || a.referralCode.toLowerCase().includes(search.toLowerCase()));

  const totalEarned = affiliates.reduce((s, a) => s + a.totalEarned, 0);
  const totalReferred = affiliates.reduce((s, a) => s + a.referredCount, 0);
  const active = affiliates.filter(a => a.status === "activo").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><Users2 className="h-6 w-6" /> Afiliados</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona el programa de referidos y comisiones</p>
        </div>
        <Button onClick={openNew} className="font-mono bg-primary text-black hover:brightness-110">
          <Plus className="mr-2 h-4 w-4" /> NUEVO AFILIADO
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total afiliados", value: affiliates.length, icon: Users2, color: "text-primary" },
          { label: "Activos", value: active, icon: TrendingUp, color: "text-green-400" },
          { label: "Referidos totales", value: totalReferred, icon: Link2, color: "text-secondary" },
          { label: "Comisiones pagadas", value: `€${totalEarned.toFixed(2)}`, icon: Euro, color: "text-yellow-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="border border-border rounded-lg p-4 bg-card/30">
            <Icon className={`h-5 w-5 mb-2 ${color}`} />
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email o código..." className="max-w-xs font-mono text-sm bg-black/50 border-primary/20 h-8" />
        {["todos", "activo", "inactivo", "suspendido"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all ${filterStatus === s ? "bg-primary text-black" : "bg-card border border-border text-muted-foreground hover:border-primary/50"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-border bg-card/50 text-muted-foreground text-xs uppercase">
              <th className="text-left px-4 py-3">Afiliado</th>
              <th className="text-left px-4 py-3">Código</th>
              <th className="text-center px-4 py-3">Referidos</th>
              <th className="text-center px-4 py-3">Comisión</th>
              <th className="text-center px-4 py-3">Ganado</th>
              <th className="text-center px-4 py-3">Cobro</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Cargando afiliados...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No hay afiliados{search ? " con ese filtro" : " aún"}</td></tr>
            ) : filtered.map((a, i) => (
              <motion.tr key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 hover:bg-card/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">{a.referralCode}</code>
                    <button onClick={() => copyCode(a.referralCode)} className="text-muted-foreground hover:text-primary transition-colors">
                      {copied === a.referralCode ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-secondary font-bold">{a.referredCount}</td>
                <td className="px-4 py-3 text-center">{a.commissionRate}%</td>
                <td className="px-4 py-3 text-center text-yellow-400 font-bold">€{Number(a.totalEarned).toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  {a.payoutIban ? (
                    <span className="text-xs text-green-400" title={a.payoutIban}>IBAN ✓</span>
                  ) : a.payoutPaypal ? (
                    <span className="text-xs text-blue-400" title={a.payoutPaypal}>PayPal ✓</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge className={`text-[10px] font-mono border ${STATUS_COLORS[a.status] || STATUS_COLORS.inactivo}`}>{a.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0a0a1a] border-primary/30 font-mono max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-primary">{editing ? "Editar afiliado" : "Nuevo afiliado"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">NOMBRE *</label>
                <Input value={form.name} onChange={set("name")} required className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-8" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">EMAIL *</label>
                <Input type="email" value={form.email} onChange={set("email")} required className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">CÓDIGO REF (auto si vacío)</label>
                <Input value={form.referralCode} onChange={set("referralCode")} placeholder="HACKER_X1Y2" className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-8 uppercase" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">COMISIÓN %</label>
                <Input type="number" min="1" max="50" value={form.commissionRate} onChange={set("commissionRate")} className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">IBAN</label>
                <Input value={form.payoutIban} onChange={set("payoutIban")} placeholder="ES00 ..." className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-8" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">PAYPAL</label>
                <Input type="email" value={form.payoutPaypal} onChange={set("payoutPaypal")} placeholder="paypal@email.com" className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-8" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">NOTAS</label>
              <Input value={form.notes} onChange={set("notes")} className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-8" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-mono border-border">CANCELAR</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="font-mono bg-primary text-black">
                {saveMutation.isPending ? "GUARDANDO..." : editing ? "ACTUALIZAR" : "CREAR"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#0a0a1a] border-red-500/30 font-mono">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Eliminar afiliado</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es irreversible. Se eliminarán todos los datos del afiliado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
              className="bg-red-500 hover:bg-red-600 text-white font-mono">ELIMINAR</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
