import app from "./app";
import { logger } from "./lib/logger";
import { runSeed } from "./seed";
import { ensureGhcSchema, ensureMachinePricingSchema, ensureGiftSchema } from "./ghc";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const startServer = () => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
};

ensureGhcSchema().catch((err) => logger.error({ err }, "GhostCoin: no se pudo preparar el esquema"));
ensureMachinePricingSchema().catch((err) => logger.error({ err }, "Máquinas: no se pudo preparar el esquema de precios"));
ensureGiftSchema().catch((err) => logger.error({ err }, "Regalo: no se pudo preparar el esquema"));

// El seed SOLO corre si RUN_SEED=true en el .env (datos de ejemplo opcionales)
if (process.env["RUN_SEED"] === "true") {
  runSeed().then(startServer).catch((err) => {
    logger.error({ err }, "Fatal seed error — starting server anyway");
    startServer();
  });
} else {
  startServer();
}
