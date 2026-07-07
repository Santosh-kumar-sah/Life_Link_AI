import mongoose from "mongoose";
import config from "./index.js";
import logger from "./logger.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Initializes and establishes MongoDB connection using Mongoose.
 * Retries up to MAX_RETRIES times if initial connection fails.
 * 
 * @returns {Promise<void>}
 */
export async function connectDB() {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      logger.info("🔌 MongoDB connected successfully");

      // Bind connection event listeners
      mongoose.connection.on("error", (err) => {
        logger.error({ err }, "MongoDB connection error occurred");
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB connection disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        logger.info("MongoDB connection reestablished");
      });

      return;
    } catch (err) {
      retries += 1;
      logger.error(
        { err, retries },
        `MongoDB connection failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`
      );
      if (retries >= MAX_RETRIES) {
        logger.fatal("❌ Maximum MongoDB connection retries reached. Exiting application.");
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export default connectDB;
