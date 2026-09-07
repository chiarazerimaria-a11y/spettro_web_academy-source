import type { Request, Response, NextFunction } from "express";

// ─── String sanitization ─────────────────────────────────────────────────────

/** Strip HTML tags, javascript: protocol, inline event handlers, then trim and cap length */
export function sanitizeStr(value: unknown, maxLen = 500): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, maxLen);
}

/** Same as sanitizeStr but returns null when empty (for optional fields) */
export function sanitizeOptional(value: unknown, maxLen = 500): string | null {
  const s = sanitizeStr(value, maxLen);
  return s.length > 0 ? s : null;
}

/** Parse integer, clamp to [min, max], return defaultVal if NaN */
export function safeInt(value: unknown, defaultVal: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const n = parseInt(String(value), 10);
  if (isNaN(n)) return defaultVal;
  return Math.min(max, Math.max(min, n));
}

/** Parse positive float, clamp to [min, max] */
export function safeFloat(value: unknown, defaultVal: number, min = 0, max = 1e9): number {
  const n = parseFloat(String(value));
  if (isNaN(n)) return defaultVal;
  return Math.min(max, Math.max(min, n));
}

// ─── Format validators ────────────────────────────────────────────────────────

/** RFC-5321 light email check */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

/** username: 3-30 chars, letters/numbers/underscore/hyphen */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
}

/** URL: http or https only */
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates avatar URL.
 * Accepts:
 *  - data:image/(jpeg|png|gif|webp);base64,... up to 3 MB
 *  - http(s):// URLs up to 2048 chars
 * Returns null on anything else.
 */
export function sanitizeAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;

  if (value.startsWith("data:")) {
    if (!/^data:image\/(jpeg|png|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) {
      return null;
    }
    if (value.length > 3 * 1024 * 1024) return null;
    return value;
  }

  if (value.length > 2048) return null;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

// ─── Enum allow-lists ─────────────────────────────────────────────────────────

export const ALLOWED_DIFFICULTIES = new Set(["facil", "medio", "dificil", "insano"]);
export const ALLOWED_OS = new Set(["linux", "windows", "both"]);
export const ALLOWED_CATEGORIES = new Set(["writeup", "script", "tool", "notes", "course", "hardware", "herramienta", "plantilla", "mini-curso"]);
export const ALLOWED_PAYOUT_METHODS = new Set(["paypal", "bank_transfer", "transferencia", "bizum", "paypal"]);

// ─── Rate limiter (in-memory, per-IP per-route) ───────────────────────────────

interface RlEntry { count: number; resetAt: number }
const rlStore = new Map<string, RlEntry>();

/** Simple sliding-window rate limiter. windowMs defaults to 60s. */
export function rateLimit(maxRequests: number, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim())
      ?? req.socket.remoteAddress
      ?? "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const entry = rlStore.get(key);

    if (!entry || now > entry.resetAt) {
      rlStore.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    entry.count++;
    if (entry.count > maxRequests) {
      res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });
      return;
    }
    next();
  };
}

// ─── Internal key guard ───────────────────────────────────────────────────────

/**
 * Protects internal/admin-only endpoints.
 * Client must send:  X-Internal-Key: <SESSION_SECRET>
 * (or Authorization: Bearer <SESSION_SECRET>)
 */
export function internalKeyGuard(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env["SESSION_SECRET"] ?? "";
  if (!expected) { next(); return; }
  const provided =
    req.headers["x-internal-key"] ??
    req.headers["authorization"]?.toString().replace(/^Bearer\s+/i, "");
  if (provided !== expected) {
    res.status(403).json({ error: "Acceso restringido" });
    return;
  }
  next();
}
