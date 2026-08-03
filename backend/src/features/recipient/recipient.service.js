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
    const updatePayload = {
      organNeeded: data.organNeeded,
      bloodGroup: data.bloodGroup,
      urgencyLevel: data.urgencyLevel,
      weight: data.weight,
      location: {
        type: "Point",
        coordinates: [data.longitude, data.latitude] // Mongo requires [longitude, latitude]
      }
    };

    const options = { new: true, upsert: true, runValidators: true };

    const profile = await Recipient.findOneAndUpdate(
      { userId },
      updatePayload,
      options
    );

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
