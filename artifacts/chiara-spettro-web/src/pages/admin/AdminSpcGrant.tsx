import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Coins, Search } from "lucide-react";
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

export default function AdminSpcGrant() {
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
      const res = await fetch(`${BASE}api/admin/spc/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, amount, description: description || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      return d as { ok: boolean; granted: number; balance: number };
    },
    onSuccess: (d) => {
      toast({ title: `✓ ${d.granted.toLocaleString()} SPC acreditados`, description: `Nuevo saldo de @${selected?.username}: ${d.balance.toLocaleString()} SPC` });
      setDescription("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-mono font-bold text-primary flex items-center gap-2">
          <Coins className="h-6 w-6" /> SPETTROCOIN — ACREDITAR SALDO
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          SPC es dinero real y retirable. Usá esto SOLO después de recibir el pago por fuera (Bizum, PayPal, transferencia). No crea dinero de la nada: cada acreditación debe corresponder a un pago ya recibido.
        </p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-card p-5 space-y-4">
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">BUSCAR USUARIO *</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={selected ? `@${selected.username}` : search}
              onChange={e => { setSelected(null); setSearch(e.target.value); }}
              placeholder="Nombre de usuario o email..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-primary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-primary" />
          </div>
          {!selected && results.length > 0 && (
            <div className="mt-1 rounded-lg border border-primary/20 bg-background overflow-hidden">
              {results.map(a => (
                <button key={a.id} onClick={() => { setSelected(a); setSearch(""); }}
                  className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-primary/10 transition-colors flex items-center justify-between">
                  <span>@{a.username}</span>
                  <span className="text-[10px] text-muted-foreground">{a.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">CANTIDAD (SPC) *</label>
          <div className="flex gap-2 items-center flex-wrap">
            <input type="number" min={1} value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)}
              className="w-32 px-3 py-2 bg-background border border-primary/20 rounded-lg font-mono text-sm focus:outline-none focus:border-primary" />
            <div className="flex gap-1 flex-wrap">
              {[1000, 5000, 12000, 30000, 50000].map(v => (
                <button key={v} onClick={() => setAmount(v)}
                  className="text-[10px] px-2 py-1 rounded font-mono border border-primary/20 text-muted-foreground hover:border-primary hover:text-primary transition-all">
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">1000 SPC = €1,00</p>
        </div>

        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">MOTIVO / REFERENCIA DE PAGO (opcional)</label>
          <Input value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Ej: Bizum recibido 17/11, ref. 1234..."
            className="font-mono text-sm bg-background border-primary/20 focus:border-primary h-9" />
        </div>

        <Button onClick={() => grantMutation.mutate()} disabled={!selected || amount < 1 || grantMutation.isPending}
          className="w-full font-mono font-bold gap-2">
          <Coins className="h-4 w-4" />
          {grantMutation.isPending ? "ACREDITANDO..." : `ACREDITAR ${amount.toLocaleString()} SPC`}
        </Button>
      </div>
    </div>
  );
}
