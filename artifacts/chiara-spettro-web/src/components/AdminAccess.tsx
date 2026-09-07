import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";

export default function AdminAccess() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === "chiara@3012") {
      setOpen(false);
      setPw("");
      navigate("/admin");
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 1500);
      setPw("");
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setPw(""); setError(false); }
  };

  return (
    <>
      {/* Small lock icon fixed bottom-right — subtle but visible on hover */}
      <button
        onClick={() => setOpen(true)}
        title=""
        aria-label=""
        className="fixed bottom-4 right-4 z-50 opacity-20 hover:opacity-70 transition-opacity duration-300 cursor-pointer p-1 select-none"
        style={{ outline: "none", border: "none", background: "none" }}
      >
        <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="7" width="12" height="9" rx="2" fill="none" stroke="#ff4db8" strokeWidth="1.5"/>
          <path d="M4 7V5a3 3 0 1 1 6 0v2" stroke="#ff4db8" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="7" cy="11.5" r="1" fill="#ff4db8"/>
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); setPw(""); setError(false); } }}
          onKeyDown={handleKey}
        >
          <div className={`bg-[#0a0a0f] border border-primary/30 rounded-lg p-6 w-80 shadow-[0_0_30px_rgba(255,77,184,0.15)] font-mono ${shake ? "animate-bounce" : ""}`}>
            <div className="text-xs text-muted-foreground mb-1">root@chiara:~#</div>
            <div className="text-primary text-sm mb-4">sudo su -</div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-xs select-none">$</span>
                <input
                  ref={inputRef}
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="contraseña_"
                  autoComplete="off"
                  className={`w-full bg-black/60 border ${error ? "border-red-500 text-red-400" : "border-primary/30 text-foreground"} rounded pl-7 pr-3 py-2 text-sm font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/40`}
                />
              </div>
              {error && (
                <p className="text-red-500 text-xs font-mono animate-pulse">Acceso denegado. Permiso insuficiente.</p>
              )}
              <button
                type="submit"
                className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary text-primary text-xs py-2 rounded transition-all font-mono"
              >
                AUTENTICAR
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
