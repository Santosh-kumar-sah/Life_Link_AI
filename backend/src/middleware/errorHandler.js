import config from "../config/index.js";
import logger from "../config/logger.js";
import ApiError from "../utils/ApiError.js";

/**
 * Express error-handling middleware.
 * Ensures consistent output shape: { success: false, error: { message, code, errors } }
 *
 * @type {import('express').ErrorRequestHandler}
 */
export const errorHandler = (err, req, res, next) => {
  let errorResponse = {
    message: err.message || "Internal Server Error"
  };

  let statusCode = 500;

  // Check if it's our custom API Error
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    if (err.errors) {
      errorResponse.errors = err.errors;
    }
  } else if (err.name === "ValidationError") {
    // Handling Mongoose Validation Errors
    statusCode = 400;
    errorResponse.message = "Mongoose Validation Failed";
    errorResponse.errors = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  } else if (err.code === 11000) {
    // Mongoose Duplicate Key Error
    statusCode = 409;
    errorResponse.message = "Duplicate value provided for unique field";
  }

  // Log error using pino
  if (statusCode >= 500) {
    logger.error({ err, reqId: req.id }, "Internal server error occurred");
    // Hide details in production
    if (config.NODE_ENV === "production") {
      errorResponse.message = "An unexpected error occurred. Please contact system support.";
    }
  } else {
    logger.warn({ err: { message: err.message, statusCode }, reqId: req.id }, "Client error request");
  }

  // Include stack trace in development
  if (config.NODE_ENV !== "production" && config.NODE_ENV !== "test") {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    error: errorResponse
  });
};

export default errorHandler;
