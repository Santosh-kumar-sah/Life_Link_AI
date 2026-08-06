import donorService from "./donor.service.js";
import asyncHandler from "../../utils/asyncHandler.js";

/**
 * Creates or updates the current user's donor profile.
 * 
 * @type {import('express').RequestHandler}
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await donorService.createOrUpdateProfile(req.user.userId, req.body);

  res.status(200).json({
    success: true,
    data: profile
  });
});

/**
 * Gets the current user's donor profile.
 * 
 * @type {import('express').RequestHandler}
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await donorService.getProfileByUserId(req.user.userId);

  res.status(200).json({
    success: true,
    data: profile
  });
});

export const updateConsent = asyncHandler(async (req, res) => {
  const profile = await donorService.createOrUpdateProfile(req.user.userId, { explicitConsent: req.body.explicitConsent });
  res.json({ success: true, data: profile });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const Donor = (await import("./donor.model.js")).default;
  const donor = await Donor.findOne({ userId: req.user.userId });
  if (donor) {
    donor.verificationDocuments.push({ fileUrl: req.body.fileUrl, docType: req.body.docType, status: "PENDING" });
    await donor.save();
  }
  res.json({ success: true, data: donor });
});

export const updateOrgans = asyncHandler(async (req, res) => {
  const profile = await donorService.createOrUpdateProfile(req.user.userId, { organs: req.body.organs });
  res.json({ success: true, data: profile });
});

export const getMatchHistory = asyncHandler(async (req, res) => {
  const Donor = (await import("./donor.model.js")).default;
  const Match = (await import("../matches/match.model.js")).default;
  const donor = await Donor.findOne({ userId: req.user.userId });
  const matches = await Match.find({ donorId: donor._id, status: { $in: ["ACCEPTED", "DECLINED", "COMPLETED"] } });
  res.json({ success: true, data: matches });
});

export default {
  updateProfile,
  getMyProfile,
  updateConsent,
  uploadDocument,
  updateOrgans,
  getMatchHistory
};
