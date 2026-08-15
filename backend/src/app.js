import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import crypto from "crypto";

import config from "./config/index.js";
import logger from "./config/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import { NotFoundError } from "./utils/ApiError.js";
import authRoutes from "./features/auth/auth.routes.js";
import donorRoutes from "./features/donor/donor.routes.js";
import recipientRoutes from "./features/recipient/recipient.routes.js";
import matchRoutes from "./features/matches/match.routes.js";
import adminRoutes from "./features/admin/admin.routes.js";
import notificationRoutes from "./features/notifications/notification.routes.js";
import supportRoutes from "./features/support/support.routes.js";

const app = express();

// 1. Logging HTTP requests
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    autoLogging: {
      ignore: (req) => req.url === "/health" || req.url === "/favicon.ico"
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query
      }),
      res: (res) => ({
        statusCode: res.statusCode
      })
    }
  })
);

// 2. Helmet.js for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 3. CORS configured with explicit allowed origin and credentials enabled
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    maxAge: 86400 // Cache CORS preflight response for 24h
  })
);

// 4. Rate Limiting to prevent brute force/DOS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // Limit each IP to 200 requests per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many requests from this IP, please try again after 15 minutes."
    }
  }
});
app.use("/api", globalLimiter);

// 5. Body and Cookie Parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser(config.COOKIE_SECRET));

// 6. Base /health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString()
    }
  });
});

// 7. Mount routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/donors", donorRoutes);
app.use("/api/v1/recipients", recipientRoutes);
app.use("/api/v1/matches", matchRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/support", supportRoutes);

// 8. 404 handler for unmatched routes
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.url} not found`));
});

// 9. Central error handler
app.use(errorHandler);

export default app;
export { app };

