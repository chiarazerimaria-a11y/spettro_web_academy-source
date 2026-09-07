import app from "./app";
import { logger } from "./lib/logger";
import { runSeed } from "./seed";

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

// Run seed before starting — ensures production DB always has required data
runSeed().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}).catch((err) => {
  logger.error({ err }, "Fatal seed error — starting server anyway");
  app.listen(port, () => {
    logger.info({ port }, "Server listening (seed failed)");
  });
});
