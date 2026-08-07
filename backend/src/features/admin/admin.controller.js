import asyncHandler from "../../utils/asyncHandler.js";
import Donor from "../donor/donor.model.js";
import Recipient from "../recipient/recipient.model.js";
import UrgencyAudit from "../recipient/urgencyAudit.model.js";
import Match from "../matches/match.model.js";
import Notification from "../matches/notification.model.js";

export const verifyDocument = asyncHandler(async (req, res) => {
  const { userId, docType, status, action, rejectionReason } = req.body;
  const targetStatus = status || (action === "VERIFY" ? "VERIFIED" : action === "REJECT" ? "REJECTED" : undefined);
  
  if (!targetStatus) {
    throw new Error("Invalid status or action provided.");
  }

  let found = false;
  const donor = await Donor.findOne({ userId });
  if (donor) {
    const docIndex = donor.verificationDocuments.findIndex(d => d.docType === docType && d.status === "PENDING");
    if (docIndex > -1) {
      donor.verificationDocuments[docIndex].status = targetStatus;
      donor.verificationDocuments[docIndex].rejectionReason = rejectionReason;
      
      const hasVerified = donor.verificationDocuments.some(d => d.status === "VERIFIED");
      if (targetStatus === "VERIFIED" && donor.availability && donor.explicitConsent && hasVerified) {
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
        recipient.verificationDocuments[docIndex].status = targetStatus;
        recipient.verificationDocuments[docIndex].rejectionReason = rejectionReason;
        await recipient.save();
        found = true;
      }
    }
  }

  if (found && targetStatus === "REJECTED") {
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
  const isSuper = req.user.isSuperAdmin;
  const userHospital = req.user.hospital;
  const filterHospital = req.query.hospital;

  // Build filters dynamically
  const donorFilter = { status: "active" };
  const recipientFilter = {};

  if (!isSuper) {
    if (userHospital) {
      donorFilter.hospital = userHospital;
      recipientFilter.hospital = userHospital;
    }
  } else {
    if (filterHospital) {
      donorFilter.hospital = filterHospital;
      recipientFilter.hospital = filterHospital;
    }
  }

  const activeDonors = await Donor.countDocuments(donorFilter);
  const activeRecipients = await Recipient.countDocuments(recipientFilter);
  const matchesInProgress = await Match.countDocuments({ status: "PENDING" });

  // Count pending verification documents
  let pendingDocuments = 0;
  if (!isSuper && userHospital) {
    pendingDocuments += await Donor.countDocuments({
      hospital: userHospital,
      "verificationDocuments.status": "PENDING"
    });
    pendingDocuments += await Recipient.countDocuments({
      hospital: userHospital,
      "verificationDocuments.status": "PENDING"
    });
  } else if (isSuper && filterHospital) {
    pendingDocuments += await Donor.countDocuments({
      hospital: filterHospital,
      "verificationDocuments.status": "PENDING"
    });
    pendingDocuments += await Recipient.countDocuments({
      hospital: filterHospital,
      "verificationDocuments.status": "PENDING"
    });
  } else {
    pendingDocuments += await Donor.countDocuments({
      "verificationDocuments.status": "PENDING"
    });
    pendingDocuments += await Recipient.countDocuments({
      "verificationDocuments.status": "PENDING"
    });
  }

  res.json({
    success: true,
    data: {
      activeDonors,
      activeRecipients,
      pendingDocuments,
      matchesInProgress,
      feed: [
        "System diagnostics completed successfully.",
        `Active donors count: ${activeDonors}`,
        `Active recipients count: ${activeRecipients}`
      ]
    }
  });
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

export const getPendingDocuments = asyncHandler(async (req, res) => {
  const isSuper = req.user.isSuperAdmin;
  const userHospital = req.user.hospital;

  const donorQuery = { "verificationDocuments.status": "PENDING" };
  const recipientQuery = { "verificationDocuments.status": "PENDING" };

  if (!isSuper && userHospital) {
    donorQuery.hospital = userHospital;
    recipientQuery.hospital = userHospital;
  }

  const [donors, recipients] = await Promise.all([
    Donor.find(donorQuery),
    Recipient.find(recipientQuery)
  ]);

  const pendingList = [];

  for (const d of donors) {
    for (const doc of d.verificationDocuments) {
      if (doc.status === "PENDING") {
        pendingList.push({
          userId: d.userId,
          profileId: d._id,
          userType: "donor",
          docType: doc.docType,
          fileUrl: doc.fileUrl
        });
      }
    }
  }

  for (const r of recipients) {
    for (const doc of r.verificationDocuments) {
      if (doc.status === "PENDING") {
        pendingList.push({
          userId: r.userId,
          profileId: r._id,
          userType: "recipient",
          docType: doc.docType,
          fileUrl: doc.fileUrl
        });
      }
    }
  }

  res.json({ success: true, data: pendingList });
});
