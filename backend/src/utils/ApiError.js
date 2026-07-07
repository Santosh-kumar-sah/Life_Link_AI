/**
 * Base Custom API Error Class
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {boolean} isOperational
   * @param {string} stack
   */
  constructor(statusCode, message, isOperational = true, stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation Error Class (HTTP 400)
 */
export class ValidationError extends ApiError {
  /**
   * @param {string} message
   * @param {object} [errors]
   */
  constructor(message = "Validation Failed", errors = {}) {
    super(400, message);
    this.errors = errors;
  }
}

/**
 * Authentication & Authorization Error Class (HTTP 401/403)
 */
export class AuthError extends ApiError {
  /**
   * @param {string} message
   * @param {boolean} [forbidden]
   */
  constructor(message = "Unauthorized Access", forbidden = false) {
    super(forbidden ? 403 : 401, message);
  }
}

/**
 * Resource Not Found Error Class (HTTP 404)
 */
export class NotFoundError extends ApiError {
  /**
   * @param {string} message
   */
  constructor(message = "Resource Not Found") {
    super(404, message);
  }
}

/**
 * Conflict Error Class (HTTP 409)
 */
export class ConflictError extends ApiError {
  /**
   * @param {string} message
   */
  constructor(message = "Resource Conflict") {
    super(409, message);
  }
}

export default ApiError;
