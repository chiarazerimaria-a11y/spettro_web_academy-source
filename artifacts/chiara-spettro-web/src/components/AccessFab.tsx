import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { GraduationCap, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BASE = import.meta.env.BASE_URL;
// Páginas donde se muestra el botón. Añade rutas aquí si lo quieres en más sitios.
const SHOW_ON = ["/perfil"];

type Access = { loggedIn: boolean; isInstructor: boolean; tier: string; hasAccess: boolean };

export default function AccessFab() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [access, setAccess] = useState<Access | null>(null);

  const load = useCallback(async () => {
    if (!user) { setAccess(null); return; }
    try {
      const r = await fetch(`${BASE}api/access/me`, { cache: "no-store", credentials: "include" });
      setAccess(r.ok ? await r.json() : null);
    } catch { setAccess(null); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load, location]);

  useEffect(() => {
    const on = () => load();
    window.addEventListener("focus", on);
    window.addEventListener("spettro:access-refresh", on);
    return () => {
      window.removeEventListener("focus", on);
      window.removeEventListener("spettro:access-refresh", on);
    };
  }, [load]);

  if (!SHOW_ON.some(p => location.startsWith(p))) return null;
  if (!access?.loggedIn) return null;
  if (!access.isInstructor && !access.hasAccess) return null;

  const teacher = access.isInstructor;
  const color = teacher ? "#9b55f9" : "#ff4db8";

  return (
    <button
      onClick={() => navigate(teacher ? "/profesor" : "/cursos")}
      className="fixed bottom-14 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-xs font-bold tracking-wide transition-all hover:brightness-125 active:scale-95"
      style={{
        background: `linear-gradient(135deg, ${color}30, ${color}12)`,
        border: `1px solid ${color}80`,
        color,
        boxShadow: `0 0 22px ${color}40`,
      }}>
      {teacher ? <GraduationCap className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
      {teacher ? "PANEL DEL PROFESOR" : `MIS CURSOS · PLAN ${access.tier.toUpperCase()}`}
    </button>
  );
}
