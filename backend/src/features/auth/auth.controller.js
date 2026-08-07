import authService from "./auth.service.js";
import User from "./user.model.js";
import Donor from "../donor/donor.model.js";
import Recipient from "../recipient/recipient.model.js";
import { accessCookieOptions, refreshCookieOptions } from "../../utils/cookieOptions.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { AuthError } from "../../utils/ApiError.js";

/**
 * Register a new user
 * 
 * @type {import('express').RequestHandler}
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const user = await authService.register(email, password, role);

  res.status(201).json({
    success: true,
    data: {
      userId: user._id,
      email: user.email,
      role: user.role
    }
  });
});

/**
 * Login user and issue cookie tokens
 * 
 * @type {import('express').RequestHandler}
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);

  // Set cookies
  res.cookie("access_token", accessToken, accessCookieOptions);
  res.cookie("refresh_token", refreshToken, refreshCookieOptions);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    }
  });
});

/**
 * Refresh credentials and rotate tokens
 * 
 * @type {import('express').RequestHandler}
 */
export const refresh = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies.refresh_token;
  if (!oldRefreshToken) {
    throw new AuthError("Refresh token is missing from cookies");
  }

  const { accessToken, refreshToken } = await authService.refresh(oldRefreshToken);

  // Set updated cookies
  res.cookie("access_token", accessToken, accessCookieOptions);
  res.cookie("refresh_token", refreshToken, refreshCookieOptions);

  res.status(200).json({
    success: true,
    data: {
      message: "Access tokens refreshed successfully"
    }
  });
});

/**
 * Logout user and clear tokens
 * 
 * @type {import('express').RequestHandler}
 */
export const logout = asyncHandler(async (req, res) => {
  // If user context exists, clear refresh token in database
  if (req.user && req.user.userId) {
    await authService.logout(req.user.userId);
  }

  // Destructure maxAge out so we don't pass it to clearCookie (causes Express deprecation warning)
  const { maxAge: _accessMaxAge, ...accessClearOptions } = accessCookieOptions;
  const { maxAge: _refreshMaxAge, ...refreshClearOptions } = refreshCookieOptions;

  res.clearCookie("access_token", accessClearOptions);
  res.clearCookie("refresh_token", refreshClearOptions);

  res.status(200).json({
    success: true,
    data: {
      message: "Logged out successfully"
    }
  });
});

/**
 * Retrieve current user session context
 * 
 * @type {import('express').RequestHandler}
 */
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new AuthError("User session is invalid");
  }

  let profile = null;
  if (user.role === "donor") {
    profile = await Donor.findOne({ userId: user._id });
  } else if (user.role === "recipient") {
    profile = await Recipient.findOne({ userId: user._id });
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile
      }
    }
  });
});

export const inviteAdmin = asyncHandler(async (req, res) => {
  if (!req.user.isSuperAdmin) throw new AuthError("SuperAdmin only");
  const { email, password, hospital } = req.body;
  const user = await authService.register(email, password, "admin");
  await User.updateOne({ _id: user._id }, { $set: { hospital, isActive: true } });
  
  // Set properties locally for response payload representation
  user.hospital = hospital;
  user.isActive = true;
  res.json({ success: true, data: user });
});

export const updateAdminStatus = asyncHandler(async (req, res) => {
  if (!req.user.isSuperAdmin) throw new AuthError("SuperAdmin only");
  await User.updateOne({ _id: req.params.adminId }, { $set: { isActive: req.body.isActive } });
  res.json({ success: true });
});

export default {
  register,
  login,
  refresh,
  logout,
  me,
  inviteAdmin,
  updateAdminStatus
};
