import asyncHandler from "../../utils/asyncHandler.js";
import Notification from "../matches/notification.model.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const notifs = await Notification.find({ userId: req.user.userId }).sort("-createdAt");
  res.json({ success: true, data: notifs });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});
