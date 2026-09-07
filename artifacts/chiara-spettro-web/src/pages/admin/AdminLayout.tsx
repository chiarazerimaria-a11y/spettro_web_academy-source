import { Link, useLocation } from "wouter";
import { Terminal, Users, BookOpen, CreditCard, Server, ArrowLeft, GraduationCap, Users2, BookMarked, Banknote, FlaskConical, Target, Shield, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Terminal, exact: true },
  { href: "/admin/subscribers", label: "Abonados", icon: Users },
  { href: "/admin/courses", label: "Cursos", icon: BookOpen },
  { href: "/admin/payments", label: "Pagos", icon: CreditCard },
  { href: "/admin/payouts", label: "Pagos Instructores", icon: Banknote },
  { href: "/admin/machines", label: "Máquinas Kanban", icon: Server },
  { href: "/admin/lab-machines", label: "Lab Público", icon: FlaskConical },
  { divider: true, label: "JUEGO" } as const,
  { href: "/admin/misiones", label: "Misiones CTF", icon: Target },
  { href: "/admin/squads", label: "Escuadras", icon: Shield },
  { href: "/admin/torneos", label: "Torneos", icon: Trophy },
  { divider: true, label: "USUARIOS" } as const,
  { href: "/admin/alumnos", label: "Alumnos", icon: GraduationCap },
  { href: "/admin/instructores", label: "Instructores", icon: BookMarked },
  { href: "/admin/affiliates", label: "Afiliados", icon: Users2 },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background font-mono text-foreground crt-flicker">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-primary/20 bg-card/50 flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-2 text-primary font-bold text-xl mb-8 glitch-hover px-2">
          <Terminal className="h-6 w-6" />
          <span>&gt;_ admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item, idx) => {
            if ("divider" in item) {
              return (
                <div key={`div-${idx}`} className="pt-4 pb-1 px-3">
                  <p className="text-[10px] font-mono font-bold text-muted-foreground/50 uppercase tracking-widest">{item.label}</p>
                  <div className="mt-1 border-t border-primary/10" />
                </div>
              );
            }
            const isActive = item.exact
              ? location === item.href
              : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="block">
                <span
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded transition-colors group cursor-pointer",
                    isActive
                      ? "bg-primary/20 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground border-l-2 border-transparent"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "group-hover:text-primary")} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <Link href="/">
            <span className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer px-2">
              <ArrowLeft className="h-3 w-3" />
              Volver a la web pública
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-primary/20 bg-background/80 backdrop-blur flex items-center px-6 sticky top-0 z-10 shrink-0">
          <div className="text-sm text-muted-foreground">
            root@chiara:~{location}#
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 relative">
          <div className="absolute inset-0 z-0 pointer-events-none scanlines opacity-50" />
          <div className="relative z-10 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
