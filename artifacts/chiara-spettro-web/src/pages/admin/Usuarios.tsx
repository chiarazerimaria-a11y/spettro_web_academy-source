import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, X, Mail, Coins, Calendar, CreditCard, Cpu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL;

interface UserRow {
  id: number;
  username: string;
  email: string;
  rank: string;
  totalPoints: number;
  machinesSolved: number;
  createdAt: string;
  spcBalance: number;
  ghcBalance: number;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
}

interface UserDetail {
  user: {
    id: number; username: string; email: string; rank: string;
    totalPoints: number; machinesSolved: number; createdAt: string;
    avatarType: string; paymentMethodJson: string | null;
  };
  wallet: { balance: number; totalEarned: number; totalSpent: number; ghcBalance: number } | null;
  subscription: { status: string; plan: string; joinedAt: string; notes: string | null } | null;
  spcTransactions: { id: number; amount: number; type: string; description: string; createdAt: string }[];
  ghcTransactions: { id: number; amount: number; description: string; createdAt: string }[];
  machinePurchases: { id: number; machineId: number; price: number; currency: string; createdAt: string }[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function UserDetailPanel({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery<UserDetail>({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => fetch(BASE + "api/admin/users/" + userId).then((r) => r.json()),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-background border border-primary/30 rounded-xl max-w-3xl w-full mt-10 mb-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="font-mono font-bold text-primary flex items-center gap-2">
            <Users className="h-5 w-5" /> Ficha de usuario
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="p-8 text-center text-muted-foreground font-mono text-sm">Cargando...</div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/30 p-4 space-y-1.5">
                <div className="font-mono font-bold text-lg">{data.user.username}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {data.user.email}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Registrado {fmtDate(data.user.createdAt)}</div>
                <div className="flex gap-2 pt-1">
                  <Badge variant="outline">{data.user.rank}</Badge>
                  <Badge variant="outline">{data.user.totalPoints} pts</Badge>
                  <Badge variant="outline">{data.user.machinesSolved} resueltas</Badge>
                </div>
              </div>
              <div className="rounded-lg border border-border/30 p-4 space-y-1.5">
                <div className="text-xs text-muted-foreground font-mono tracking-widest mb-1">SUSCRIPCION</div>
                {data.subscription ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge className={data.subscription.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/30" : ""}>{data.subscription.status}</Badge>
                      <span className="text-sm font-mono">{data.subscription.plan}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Desde {fmtDate(data.subscription.joinedAt)}</div>
                    {data.subscription.notes && <div className="text-xs text-muted-foreground italic">{data.subscription.notes}</div>}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground italic">Sin suscripcion</div>
                )}
                {data.user.paymentMethodJson && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1"><CreditCard className="h-3 w-3" /> Tiene metodo de pago guardado</div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-primary/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-primary/70 tracking-widest">SPC</span>
                  <span className="font-mono font-bold text-primary">{(data.wallet?.balance ?? 0).toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mb-2">
                  ganado {(data.wallet?.totalEarned ?? 0).toLocaleString()} - gastado {(data.wallet?.totalSpent ?? 0).toLocaleString()}
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {data.spcTransactions.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground italic">Sin movimientos</div>
                  ) : data.spcTransactions.map((t) => (
                    <div key={t.id} className="flex justify-between text-[10px] font-mono gap-2">
                      <span className="text-muted-foreground truncate">{t.description}</span>
                      <span className={t.amount > 0 ? "text-green-400 shrink-0" : "text-red-400 shrink-0"}>{t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-purple-500/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-purple-300/80 tracking-widest">GHC</span>
                  <span className="font-mono font-bold text-purple-300">{(data.wallet?.ghcBalance ?? 0).toLocaleString()}</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1 mt-2">
                  {data.ghcTransactions.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground italic">Sin movimientos</div>
                  ) : data.ghcTransactions.map((t) => (
                    <div key={t.id} className="flex justify-between text-[10px] font-mono gap-2">
                      <span className="text-muted-foreground truncate">{t.description}</span>
                      <span className={t.amount > 0 ? "text-green-400 shrink-0" : "text-red-400 shrink-0"}>{t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/30 p-4">
              <div className="text-xs font-mono text-muted-foreground tracking-widest mb-2 flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" /> MAQUINAS COMPRADAS</div>
              {data.machinePurchases.length === 0 ? (
                <div className="text-[10px] text-muted-foreground italic">Ninguna</div>
              ) : (
                <div className="space-y-1">
                  {data.machinePurchases.map((p) => (
                    <div key={p.id} className="flex justify-between text-[10px] font-mono">
                      <span className="text-muted-foreground">#{p.machineId} - {fmtDate(p.createdAt)}</span>
                      <span>{p.price} {p.currency}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Usuarios() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["admin-users"],
    queryFn: () => fetch(BASE + "api/admin/users").then((r) => r.json()),
  });

  const filtered = users.filter(
    (u) => !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><Users className="h-6 w-6" /> Usuarios</h1>
        <p className="text-muted-foreground text-sm mt-1">Todos los usuarios de la plataforma: suscripcion, saldo, movimientos y maquinas</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por usuario o email..." className="pl-8 font-mono text-sm bg-black/50 border-primary/20 h-8" />
      </div>

      <div className="rounded-lg border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card/40 text-muted-foreground font-mono text-xs">
            <tr>
              <th className="text-left p-3">Usuario</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Suscripcion</th>
              <th className="text-right p-3">SPC</th>
              <th className="text-right p-3">GHC</th>
              <th className="text-left p-3">Registro</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground font-mono text-xs">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground font-mono text-xs">Sin resultados</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} onClick={() => setSelected(u.id)} className="border-t border-border/20 hover:bg-primary/5 cursor-pointer">
                <td className="p-3 font-mono font-bold">{u.username}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3">
                  {u.subscriptionStatus ? (
                    <Badge variant="outline" className={u.subscriptionStatus === "active" ? "border-green-500/30 text-green-400" : ""}>
                      {u.subscriptionStatus} - {u.subscriptionPlan}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">sin suscripcion</span>
                  )}
                </td>
                <td className="p-3 text-right font-mono text-primary">{u.spcBalance.toLocaleString()}</td>
                <td className="p-3 text-right font-mono text-purple-300">{u.ghcBalance.toLocaleString()}</td>
                <td className="p-3 text-xs text-muted-foreground">{fmtDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected !== null && <UserDetailPanel userId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
