import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Gift, Search, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

interface Alumno {
  id: number;
  username: string;
  email: string;
  totalPoints: number;
}

export default function GhostCoinAdmin() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Alumno | null>(null);
  const [amount, setAmount] = useState(1000);
  const [description, setDescription] = useState("");

  const { data: alumnos = [] } = useQuery<Alumno[]>({
    queryKey: ["admin-alumnos"],
    queryFn: () => fetch(`${BASE}api/admin/alumnos`).then(r => r.json()),
  });

  const results = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return alumnos.filter(a => a.username.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)).slice(0, 8);
  }, [search, alumnos]);

  const grantMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Selecciona un usuario primero");
      const res = await fetch(`${BASE}api/admin/ghc/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, amount, description: description || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      return d as { ok: boolean; granted: number; balance: number };
    },
    onSuccess: (d) => {
      toast({ title: `✓ ${d.granted.toLocaleString()} GHC regalados`, description: `Nuevo saldo de @${selected?.username}: ${d.balance.toLocaleString()} GHC` });
      setDescription("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-mono font-bold text-purple-300 flex items-center gap-2">
          <Gift className="h-6 w-6" /> GHOSTCOIN — REGALAR SALDO
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          GhostCoin (GHC) es moneda interna: no se compra ni se retira. Úsalo para activar suscripciones, promociones e invitaciones gratis.
        </p>
      </div>

      <div className="rounded-xl border border-purple-500/20 bg-card p-5 space-y-4">
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">BUSCAR USUARIO *</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={selected ? `@${selected.username}` : search}
              onChange={e => { setSelected(null); setSearch(e.target.value); }}
              placeholder="Nombre de usuario o email..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-purple-500/20 rounded-lg font-mono text-sm focus:outline-none focus:border-purple-400" />
          </div>
          {!selected && results.length > 0 && (
            <div className="mt-1 rounded-lg border border-purple-500/20 bg-background overflow-hidden">
              {results.map(a => (
                <button key={a.id} onClick={() => { setSelected(a); setSearch(""); }}
                  className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-purple-500/10 transition-colors flex items-center justify-between">
                  <span>@{a.username}</span>
                  <span className="text-[10px] text-muted-foreground">{a.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">CANTIDAD (GHC) *</label>
          <div className="flex gap-2 items-center flex-wrap">
            <input type="number" min={1} value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)}
              className="w-32 px-3 py-2 bg-background border border-purple-500/20 rounded-lg font-mono text-sm focus:outline-none focus:border-purple-400" />
            <div className="flex gap-1 flex-wrap">
              {[500, 1000, 5000, 10000, 50000].map(v => (
                <button key={v} onClick={() => setAmount(v)}
                  className="text-[10px] px-2 py-1 rounded font-mono border border-purple-500/20 text-muted-foreground hover:border-purple-400 hover:text-purple-300 transition-all">
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">MOTIVO (opcional)</label>
          <Input value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Ej: Promoción de lanzamiento, suscripción gratuita..."
            className="font-mono text-sm bg-background border-purple-500/20 focus:border-purple-400 h-9" />
        </div>

        <Button onClick={() => grantMutation.mutate()} disabled={!selected || amount < 1 || grantMutation.isPending}
          className="w-full font-mono font-bold gap-2 bg-purple-500 hover:bg-purple-600 text-black">
          <Coins className="h-4 w-4" />
          {grantMutation.isPending ? "REGALANDO..." : `REGALAR ${amount.toLocaleString()} GHC`}
        </Button>
      </div>
    </div>
  );
}
