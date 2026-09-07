import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "login" | "register";

export default function Login() {
  const [, navigate] = useLocation();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        setSuccess("¡Sesión iniciada! Redirigiendo...");
        setTimeout(() => navigate("/lab"), 800);
      } else {
        await register(username, email, password, "ghost");
        setSuccess("¡Cuenta creada! Redirigiendo...");
        setTimeout(() => navigate("/lab"), 800);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#0a0a0f" }}
    >
      {/* background glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(255,77,184,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 70% 60%, rgba(155,85,249,0.07) 0%, transparent 70%)",
        }}
      />
      {/* grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,184,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* logo / brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="h-6 w-6" style={{ color: "#ff4db8" }} />
            <span
              className="text-2xl font-black tracking-widest uppercase"
              style={{
                background: "linear-gradient(135deg, #ff4db8, #9b55f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SpettroWeb
            </span>
          </div>
          <p className="text-xs tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
            Academia de Hacking
          </p>
        </div>

        {/* card */}
        <div
          className="rounded-2xl p-8 relative"
          style={{
            background: "rgba(10,10,20,0.95)",
            border: "1px solid rgba(255,77,184,0.2)",
            boxShadow: "0 0 40px rgba(255,77,184,0.06), 0 0 80px rgba(155,85,249,0.04)",
          }}
        >
          {/* tabs */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300"
                style={
                  mode === m
                    ? {
                        background: "linear-gradient(135deg, rgba(255,77,184,0.2), rgba(155,85,249,0.2))",
                        border: "1px solid rgba(255,77,184,0.3)",
                        color: "#ff4db8",
                      }
                    : { color: "rgba(255,255,255,0.3)", border: "1px solid transparent" }
                }
              >
                {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  key="username-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Field
                    icon={<User className="h-4 w-4" />}
                    type="text"
                    placeholder="Nombre de usuario"
                    value={username}
                    onChange={setUsername}
                    autoComplete="username"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Field
              icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />

            <div className="relative">
              <Field
                icon={<Lock className="h-4 w-4" />}
                type={showPass ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(255,255,255,0.3)" }}
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {mode === "register" && (
              <p className="text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>
                Usuario: 3–30 caracteres, letras, números, _ o -. Contraseña: mínimo 8 caracteres.
              </p>
            )}

            {/* error / success */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}
                >
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 mt-1 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                background: loading
                  ? "rgba(255,77,184,0.15)"
                  : "linear-gradient(135deg, #ff4db8, #9b55f9)",
                color: "#fff",
                boxShadow: loading ? "none" : "0 0 24px rgba(255,77,184,0.3)",
              }}
            >
              {loading
                ? "Procesando..."
                : mode === "login"
                ? "Entrar"
                : "Crear cuenta"}
            </button>
          </form>
        </div>

        {/* back to home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-xs transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,77,184,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            ← Volver al inicio
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface FieldProps {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}
function Field({ icon, type, placeholder, value, onChange, autoComplete }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? "rgba(255,77,184,0.4)" : "rgba(255,255,255,0.08)"}`,
        boxShadow: focused ? "0 0 0 3px rgba(255,77,184,0.07)" : "none",
      }}
    >
      <span style={{ color: focused ? "#ff4db8" : "rgba(255,255,255,0.3)" }}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-sm"
        style={{
          color: "#fff",
          caretColor: "#ff4db8",
        }}
      />
    </div>
  );
}
