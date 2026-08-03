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
    const updatePayload = {
      organType: data.organType,
      bloodGroup: data.bloodGroup,
      weight: data.weight,
      location: {
        type: "Point",
        coordinates: [data.longitude, data.latitude] // Mongo requires [longitude, latitude]
      }
    };

    if (data.availability !== undefined) {
      updatePayload.availability = data.availability;
    }

    const options = { new: true, upsert: true, runValidators: true };

    const profile = await Donor.findOneAndUpdate(
      { userId },
      updatePayload,
      options
    );

    // Dynamic import to prevent any potential circular dependency issues, trigger matches generation
    const matchService = (await import("../matches/match.service.js")).default;
    await matchService.generateMatchesForDonor(profile._id);

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
