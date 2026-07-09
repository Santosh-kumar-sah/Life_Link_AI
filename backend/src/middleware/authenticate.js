import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { AuthError } from "../utils/ApiError.js";

/**
 * Authentication middleware. Verifies access token from httpOnly signed cookies.
 * 
 * @type {import('express').RequestHandler}
 * @throws {AuthError} if token is missing, invalid or expired
 */
export const authenticate = (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    throw new AuthError("Access denied. Authentication token is missing.");
  }

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    req.user = decoded; // { userId, role }
    next();
  } catch (err) {
    throw new AuthError("Invalid or expired authentication token");
  }
};

/**
 * Authorization middleware. Restricts access to specific roles.
 * 
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {import('express').RequestHandler}
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthError("User context not established");
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthError("Forbidden: Insufficient role permissions", true);
    }
    
    next();
  };
};

export default authenticate;
export { authenticate as requireAuth };
