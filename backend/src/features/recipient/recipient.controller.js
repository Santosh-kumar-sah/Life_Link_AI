import recipientService from "./recipient.service.js";
import asyncHandler from "../../utils/asyncHandler.js";

/**
 * Creates or updates the current user's recipient profile.
 * 
 * @type {import('express').RequestHandler}
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await recipientService.createOrUpdateProfile(req.user.userId, req.body);

  res.status(200).json({
    success: true,
    data: profile
  });
});

/**
 * Gets the current user's recipient profile.
 * 
 * @type {import('express').RequestHandler}
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await recipientService.getProfileByUserId(req.user.userId);

  res.status(200).json({
    success: true,
    data: profile
  });
});

export default {
  updateProfile,
  getMyProfile
};
