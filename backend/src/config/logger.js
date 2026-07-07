import pino from "pino";
import config from "./index.js";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "body.password",
      "body.email",
      "password",
      "refreshToken"
    ],
    censor: "[REDACTED]"
  },
  // Pretty-print in development only
  ...(config.NODE_ENV !== "production" && config.NODE_ENV !== "test" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname"
      }
    }
  })
});

export default logger;
export { logger };
