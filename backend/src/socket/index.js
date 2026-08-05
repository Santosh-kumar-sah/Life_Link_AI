import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import logger from "../config/logger.js";

/** @type {Server|null} */
let ioInstance = null;

/**
 * Initializes the Socket.io server instance.
 * 
 * @param {import('http').Server} httpServer - Express HTTP server wrapper
 * @returns {Server} Initialized Socket.io server
 */
export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication Handshake Middleware using JWT httpOnly cookies
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const parsedCookies = cookie.parse(cookieHeader);
      const token = parsedCookies.access_token;

      if (!token) {
        return next(new Error("Authentication failed: Missing access token cookie"));
      }

      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
      socket.user = decoded; // { userId, role }
      next();
    } catch (err) {
      logger.warn({ err: err.message }, "Socket.io handshake authentication rejected");
      next(new Error("Authentication failed: Invalid or expired access token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.user;
    logger.info({ userId, role, socketId: socket.id }, "Socket client connected");

    // 1. Join user-specific private room for targeted alerts
    socket.join(`user:${userId}`);

    // 2. Join role-specific broadcast rooms
    if (role === "admin") {
      socket.join("admin");
      logger.info({ socketId: socket.id }, "Socket client joined admin room");
    }

    socket.on("disconnect", (reason) => {
      logger.info({ userId, socketId: socket.id, reason }, "Socket client disconnected");
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Retrieves the active Socket.io server instance.
 * 
 * @returns {Server}
 * @throws {Error} if socket server is not yet initialized
 */
export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized yet. Call initializeSocket first.");
  }
  return ioInstance;
}

/**
 * Emits real-time match events to associated participants and admin operators.
 * 
 * @param {object} match - Persisted Match record
 * @param {object} donorUser - Donor user info (id, email)
 * @param {object} recipientUser - Recipient user info (id, email)
 */
export function emitNewMatchNotification(match, donorUser, recipientUser) {
  try {
    const io = getIO();
    const matchPayload = {
      matchId: match._id,
      score: match.score,
      status: match.status,
      matchedAt: match.matchedAt,
      donor: {
        userId: donorUser.userId,
        email: donorUser.email,
        organType: match.donorId?.organType,
        bloodGroup: match.donorId?.bloodGroup
      },
      recipient: {
        userId: recipientUser.userId,
        email: recipientUser.email,
        organNeeded: match.recipientId?.organNeeded,
        bloodGroup: match.recipientId?.bloodGroup,
        urgencyLevel: match.recipientId?.urgencyLevel
      }
    };

    // Notify Donor user
    io.to(`user:${donorUser.userId}`).emit("match:new", matchPayload);

    // Notify Recipient user
    io.to(`user:${recipientUser.userId}`).emit("match:new", matchPayload);

    // Notify Admin operator room
    io.to("admin").emit("match:admin_new", matchPayload);

    logger.info({ matchId: match._id }, "Real-time match notifications emitted successfully");
  } catch (err) {
    logger.error({ err: err.message }, "Failed to emit real-time match notifications");
  }
}

export default {
  initializeSocket,
  getIO,
  emitNewMatchNotification
};
