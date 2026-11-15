import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Banknote, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

interface PayoutRequest {
  id: number;
  userId: number;
  username: string;
  amountSpc: number;
  amountEur: number;
  method: string;
  destination: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  aprobado: "bg-green-500/10 text-green-400 border-green-500/30",
  rechazado: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function PayoutRequests() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [acting, setActing] = useState<{ id: number; status: "aprobado" | "rechazado" } | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [filterStatus, setFilterStatus] = useState("pendiente");

  const { data: requests = [], isLoading } = useQuery<PayoutRequest[]>({
    queryKey: ["admin-payout-requests"],
    queryFn: () => fetch(`${BASE}api/payouts/requests`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, status, adminNote }: { id: number; status: string; adminNote: string }) => {
      const res = await fetch(`${BASE}api/payouts/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      toast({ title: "Solicitud actualizada" });
      setActing(null);
      setAdminNote("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = requests.filter(r => filterStatus === "todos" || r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold text-primary flex items-center gap-2">
            <Banknote className="h-6 w-6" /> SOLICITUDES DE RETIRO
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">Retiros de SPC a euros solicitados por usuarios</p>
        </div>
        <div className="flex gap-2">
          {["pendiente", "aprobado", "rechazado", "todos"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all
                ${filterStatus === s ? "bg-primary/20 border-primary text-primary" : "bg-card border-primary/20 text-muted-foreground hover:border-primary/40"}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/10 text-left text-xs text-muted-foreground font-mono">
              <th className="px-4 py-3">USUARIO</th>
              <th className="px-4 py-3">SPC</th>
              <th className="px-4 py-3">EUR</th>
              <th className="px-4 py-3">MÉTODO</th>
              <th className="px-4 py-3">DESTINO</th>
              <th className="px-4 py-3 text-center">ESTADO</th>
              <th className="px-4 py-3">FECHA</th>
              <th className="px-4 py-3 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground font-mono">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground font-mono">No hay solicitudes.</td></tr>
            ) : filtered.map(r => (
              <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-primary/5 hover:bg-primary/5">
                <td className="px-4 py-3 font-mono">@{r.username}</td>
                <td className="px-4 py-3 font-mono text-primary">{r.amountSpc.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-green-400">€{r.amountEur.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.method}</td>
                <td className="px-4 py-3 font-mono text-xs max-w-[160px] truncate" title={r.destination}>{r.destination}</td>
                <td className="px-4 py-3 text-center">
                  <Badge className={`text-[10px] font-mono border ${STATUS_COLORS[r.status] || ""}`}>{r.status}</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {r.status === "pendiente" ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setActing({ id: r.id, status: "aprobado" }); setAdminNote(""); }}
                        className="p-1.5 rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-colors" title="Aprobar">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setActing({ id: r.id, status: "rechazado" }); setAdminNote(""); }}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Rechazar">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" /> {r.processedAt ? new Date(r.processedAt).toLocaleDateString() : "—"}
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!acting} onOpenChange={() => setActing(null)}>
        <DialogContent className="bg-[#0a0a1a] border-primary/30 font-mono max-w-md">
          <DialogHeader>
            <DialogTitle className={acting?.status === "aprobado" ? "text-green-400" : "text-red-400"}>
              {acting?.status === "aprobado" ? "Aprobar retiro" : "Rechazar retiro"}
            </DialogTitle>
          </DialogHeader>
          {acting?.status === "rechazado" && (
            <p className="text-xs text-muted-foreground">Al rechazar, el SPC se reembolsará automáticamente al usuario.</p>
          )}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">NOTA (opcional)</label>
            <Input value={adminNote} onChange={e => setAdminNote(e.target.value)}
              placeholder="Ej: Pagado por Bizum el 15/11" className="font-mono text-sm bg-black/50 border-primary/20 focus:border-primary h-9" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActing(null)} className="font-mono border-border">CANCELAR</Button>
            <Button
              disabled={mutation.isPending}
              onClick={() => acting && mutation.mutate({ id: acting.id, status: acting.status, adminNote })}
              className={`font-mono ${acting?.status === "aprobado" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-black`}>
              {mutation.isPending ? "GUARDANDO..." : "CONFIRMAR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
