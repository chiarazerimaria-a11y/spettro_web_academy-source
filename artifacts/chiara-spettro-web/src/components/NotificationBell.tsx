import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BASE = import.meta.env.BASE_URL;

interface Notif {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const email = user?.email ?? "";

  const { data } = useQuery<{ notifications: Notif[]; unread: number }>({
    queryKey: ["notifications", email],
    enabled: !!email,
    refetchInterval: 30000,
    queryFn: () =>
      fetch(BASE + "api/notifications?email=" + encodeURIComponent(email)).then(r => r.json()),
  });

  if (!user) return null;
  const list = data?.notifications ?? [];
  const unread = data?.unread ?? 0;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try {
        await fetch(BASE + "api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        qc.invalidateQueries({ queryKey: ["notifications", email] });
      } catch {}
    }
  };

  return (
    <div className="relative">
      <button onClick={toggle} className="relative p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Avisos">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-black text-[10px] font-mono font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-primary/30 bg-background shadow-xl z-50">
          {list.length === 0 ? (
            <div className="p-4 text-xs font-mono text-muted-foreground">Sin avisos todavía.</div>
          ) : (
            list.map(n => (
              <div key={n.id} className="p-3 border-b border-border last:border-0">
                <div className="text-sm font-mono font-bold text-primary">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
                <div className="text-[10px] text-muted-foreground/60 mt-1">
                  {new Date(n.createdAt).toLocaleString("es-ES")}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
