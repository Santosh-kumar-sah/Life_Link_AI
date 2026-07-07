import { createServer } from "http";
import app from "./app.js";
import config from "./config/index.js";
import logger from "./config/logger.js";

const server = createServer(app);

// Simple health checking for process lifecycle
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    logger.info("HTTP server closed. Exiting process.");
    process.exit(0);
  });

  // Force exit after 10s if connections persist
  setTimeout(() => {
    logger.fatal("Forced shutdown due to active connections");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

server.listen(config.PORT, () => {
  logger.info(`🚀 LifeLink Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
});
