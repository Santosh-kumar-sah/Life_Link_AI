import Recipient from "./recipient.model.js";
import { NotFoundError } from "../../utils/ApiError.js";

/**
 * Service to manage Recipient profiles.
 */
class RecipientService {
  /**
   * Creates a new recipient profile or updates an existing one.
   * 
   * @param {string} userId - User ID who owns the profile
   * @param {object} data - Profile details
   * @param {string} data.organNeeded - Organ type needed
   * @param {string} data.bloodGroup - Blood group (Rh-aware)
   * @param {string} data.urgencyLevel - Urgency level
   * @param {number} data.latitude - Latitude coordinate
   * @param {number} data.longitude - Longitude coordinate
   * @param {number} data.weight - Weight of recipient
   * @returns {Promise<import('./recipient.model.js').Recipient>} Saved recipient profile document
   */
  async createOrUpdateProfile(userId, data) {
    const existingProfile = await Recipient.findOne({ userId });
    
    const updatePayload = {
      organNeeded: data.organNeeded !== undefined ? data.organNeeded : existingProfile?.organNeeded,
      bloodGroup: data.bloodGroup !== undefined ? data.bloodGroup : existingProfile?.bloodGroup,
      weight: data.weight !== undefined ? data.weight : existingProfile?.weight,
      hospital: data.hospital !== undefined ? data.hospital : existingProfile?.hospital,
      medicalHistory: data.medicalHistory !== undefined ? data.medicalHistory : existingProfile?.medicalHistory,
    };
    
    if (data.longitude !== undefined && data.latitude !== undefined) {
       updatePayload.location = {
         type: "Point",
         coordinates: [data.longitude, data.latitude]
       };
    }
    
    // urgencyLevel is read-only to them. 
    // either keep existing if updating, or default to "MEDIUM" for new
    if (existingProfile && existingProfile.urgencyLevel) {
      updatePayload.urgencyLevel = existingProfile.urgencyLevel;
    } else {
      updatePayload.urgencyLevel = "MEDIUM"; // default for new
    }

    const options = { new: true, upsert: true, runValidators: true };

    const profile = await Recipient.findOneAndUpdate(
      { userId },
      { $set: updatePayload },
      options
    );

    // Dynamic import to prevent circular dependency, trigger matches generation
    const matchService = (await import("../matches/match.service.js")).default;
    await matchService.generateMatchesForRecipient(profile._id);

    try {
      const { getIO } = await import("../../socket/index.js");
      getIO().to("admin").emit("stats:update");
    } catch (err) {}

    return profile;
  }

  /**
   * Retrieves recipient profile by User ID.
   * 
   * @param {string} userId - User ID
   * @returns {Promise<import('./recipient.model.js').Recipient>} Recipient profile document
   * @throws {NotFoundError} if profile not found
   */
  async getProfileByUserId(userId) {
    const profile = await Recipient.findOne({ userId });
    if (!profile) {
      throw new NotFoundError("Recipient profile not found");
    }
    return profile;
  }
}

export default new RecipientService();
export { RecipientService };
