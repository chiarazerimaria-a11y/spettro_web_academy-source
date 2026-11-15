import type { Request } from "express";

// Devuelve el userId de la cookie FIRMADA (0 si no hay o la firma no es valida).
export function getSessionUserId(req: Request): number {
  const v = (req as Request & { signedCookies?: Record<string, unknown> }).signedCookies?.["spettro_uid"];
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}
