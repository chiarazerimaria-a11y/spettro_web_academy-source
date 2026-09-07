import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GraduationCap, Search, CreditCard, Cpu, Star, Trophy, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL;

interface Alumno {
  id: number;
  username: string;
  email: string;
  avatarType: string;
  rank: string;
  totalPoints: number;
  machinesSolved: number;
  paymentMethodJson: string | null;
  createdAt: string;
}

const RANK_COLORS: Record<string, string> = {
  Rookie: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  Hacker: "bg-primary/10 text-primary border-primary/30",
  Elite: "bg-secondary/10 text-secondary border-secondary/30",
  Master: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
};

const avatarEmoji: Record<string, string> = {
  ghost: "👻", skull: "💀", robot: "🤖", demon: "😈", spider: "🕷️",
  dragon: "🐉", ninja: "🥷", phantom: "🌑", cyber: "⚡", eye: "👁️",
};

export default function Alumnos() {
  const [search, setSearch] = useState("");
  const [filterRank, setFilterRank] = useState("todos");

  const { data: alumnos = [], isLoading } = useQuery<Alumno[]>({
    queryKey: ["admin-alumnos"],
    queryFn: () => fetch(`${BASE}api/admin/alumnos`).then(r => r.json()),
  });

  const filtered = alumnos
    .filter(a => filterRank === "todos" || a.rank === filterRank)
    .filter(a => !search || a.username.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

  const totalPoints = alumnos.reduce((s, a) => s + a.totalPoints, 0);
  const totalSolved = alumnos.reduce((s, a) => s + a.machinesSolved, 0);
  const withPayment = alumnos.filter(a => a.paymentMethodJson).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><GraduationCap className="h-6 w-6" /> Alumnos</h1>
        <p className="text-muted-foreground text-sm mt-1">Estudiantes registrados en la plataforma</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total alumnos", value: alumnos.length, icon: GraduationCap, color: "text-primary" },
          { label: "Puntos totales", value: totalPoints.toLocaleString(), icon: Star, color: "text-yellow-400" },
          { label: "Máquinas resueltas", value: totalSolved, icon: Cpu, color: "text-secondary" },
          { label: "Con método de pago", value: withPayment, icon: CreditCard, color: "text-green-400" },
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno..." className="pl-8 max-w-xs font-mono text-sm bg-black/50 border-primary/20 h-8" />
        </div>
        {["todos", "Rookie", "Hacker", "Elite", "Master"].map(r => (
          <button key={r} onClick={() => setFilterRank(r)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all ${filterRank === r ? "bg-primary text-black" : "bg-card border border-border text-muted-foreground hover:border-primary/50"}`}>
            {r}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-border bg-card/50 text-muted-foreground text-xs uppercase">
              <th className="text-left px-4 py-3">Alumno</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-center px-4 py-3">Rank</th>
              <th className="text-center px-4 py-3">Puntos</th>
              <th className="text-center px-4 py-3">Máquinas</th>
              <th className="text-center px-4 py-3">Método pago</th>
              <th className="text-left px-4 py-3">Registro</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Cargando alumnos...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No hay alumnos{search ? " con ese filtro" : " registrados"}</td></tr>
            ) : filtered.map((a, i) => {
              let card: { cardBrand?: string; cardLast4?: string } = {};
              try { card = a.paymentMethodJson ? JSON.parse(a.paymentMethodJson) : {}; } catch {}
              return (
                <motion.tr key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-card/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{avatarEmoji[a.avatarType] || "👻"}</span>
                      <span className="font-semibold text-foreground">{a.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.email}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={`text-[10px] font-mono border ${RANK_COLORS[a.rank] || RANK_COLORS.Rookie}`}>
                      <Trophy className="h-2.5 w-2.5 mr-1" />{a.rank}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-yellow-400 font-bold">{a.totalPoints.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-secondary font-bold">{a.machinesSolved}</td>
                  <td className="px-4 py-3 text-center">
                    {card.cardLast4 ? (
                      <span className="text-xs text-green-400 flex items-center gap-1 justify-center">
                        <CreditCard className="h-3 w-3" />{card.cardBrand} ···{card.cardLast4}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin método</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(a.createdAt).toLocaleDateString("es-ES")}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
