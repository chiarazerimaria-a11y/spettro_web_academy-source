import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual, scryptSync } from "node:crypto";

// Hash scrypt "salt:hash" de la clave de admin. ADMIN_KEY (variable de entorno) tambien funciona.
const ADMIN_KEY_HASH = "e92bb34c5cc63348573879b731a73c5e:2e22d840a4ce10360e6699808cb6a4e79289bb36885a85feaa4c396dc1ea7f05";

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
