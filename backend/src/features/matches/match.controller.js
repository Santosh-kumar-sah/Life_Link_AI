import matchService from "./match.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { AuthError } from "../../utils/ApiError.js";

/**
 * Gets ranked matches for the current logged-in user (donor or recipient).
 * 
 * @type {import('express').RequestHandler}
 */
export const getMyMatches = asyncHandler(async (req, res) => {
  const { role, userId } = req.user;
  let matches = [];

  if (role === "donor") {
    matches = await matchService.getMatchesForDonorUser(userId);
  } else if (role === "recipient") {
    matches = await matchService.getMatchesForRecipientUser(userId);
  } else {
    throw new AuthError("Unauthorized: Role must be donor or recipient to query matches");
  }

  res.status(200).json({
    success: true,
    data: matches
  });
});

/**
 * Admin endpoint: List all matches with pagination.
 * 
 * @type {import('express').RequestHandler}
 */
export const adminGetMatches = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const result = await matchService.getAllMatchesForAdmin(page, limit);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Admin endpoint: Update match status.
 * 
 * @type {import('express').RequestHandler}
 */
export const adminUpdateMatchStatus = asyncHandler(async (req, res) => {
  const match = await matchService.updateMatchStatus(req.params.matchId, req.body.status);
  res.status(200).json({ success: true, data: match });
});

export const getDonorMatches = asyncHandler(async (req, res) => {
  const Donor = (await import("../donor/donor.model.js")).default;
  const Match = (await import("./match.model.js")).default;
  const donor = await Donor.findOne({ userId: req.user.userId });
  const matches = await Match.find({ donorId: donor._id, status: "PENDING" }).populate("recipientId", "organNeeded hospital urgencyLevel");
  res.json({ success: true, data: matches });
});

export const getRecipientMatches = asyncHandler(async (req, res) => {
  const Recipient = (await import("../recipient/recipient.model.js")).default;
  const Match = (await import("./match.model.js")).default;
  const recipient = await Recipient.findOne({ userId: req.user.userId });
  const matches = await Match.find({ recipientId: recipient._id, status: "PENDING" }).populate("donorId", "organs hospital");
  res.json({ success: true, data: matches });
});

export const respondToMatch = asyncHandler(async (req, res) => {
  const Match = (await import("./match.model.js")).default;
  const Donor = (await import("../donor/donor.model.js")).default;
  const match = await Match.findById(req.params.matchId);
  if (!match) {
    return res.status(404).json({ success: false, error: { message: "Match not found" } });
  }

  const { action, reason, declineReason } = req.body;
  const finalReason = declineReason || reason || "";
  
  let finalStatus = action;
  if (action === "ACCEPT") finalStatus = "ACCEPTED";
  if (action === "DECLINE") finalStatus = "DECLINED";

  if (req.user.role === "donor") {
    match.donorStatus = finalStatus;
  } else if (req.user.role === "recipient") {
    match.recipientStatus = finalStatus;
  }
  
  if (finalStatus === "DECLINED") {
    match.status = "DECLINED";
    match.declineReason = finalReason;
  } else if (match.donorStatus === "ACCEPTED" && match.recipientStatus === "ACCEPTED") {
    match.status = "ACCEPTED";
  }
  
  await match.save();
  res.json({ success: true, data: match });
});

export default {
  getMyMatches,
  adminGetMatches,
  adminUpdateMatchStatus,
  getDonorMatches,
  getRecipientMatches,
  respondToMatch
};
