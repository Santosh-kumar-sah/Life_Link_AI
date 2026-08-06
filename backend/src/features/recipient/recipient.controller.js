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

export const uploadDocument = asyncHandler(async (req, res) => {
  const Recipient = (await import("./recipient.model.js")).default;
  const recipient = await Recipient.findOne({ userId: req.user.userId });
  if (recipient) {
    recipient.verificationDocuments.push({ fileUrl: req.body.fileUrl, docType: req.body.docType, status: "PENDING" });
    await recipient.save();
  }
  res.json({ success: true, data: recipient });
});

export const createMessage = asyncHandler(async (req, res) => {
  const Message = (await import("./message.model.js")).default;
  const Recipient = (await import("./recipient.model.js")).default;
  const recipient = await Recipient.findOne({ userId: req.user.userId });
  const message = await Message.create({ recipientId: recipient._id, text: req.body.text });
  res.json({ success: true, data: message });
});

export const getMessages = asyncHandler(async (req, res) => {
  const Message = (await import("./message.model.js")).default;
  const Recipient = (await import("./recipient.model.js")).default;
  const recipient = await Recipient.findOne({ userId: req.user.userId });
  const messages = await Message.find({ recipientId: recipient._id });
  res.json({ success: true, data: messages });
});

export const getMatchHistory = asyncHandler(async (req, res) => {
  const Recipient = (await import("./recipient.model.js")).default;
  const Match = (await import("../matches/match.model.js")).default;
  const recipient = await Recipient.findOne({ userId: req.user.userId });
  const matches = await Match.find({ recipientId: recipient._id, status: { $in: ["ACCEPTED", "DECLINED", "COMPLETED"] } });
  res.json({ success: true, data: matches });
});

export default {
  updateProfile,
  getMyProfile,
  uploadDocument,
  createMessage,
  getMessages,
  getMatchHistory
};
