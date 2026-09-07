import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, Clock, AlertCircle, Plus, Banknote, Euro, TrendingUp, Users } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const OWNER_BANK = {
  name: "JESUS FRANKLIN HURTADO RAMIREZ",
  iban: "IT32 F036 4601 6005 2656 5212 960",
  bic: "NTSBITM1XXX",
};

type Payout = {
  id: number;
  instructorName: string;
  instructorEmail: string;
  iban: string | null;
  paypal: string | null;
  courseTitle: string;
  grossAmount: string;
  commissionRate: string;
  netAmount: string;
  status: string;
  paidAt: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

function statusBadge(status: string) {
  if (status === "pagado") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-[10px]"><CheckCircle className="h-3 w-3 mr-1"/>PAGADO</Badge>;
  if (status === "rechazado") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono text-[10px]"><AlertCircle className="h-3 w-3 mr-1"/>RECHAZADO</Badge>;
  return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-mono text-[10px]"><Clock className="h-3 w-3 mr-1"/>PENDIENTE</Badge>;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={copy} className="ml-1.5 text-muted-foreground hover:text-primary transition-colors">
      {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-400"/> : <Copy className="h-3.5 w-3.5"/>}
    </button>
  );
}

export default function Payouts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [form, setForm] = useState({ instructorName: "", instructorEmail: "", iban: "", paypal: "", courseTitle: "", grossAmount: "", commissionRate: "30" });
  const [resolving, setResolving] = useState<{ id: number; reference: string } | null>(null);

  const { data: payouts = [], isLoading } = useQuery<Payout[]>({
    queryKey: ["admin-payouts"],
    queryFn: () => fetch(`${BASE}api/payouts`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch(`${BASE}api/payouts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payouts"] }); setShowCreate(false); setForm({ instructorName: "", instructorEmail: "", iban: "", paypal: "", courseTitle: "", grossAmount: "", commissionRate: "30" }); toast({ title: "Pago creado", description: "El pago ha sido registrado como pendiente." }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, reference }: { id: number; status: string; reference?: string }) => {
      const r = await fetch(`${BASE}api/payouts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reference }) });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payouts"] }); setResolving(null); toast({ title: "Pago actualizado" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = payouts.filter(p => filterStatus === "todos" || p.status === filterStatus);
  const pending = payouts.filter(p => p.status === "pendiente");
  const totalPending = pending.reduce((acc, p) => acc + parseFloat(p.netAmount), 0);
  const totalPaid = payouts.filter(p => p.status === "pagado").reduce((acc, p) => acc + parseFloat(p.netAmount), 0);

  const gross = parseFloat(form.grossAmount) || 0;
  const commission = parseFloat(form.commissionRate) || 30;
  const net = gross * (1 - commission / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono font-bold text-2xl text-foreground">PAGOS A INSTRUCTORES</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona los pagos a instructores y vendedores de cursos</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-primary text-background hover:bg-primary/90 font-mono font-bold">
          <Plus className="h-4 w-4 mr-2"/>NUEVO PAGO
        </Button>
      </div>

      {/* OWNER BANK CARD */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Banknote className="h-4 w-4 text-primary"/>
          <span className="font-mono text-xs font-bold text-primary tracking-widest">CUENTA DE PAGO — ADMINISTRADOR</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="font-mono text-[10px] text-muted-foreground mb-0.5">TITULAR</p>
            <p className="font-mono text-xs text-foreground font-bold flex items-center">{OWNER_BANK.name}<CopyBtn text={OWNER_BANK.name}/></p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-muted-foreground mb-0.5">IBAN</p>
            <p className="font-mono text-xs text-primary font-bold flex items-center">{OWNER_BANK.iban}<CopyBtn text={OWNER_BANK.iban.replace(/\s/g, "")}/></p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-muted-foreground mb-0.5">BIC / SWIFT</p>
            <p className="font-mono text-xs text-primary font-bold flex items-center">{OWNER_BANK.bic}<CopyBtn text={OWNER_BANK.bic}/></p>
          </div>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3"/>Esta es la cuenta desde la que se realizan las transferencias a los instructores.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "PAGOS PENDIENTES", value: pending.length, icon: <Clock className="h-4 w-4 text-yellow-400"/>, color: "text-yellow-400" },
          { label: "IMPORTE PENDIENTE", value: `€${totalPending.toFixed(2)}`, icon: <Euro className="h-4 w-4 text-yellow-400"/>, color: "text-yellow-400" },
          { label: "TOTAL PAGADO", value: `€${totalPaid.toFixed(2)}`, icon: <CheckCircle className="h-4 w-4 text-green-400"/>, color: "text-green-400" },
          { label: "INSTRUCTORES", value: new Set(payouts.map(p => p.instructorEmail)).size, icon: <Users className="h-4 w-4 text-primary"/>, color: "text-primary" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-[#0d0d14] p-4">
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="font-mono text-[10px] text-muted-foreground">{s.label}</span></div>
            <div className={`font-mono font-black text-2xl ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex gap-2">
        {["todos", "pendiente", "pagado", "rechazado"].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${filterStatus === f ? "border-primary text-primary bg-primary/10" : "border-border/30 text-muted-foreground hover:text-foreground"}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-border/30 bg-[#0d0d14] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-muted-foreground animate-pulse">Cargando pagos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center font-mono text-muted-foreground">
            <Banknote className="h-8 w-8 mx-auto mb-3 text-primary/30"/>
            <p>No hay pagos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 bg-background/30">
                  {["INSTRUCTOR", "CURSO", "BRUTO", "COMISIÓN", "NETO", "MÉTODO", "ESTADO", "ACCIONES"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-muted-foreground tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/20 hover:bg-primary/3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-bold text-foreground">{p.instructorName}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{p.instructorEmail}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[160px] truncate">{p.courseTitle}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">€{parseFloat(p.grossAmount).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.commissionRate}%</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">€{parseFloat(p.netAmount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {p.iban ? (
                        <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">🏦 {p.iban.slice(0, 12)}...<CopyBtn text={p.iban}/></div>
                      ) : p.paypal ? (
                        <div className="font-mono text-[10px] text-muted-foreground">💳 {p.paypal}</div>
                      ) : <span className="text-[10px] text-muted-foreground">—</span>}
                      {p.reference && <div className="font-mono text-[10px] text-green-400 mt-0.5">REF: {p.reference}</div>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3">
                      {p.status === "pendiente" && (
                        <div className="flex gap-1.5">
                          <Button size="sm" onClick={() => setResolving({ id: p.id, reference: "" })}
                            className="h-7 px-2.5 bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 font-mono text-[10px]">
                            MARCAR PAGADO
                          </Button>
                          <Button size="sm" onClick={() => updateMutation.mutate({ id: p.id, status: "rechazado" })}
                            className="h-7 px-2.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-mono text-[10px]">
                            ✕
                          </Button>
                        </div>
                      )}
                      {p.status === "pagado" && p.paidAt && (
                        <span className="font-mono text-[10px] text-muted-foreground">{new Date(p.paidAt).toLocaleDateString("es-ES")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"/>
          <div className="relative z-10 bg-[#0d0d14] border border-primary/30 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_40px_rgba(255,77,184,0.1)]" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono font-bold text-lg text-primary mb-5">REGISTRAR NUEVO PAGO</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">NOMBRE INSTRUCTOR *</label>
                <input value={form.instructorName} onChange={e => setForm(p => ({ ...p, instructorName: e.target.value }))}
                  placeholder="Nombre completo" className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60"/>
              </div>
              <div className="col-span-2">
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">EMAIL *</label>
                <input value={form.instructorEmail} onChange={e => setForm(p => ({ ...p, instructorEmail: e.target.value }))}
                  placeholder="email@ejemplo.com" type="email" className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60"/>
              </div>
              <div className="col-span-2">
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">TÍTULO DEL CURSO *</label>
                <input value={form.courseTitle} onChange={e => setForm(p => ({ ...p, courseTitle: e.target.value }))}
                  placeholder="Nombre del curso vendido" className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60"/>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">IBAN INSTRUCTOR</label>
                <input value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))}
                  placeholder="IT32 F036..." className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60"/>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">PAYPAL</label>
                <input value={form.paypal} onChange={e => setForm(p => ({ ...p, paypal: e.target.value }))}
                  placeholder="paypal@email.com" className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60"/>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">IMPORTE BRUTO (€) *</label>
                <input value={form.grossAmount} onChange={e => setForm(p => ({ ...p, grossAmount: e.target.value }))}
                  placeholder="0.00" type="number" step="0.01" className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60"/>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1.5 block">COMISIÓN PLATAFORMA (%)</label>
                <input value={form.commissionRate} onChange={e => setForm(p => ({ ...p, commissionRate: e.target.value }))}
                  placeholder="30" type="number" className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60"/>
              </div>
              {gross > 0 && (
                <div className="col-span-2 bg-primary/5 border border-primary/20 rounded-xl p-4 grid grid-cols-3 gap-3 font-mono text-center">
                  <div><div className="text-[10px] text-muted-foreground">BRUTO</div><div className="text-sm font-bold text-foreground">€{gross.toFixed(2)}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">COMISIÓN ({commission}%)</div><div className="text-sm font-bold text-red-400">-€{(gross * commission / 100).toFixed(2)}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">NETO AL INSTRUCTOR</div><div className="text-sm font-bold text-primary">€{net.toFixed(2)}</div></div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-border/40 font-mono">CANCELAR</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.instructorName || !form.courseTitle || !form.grossAmount}
                className="flex-1 bg-primary text-background hover:bg-primary/90 font-mono font-bold">
                {createMutation.isPending ? "..." : "REGISTRAR PAGO"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MARK AS PAID MODAL ── */}
      {resolving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setResolving(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"/>
          <div className="relative z-10 bg-[#0d0d14] border border-green-500/30 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(34,197,94,0.1)]" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono font-bold text-lg text-green-400 mb-1">CONFIRMAR PAGO</h3>
            <p className="text-sm text-muted-foreground mb-4">Añade una referencia de transferencia (opcional)</p>
            <input value={resolving.reference} onChange={e => setResolving(r => r ? { ...r, reference: e.target.value } : r)}
              placeholder="REF-2025-001 o número de transferencia"
              className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-green-400/60 mb-4"/>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setResolving(null)} className="flex-1 border-border/40 font-mono">CANCELAR</Button>
              <Button onClick={() => updateMutation.mutate({ id: resolving.id, status: "pagado", reference: resolving.reference })}
                disabled={updateMutation.isPending}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-mono font-bold">
                ✓ MARCAR PAGADO
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
