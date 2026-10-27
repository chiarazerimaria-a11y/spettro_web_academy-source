import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";

/** Exige X-Admin-Key == ADMIN_KEY. Si ADMIN_KEY no esta definida, bloquea todo (nunca deja pasar). */
export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env["ADMIN_KEY"] ?? "";
  if (!expected) { res.status(503).json({ error: "Admin no configurado" }); return; }
  const header = req.headers["x-admin-key"];
  const provided = String(Array.isArray(header) ? header[0] : header ?? "");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(403).json({ error: "Acceso restringido" });
    return;
  }
  next();
}
