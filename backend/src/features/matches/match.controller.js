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
  const { matchId } = req.params;
  const { status } = req.body;

  const updatedMatch = await matchService.updateMatchStatus(matchId, status);

  res.status(200).json({
    success: true,
    data: updatedMatch
  });
});

export default {
  getMyMatches,
  adminGetMatches,
  adminUpdateMatchStatus
};
