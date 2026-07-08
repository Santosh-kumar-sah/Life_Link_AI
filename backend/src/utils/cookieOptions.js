import config from "../config/index.js";

const isProduction = config.NODE_ENV === "production";

/**
 * Access token cookie options
 * @type {import('express').CookieOptions}
 */
export const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: "/"
};

/**
 * Refresh token cookie options
 * @type {import('express').CookieOptions}
 */
export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/api/v1/auth" // Limit cookies transmission scope to auth endpoints only
};

export default {
  accessCookieOptions,
  refreshCookieOptions
};
