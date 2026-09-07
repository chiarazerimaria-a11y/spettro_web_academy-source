import { useGetAdminSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Euro, CreditCard, Server, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading, isError } = useGetAdminSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-card" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-8 text-center border border-destructive/50 bg-destructive/10 rounded-lg">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <div className="text-destructive font-bold text-lg mb-2">CRITICAL ERROR: ACCESS DENIED</div>
        <p className="text-muted-foreground">No se pudo cargar el resumen del sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
          <TerminalPrompt /> System.Dashboard
        </h1>
        <p className="text-muted-foreground">Resumen global de la academia.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Abonados Activos"
          value={summary.activeSubscribers}
          subtitle={`de ${summary.totalSubscribers} totales`}
          icon={Users}
          color="cyan"
        />
        <StatCard
          title="Ingresos Totales"
          value={`€${summary.totalRevenue.toLocaleString("es-ES")}`}
          icon={Euro}
          color="green"
        />
        <StatCard
          title="Pagos Pagados"
          value={summary.paidPayments}
          subtitle={`${summary.pendingPayments} pendientes`}
          icon={CreditCard}
          color="magenta"
        />
        <StatCard
          title="Máquinas"
          value={summary.machinesCompleted}
          subtitle={`completadas de ${summary.machinesCompleted + summary.machinesInProgress + summary.machinesPlanned}`}
          icon={Server}
          color="blue"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Subscribers */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="border-b border-primary/10 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Últimos Abonados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {summary.recentSubscribers && summary.recentSubscribers.length > 0 ? (
              <div className="space-y-4">
                {summary.recentSubscribers.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded border border-border bg-background/50">
                    <div>
                      <div className="font-bold">{sub.name}</div>
                      <div className="text-xs text-muted-foreground">{sub.email}</div>
                    </div>
                    <Badge variant="outline" className="border-primary/50 text-primary">
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay abonados recientes.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Machine Status Breakdown */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="border-b border-primary/10 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-secondary" />
              Estado de Misiones
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <ProgressStat label="Completadas" value={summary.machinesCompleted} total={summary.machinesCompleted + summary.machinesInProgress + summary.machinesPlanned} color="bg-primary" />
              <ProgressStat label="En Progreso" value={summary.machinesInProgress} total={summary.machinesCompleted + summary.machinesInProgress + summary.machinesPlanned} color="bg-secondary" />
              <ProgressStat label="Planificadas" value={summary.machinesPlanned} total={summary.machinesCompleted + summary.machinesInProgress + summary.machinesPlanned} color="bg-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TerminalPrompt() {
  return <span className="text-secondary animate-pulse">&gt;</span>;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: { title: string, value: string | number, subtitle?: string, icon: any, color: "cyan" | "green" | "magenta" | "blue" }) {
  const colorMap = {
    cyan: "text-primary border-primary/30 shadow-[0_0_15px_rgba(255,77,184,0.1)]",
    green: "text-[#0f0] border-[#0f0]/30 shadow-[0_0_15px_rgba(0,255,0,0.1)]",
    magenta: "text-secondary border-secondary/30 shadow-[0_0_15px_rgba(155,85,249,0.1)]",
    blue: "text-blue-400 border-blue-400/30 shadow-[0_0_15px_rgba(100,149,237,0.1)]",
  };

  return (
    <Card className={`bg-card/40 border transition-all hover:bg-card/80 ${colorMap[color]}`}>
      <CardContent className="p-6 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
          <Icon className="h-5 w-5 opacity-70" />
        </div>
        <div className="text-3xl font-bold font-mono tracking-tight mt-2">{value}</div>
        {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

function ProgressStat({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-mono">{value} ({percentage}%)</span>
      </div>
      <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
