import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual, scryptSync } from "node:crypto";

// Hash scrypt "salt:hash" de la clave de admin. ADMIN_KEY (variable de entorno) tambien funciona.
const ADMIN_KEY_HASH = "da63dff1b4fcad974e059174bbd396db:0b1390620e96e866fece957d97eda0153ac1baae7a6e0103280223c38ba7f39f";

function safeEq(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  const envKey = process.env["ADMIN_KEY"] ?? "";
  const hasHash = ADMIN_KEY_HASH.includes(":");
  if (!envKey && !hasHash) { res.status(503).json({ error: "Admin no configurado" }); return; }

  const header = req.headers["x-admin-key"];
  const provided = String(Array.isArray(header) ? header[0] : header ?? "");
  if (provided.length === 0 || provided.length > 200) {
    res.status(403).json({ error: "Acceso restringido" });
    return;
  }

  let ok = false;
  if (envKey) ok = safeEq(Buffer.from(provided), Buffer.from(envKey));
  if (!ok && hasHash) {
    const [salt, hash] = ADMIN_KEY_HASH.split(":");
    ok = safeEq(scryptSync(provided, salt, 32), Buffer.from(hash, "hex"));
  }
  if (!ok) { res.status(403).json({ error: "Acceso restringido" }); return; }
  next();
}
