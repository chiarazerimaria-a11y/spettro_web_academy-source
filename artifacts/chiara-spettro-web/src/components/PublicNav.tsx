import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Coins, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { useQuery } from "@tanstack/react-query";
import { useLang, LANGUAGES, type Lang } from "@/contexts/LanguageContext";

const BASE = import.meta.env.BASE_URL;

const avatarEmoji: Record<string, string> = {
  ghost: "👻", skull: "💀", robot: "🤖", demon: "😈", spider: "🕷️",
  dragon: "🐉", ninja: "🥷", phantom: "🌑", cyber: "⚡", eye: "👁️",
};

function NavAvatar({ avatarUrl, avatarType }: { avatarUrl?: string | null; avatarType?: string }) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt="avatar"
        className="h-6 w-6 rounded-full object-cover border border-primary/40"
        style={{ boxShadow: "0 0 6px rgba(255,77,184,0.35)" }} />
    );
  }
  const emoji = avatarEmoji[avatarType || "ghost"] || "👻";
  return (
    <span className="h-6 w-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-sm leading-none">
      {emoji}
    </span>
  );
}

function WalletBadge({ userId }: { userId: number }) {
  const { data } = useQuery({
    queryKey: ["wallet", userId],
    queryFn: () => fetch(`${BASE}api/wallet/${userId}`).then(r => r.json()),
    refetchInterval: 30000,
  });
  const balance = data?.wallet?.balance ?? null;
  if (balance === null) return null;
  return (
    <Link href="/wallet">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/25 font-mono text-xs text-primary hover:bg-primary/20 transition-all cursor-pointer">
        <Coins className="h-3 w-3" />
        <span className="font-bold">{balance.toLocaleString()}</span>
        <span className="text-primary/60 text-[10px]">SPC</span>
      </div>
    </Link>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find(l => l.code === lang)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/20 bg-card/40 hover:bg-card/80 hover:border-primary/40 transition-all font-mono text-xs font-bold text-foreground"
        title="Cambiar idioma / Change language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline text-[11px] tracking-wider">{current.label}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-primary/20 bg-[#0d0d14]/98 backdrop-blur-md shadow-2xl overflow-hidden z-50"
            style={{ boxShadow: "0 8px 32px rgba(255,77,184,0.12)" }}
          >
            <div className="p-1.5 space-y-0.5">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code as Lang); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-xs font-bold transition-all hover:bg-primary/10 ${lang === l.code ? "bg-primary/15 text-primary border border-primary/25" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="flex-1 text-left tracking-wider">{l.name}</span>
                  {lang === l.code && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PublicNav() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const { user, logout } = useAuth();
  const { t } = useLang();

  const openAuth = (tab: "login" | "register") => {
    setAuthTab(tab);
    setAuthOpen(true);
    setIsMobileMenuOpen(false);
  };

  const links = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.lab, href: "/lab" },
    { label: t.nav.squads, href: "/escuadras", badge: "⚔️" },
    { label: t.nav.streaming, href: "/streaming", badge: "🔴" },
    { label: t.nav.certifications, href: "/certificaciones" },
    { label: t.nav.courses, href: "/cursos" },
    { label: t.nav.marketplace, href: "/marketplace" },
    { label: t.nav.tutoring, href: "/tutorias" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-primary/20 bg-[#0a0a0f]/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer shrink-0 group mr-6">
            <img src="/images/logo_icon.png" alt="SpettroWeb"
              className="h-10 w-10 rounded-md object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            <span className="font-mono font-black text-xl glitch-hover hidden sm:inline-flex items-center gap-0"
              style={{ background: "linear-gradient(90deg,#ffffff,#d8b4fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              SpettroWeb<span className="w-2 h-[18px] animate-pulse inline-block ml-1"
                style={{ background: "#a78bfa", WebkitBackgroundClip: "unset", WebkitTextFillColor: "unset", borderRadius: 2 }} />
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-4 text-sm font-mono font-bold flex-1 min-w-0 overflow-hidden">
            {links.map((link) => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href}
                  className={`relative py-2 transition-colors hover:text-primary flex items-center gap-1 whitespace-nowrap text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {(link as any).badge && <span className="text-[10px]">{(link as any).badge}</span>}
                  {link.label}
                  {isActive && (
                    <motion.div layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(255,77,184,0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center gap-2">
            <LangSwitcher />
            {user ? (
              <div className="flex items-center gap-2">
                <WalletBadge userId={user.id} />
                <Link href="/perfil">
                  <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-mono flex items-center gap-2">
                    <NavAvatar avatarUrl={user.avatarUrl} avatarType={user.avatarType} />
                    {user.username.toUpperCase()}
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={logout}
                  className="text-muted-foreground hover:text-red-400" title={t.nav.logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                className="bg-primary text-background hover:bg-primary/90 font-mono font-bold glitch-hover shadow-[0_0_10px_rgba(255,77,184,0.3)]"
                onClick={() => openAuth("login")}
              >
                {t.nav.login}
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <LangSwitcher />
            <button className="text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-primary/20 bg-[#0a0a0f]"
            >
              <div className="flex flex-col p-4 space-y-4 font-mono font-bold">
                {links.map((link) => {
                  const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                      className={`py-2 px-4 rounded flex items-center gap-2 ${isActive ? "bg-primary/10 text-primary border-l-2 border-primary" : "text-muted-foreground"}`}>
                      {(link as any).badge && <span>{(link as any).badge}</span>}
                      {link.label}
                    </Link>
                  );
                })}
                <div className="pt-4 flex flex-col gap-3 border-t border-border">
                  {user ? (
                    <>
                      <Link href="/perfil" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="border-primary text-primary w-full justify-center font-mono">
                          <NavAvatar avatarUrl={user.avatarUrl} avatarType={user.avatarType} />
                          <span className="ml-2">{user.username.toUpperCase()}</span>
                        </Button>
                      </Link>
                      <Button variant="ghost" onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="text-red-400 w-full justify-center">
                        <LogOut className="h-4 w-4 mr-2" /> {t.nav.logout}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => openAuth("login")} className="bg-primary text-background hover:bg-primary/90 w-full justify-center">
                        {t.nav.login}
                      </Button>
                      <Button variant="outline" onClick={() => openAuth("register")} className="border-primary text-primary w-full justify-center">
                        {t.nav.register}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialTab={authTab} />
    </>
  );
}
