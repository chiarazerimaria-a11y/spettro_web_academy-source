import { useCallback, useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL;

interface Req {
  id: number; reference: string; username: string; email: string; packId: string;
  spc: number; eurCents: number; method: string; status: string; createdAt: string;
}

export default function AdminSpcRequests() {
  const [rows, setRows] = useState<Req[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch(BASE + "api/admin/spc-requests")
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Error"); setRows(d); setErr(""); })
      .catch((e) => setErr(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (id: number, what: "approve" | "reject") => {
    if (what === "approve" && !window.confirm("¿Has recibido el pago? Se acreditarán los SPC.")) return;
    setBusy(id);
    try {
      const r = await fetch(BASE + "api/admin/spc-requests/" + id + "/" + what, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((d as { error?: string }).error || "Error");
      load();
    } catch (e) { setErr((e as Error).message); }
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><Coins className="h-6 w-6" /> Solicitudes SPC</h1>
        <p className="text-muted-foreground text-sm mt-1">Packs pedidos por los usuarios. Acredita solo cuando hayas recibido el pago.</p>
      </div>
      {err && <div className="text-xs text-red-400 font-mono">{err}</div>}
      <div className="rounded-lg border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card/40 text-muted-foreground font-mono text-xs">
            <tr>
              <th className="text-left p-3">Ref.</th><th className="text-left p-3">Usuario</th>
              <th className="text-left p-3">Pack</th><th className="text-right p-3">Importe</th>
              <th className="text-left p-3">Método</th><th className="text-left p-3">Estado</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground font-mono text-xs">Sin solicitudes</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border/20">
                <td className="p-3 font-mono">{r.reference}</td>
                <td className="p-3"><div className="font-mono font-bold">{r.username}</div><div className="text-[10px] text-muted-foreground">{r.email}</div></td>
                <td className="p-3 font-mono">{r.packId} · {r.spc.toLocaleString()} SPC</td>
                <td className="p-3 text-right font-mono">{(r.eurCents / 100).toFixed(2).replace(".", ",")} €</td>
                <td className="p-3 text-xs">{r.method}</td>
                <td className="p-3"><Badge variant="outline" className={r.status === "acreditada" ? "border-green-500/30 text-green-400" : r.status === "rechazada" ? "border-red-500/30 text-red-400" : ""}>{r.status}</Badge></td>
                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                  {r.status === "pendiente" && (
                    <>
                      <button disabled={busy === r.id} onClick={() => act(r.id, "approve")} className="text-[10px] font-mono border border-green-500/40 rounded px-2 py-1 text-green-400 hover:bg-green-500/10 disabled:opacity-40">Acreditar</button>
                      <button disabled={busy === r.id} onClick={() => act(r.id, "reject")} className="text-[10px] font-mono border border-red-500/40 rounded px-2 py-1 text-red-400 hover:bg-red-500/10 disabled:opacity-40">Rechazar</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
