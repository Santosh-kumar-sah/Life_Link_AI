import Donor from "./donor.model.js";
import { NotFoundError } from "../../utils/ApiError.js";

/**
 * Service to manage Donor profiles.
 */
class DonorService {
  /**
   * Creates a new donor profile or updates an existing one.
   * 
   * @param {string} userId - User ID who owns the profile
   * @param {object} data - Profile details
   * @param {string} data.organType - Organ type
   * @param {string} data.bloodGroup - Blood group (Rh-aware)
   * @param {boolean} [data.availability] - Availability flag
   * @param {number} data.latitude - Latitude coordinate
   * @param {number} data.longitude - Longitude coordinate
   * @param {number} data.weight - Weight of donor
   * @returns {Promise<import('./donor.model.js').Donor>} Saved donor profile document
   */
  async createOrUpdateProfile(userId, data) {
    const existingProfile = await Donor.findOne({ userId });
    
    const updatePayload = {
      organs: data.organs !== undefined ? data.organs : existingProfile?.organs,
      bloodGroup: data.bloodGroup !== undefined ? data.bloodGroup : existingProfile?.bloodGroup,
      weight: data.weight !== undefined ? data.weight : existingProfile?.weight,
      donorType: data.donorType !== undefined ? data.donorType : existingProfile?.donorType,
      medicalHistory: data.medicalHistory !== undefined ? data.medicalHistory : existingProfile?.medicalHistory,
      hospital: data.hospital !== undefined ? data.hospital : existingProfile?.hospital,
    };
    
    if (data.longitude !== undefined && data.latitude !== undefined) {
      updatePayload.location = {
        type: "Point",
        coordinates: [data.longitude, data.latitude]
      };
    }

    if (data.availability !== undefined) {
      updatePayload.availability = data.availability;
    }
    
    if (data.explicitConsent !== undefined) {
      updatePayload.explicitConsent = data.explicitConsent;
    }

    // Determine status
    const availability = updatePayload.availability !== undefined ? updatePayload.availability : existingProfile?.availability;
    const explicitConsent = updatePayload.explicitConsent !== undefined ? updatePayload.explicitConsent : existingProfile?.explicitConsent;
    const verificationDocs = existingProfile?.verificationDocuments || [];
    const hasVerifiedDocs = verificationDocs.some(d => d.status === "VERIFIED");
    const isMatched = existingProfile?.status === "matched";

    if (!isMatched) {
       if (availability && explicitConsent && hasVerifiedDocs) {
          updatePayload.status = "active";
       } else {
          updatePayload.status = "inactive";
       }
    }

    const options = { new: true, upsert: true, runValidators: true };

    const profile = await Donor.findOneAndUpdate(
      { userId },
      { $set: updatePayload },
      options
    );

    const matchService = (await import("../matches/match.service.js")).default;
    
    if (updatePayload.explicitConsent === false) {
      // cancel any in-flight matches where status is PENDING
      const Match = (await import("../matches/match.model.js")).default;
      const pendingMatches = await Match.find({ donorId: profile._id, status: "PENDING" });
      
      for (const match of pendingMatches) {
        match.status = "DECLINED";
        match.declineReason = "Donor revoked consent";
        await match.save();
        
        // Notify admins/recipients
        const Notification = (await import("../matches/notification.model.js")).default;
        
        // Notify recipient
        const Recipient = (await import("../recipient/recipient.model.js")).default;
        const recipient = await Recipient.findById(match.recipientId);
        if (recipient) {
          await Notification.create({
            userId: recipient.userId,
            title: "Match Cancelled",
            message: "A potential match was cancelled because the donor revoked consent.",
            type: "MATCH_CANCELLED"
          });
        }
      }
    }

    if (profile.status === "active") {
      await matchService.generateMatchesForDonor(profile._id);
    }

    return profile;
  }

  /**
   * Retrieves donor profile by User ID.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<import('./donor.model.js').Donor>} Donor profile document
   * @throws {NotFoundError} if profile not found
   */
  async getProfileByUserId(userId) {
    const profile = await Donor.findOne({ userId });
    if (!profile) {
      throw new NotFoundError("Donor profile not found");
    }
    return profile;
  }
}

export default new DonorService();
export { DonorService };
