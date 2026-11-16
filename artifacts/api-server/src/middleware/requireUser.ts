import { createHash, randomBytes } from "node:crypto";
import type { Request } from "express";

// Devuelve el userId de la cookie FIRMADA (0 si no hay o la firma no es valida).
export function getSessionUserId(req: Request): number {
  const v = (req as Request & { signedCookies?: Record<string, unknown> }).signedCookies?.["spettro_uid"];
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

let _cs: string | null = null;
export function cookieSecret(): string {
  if (_cs) return _cs;
  const env = process.env["COOKIE_SECRET"];
  const base = process.env["DATABASE_URL"] ?? "";
  _cs = env ? env : base ? createHash("sha256").update("spettro-cookie:" + base).digest("hex") : randomBytes(32).toString("hex");
  return _cs;
}
