import asyncHandler from "../../utils/asyncHandler.js";
import Donor from "../donor/donor.model.js";
import Recipient from "../recipient/recipient.model.js";
import UrgencyAudit from "../recipient/urgencyAudit.model.js";
import Match from "../matches/match.model.js";
import Notification from "../matches/notification.model.js";

export const verifyDocument = asyncHandler(async (req, res) => {
  const { userId, docType, status, rejectionReason } = req.body;
  
  let found = false;
  const donor = await Donor.findOne({ userId });
  if (donor) {
    const docIndex = donor.verificationDocuments.findIndex(d => d.docType === docType && d.status === "PENDING");
    if (docIndex > -1) {
      donor.verificationDocuments[docIndex].status = status;
      donor.verificationDocuments[docIndex].rejectionReason = rejectionReason;
      
      const hasVerified = donor.verificationDocuments.some(d => d.status === "VERIFIED");
      if (status === "VERIFIED" && donor.availability && donor.explicitConsent && hasVerified) {
        donor.status = "active";
      }
      await donor.save();
      found = true;
    }
  } 

  if (!found) {
    const recipient = await Recipient.findOne({ userId });
    if (recipient) {
      const docIndex = recipient.verificationDocuments.findIndex(d => d.docType === docType && d.status === "PENDING");
      if (docIndex > -1) {
        recipient.verificationDocuments[docIndex].status = status;
        recipient.verificationDocuments[docIndex].rejectionReason = rejectionReason;
        await recipient.save();
        found = true;
      }
    }
  }

  if (found && status === "REJECTED") {
    await Notification.create({ userId, title: "Document Rejected", message: `Your ${docType} was rejected. Reason: ${rejectionReason}`, type: "DOC_REJECTED" });
  }

  res.json({ success: true, message: found ? "Document verified" : "Document not found" });
});

export const updateUrgency = asyncHandler(async (req, res) => {
  const { recipientId, urgencyLevel, justification } = req.body;
  const recipient = await Recipient.findById(recipientId);
  if (!recipient) throw new Error("Recipient not found");
  
  const oldLevel = recipient.urgencyLevel;
  recipient.urgencyLevel = urgencyLevel;
  await recipient.save();
  
  await UrgencyAudit.create({ recipientId, adminId: req.user.userId, previousLevel: oldLevel, newLevel: urgencyLevel, justification });
  res.json({ success: true });
});

export const dashboard = asyncHandler(async (req, res) => {
  const hospital = req.user.hospital;
  const activeDonors = await Donor.countDocuments({ status: "active", hospital });
  const activeRecipients = await Recipient.countDocuments({ hospital });
  const matchesInProgress = await Match.countDocuments({ status: "PENDING" }); // simplistic
  res.json({ success: true, data: { activeDonors, activeRecipients, pendingDocuments: 0, matchesInProgress, feed: [] } });
});

export const analytics = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { matchSuccessRate: 85, avgTimeToMatch: 12, waitlistTrend: [], docVerificationTurnaround: 24 } });
});

export const matchingCandidates = asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
});

export const proposeMatch = asyncHandler(async (req, res) => {
  const { donorId, recipientId, responseDeadline } = req.body;
  const match = await Match.create({ donorId, recipientId, score: 95, status: "PENDING", responseDeadline, proposedBy: req.user.userId });
  
  const donor = await Donor.findById(donorId);
  const recipient = await Recipient.findById(recipientId);
  
  if (donor) await Notification.create({ userId: donor.userId, title: "New Match Proposed", message: "You have a new match proposed.", type: "MATCH_PROPOSED" });
  if (recipient) await Notification.create({ userId: recipient.userId, title: "New Match Proposed", message: "You have a new match proposed.", type: "MATCH_PROPOSED" });
  
  res.json({ success: true, data: match });
});
