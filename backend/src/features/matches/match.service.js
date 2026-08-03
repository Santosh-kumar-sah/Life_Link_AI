import Match from "./match.model.js";
import Donor from "../donor/donor.model.js";
import Recipient from "../recipient/recipient.model.js";
import { BLOOD_COMPATIBILITY, calculateMatchScore } from "./matchingEngine.js";
import { NotFoundError, ValidationError } from "../../utils/ApiError.js";

/**
 * Service to manage organ donation matches.
 */
class MatchService {
  /**
   * Helper to find compatible donor blood types for a given recipient blood type.
   * 
   * @param {string} recipientBlood - Recipient's blood group
   * @returns {string[]} Compatible donor blood groups
   */
  getCompatibleDonors(recipientBlood) {
    return Object.keys(BLOOD_COMPATIBILITY).filter((donorBlood) =>
      BLOOD_COMPATIBILITY[donorBlood].includes(recipientBlood)
    );
  }

  /**
   * Generates and saves matches for a donor.
   * 
   * @param {string} donorId - Donor document ID
   * @returns {Promise<import('./match.model.js').Match[]>} Saved matches
   */
  async generateMatchesForDonor(donorId) {
    const donor = await Donor.findById(donorId);
    if (!donor) throw new NotFoundError("Donor not found");

    // Aggregate recipients using geospatial index
    const recipients = await Recipient.aggregate([
      {
        $geoNear: {
          near: donor.location,
          distanceField: "distanceMeters",
          spherical: true,
          query: {
            organNeeded: donor.organType,
            bloodGroup: { $in: BLOOD_COMPATIBILITY[donor.bloodGroup] }
          }
        }
      }
    ]);

    const matchesToSave = [];

    for (const rec of recipients) {
      const distanceKm = rec.distanceMeters / 1000;
      const score = calculateMatchScore(donor, rec, distanceKm);

      // Save/upsert matches exceeding compatibility threshold (e.g. score >= 50)
      if (score !== null && score >= 50) {
        matchesToSave.push({
          donorId: donor._id,
          recipientId: rec._id,
          score,
          status: "PENDING"
        });
      }
    }

    const savedMatches = [];
    for (const matchData of matchesToSave) {
      const match = await Match.findOneAndUpdate(
        { donorId: matchData.donorId, recipientId: matchData.recipientId },
        { score: matchData.score }, // Update score if compatibility calculations changed
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      savedMatches.push(match);
    }

    return savedMatches;
  }

  /**
   * Generates and saves matches for a recipient.
   * 
   * @param {string} recipientId - Recipient document ID
   * @returns {Promise<import('./match.model.js').Match[]>} Saved matches
   */
  async generateMatchesForRecipient(recipientId) {
    const recipient = await Recipient.findById(recipientId);
    if (!recipient) throw new NotFoundError("Recipient not found");

    const compatibleDonors = this.getCompatibleDonors(recipient.bloodGroup);

    // Aggregate donors using geospatial index
    const donors = await Donor.aggregate([
      {
        $geoNear: {
          near: recipient.location,
          distanceField: "distanceMeters",
          spherical: true,
          query: {
            organType: recipient.organNeeded,
            bloodGroup: { $in: compatibleDonors },
            availability: true
          }
        }
      }
    ]);

    const matchesToSave = [];

    for (const don of donors) {
      const distanceKm = don.distanceMeters / 1000;
      const score = calculateMatchScore(don, recipient, distanceKm);

      if (score !== null && score >= 50) {
        matchesToSave.push({
          donorId: don._id,
          recipientId: recipient._id,
          score,
          status: "PENDING"
        });
      }
    }

    const savedMatches = [];
    for (const matchData of matchesToSave) {
      const match = await Match.findOneAndUpdate(
        { donorId: matchData.donorId, recipientId: matchData.recipientId },
        { score: matchData.score },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      savedMatches.push(match);
    }

    return savedMatches;
  }

  /**
   * Gets matches for a donor user, sorted by score descending.
   * 
   * @param {string} userId - User ID of the donor
   * @returns {Promise<import('./match.model.js').Match[]>}
   */
  async getMatchesForDonorUser(userId) {
    const donor = await Donor.findOne({ userId });
    if (!donor) throw new NotFoundError("Donor profile not found");

    // Fetch existing matches and populate recipient profile & user details
    return Match.find({ donorId: donor._id })
      .populate({
        path: "recipientId",
        populate: { path: "userId", select: "email" }
      })
      .sort({ score: -1 });
  }

  /**
   * Gets matches for a recipient user, sorted by score descending.
   * 
   * @param {string} userId - User ID of the recipient
   * @returns {Promise<import('./match.model.js').Match[]>}
   */
  async getMatchesForRecipientUser(userId) {
    const recipient = await Recipient.findOne({ userId });
    if (!recipient) throw new NotFoundError("Recipient profile not found");

    return Match.find({ recipientId: recipient._id })
      .populate({
        path: "donorId",
        populate: { path: "userId", select: "email" }
      })
      .sort({ score: -1 });
  }

  /**
   * Retrieves all matches for administrative view with pagination.
   * 
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Limit per page
   * @returns {Promise<{matches: import('./match.model.js').Match[], total: number, page: number, pages: number}>}
   */
  async getAllMatchesForAdmin(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      Match.find({})
        .populate({
          path: "donorId",
          populate: { path: "userId", select: "email" }
        })
        .populate({
          path: "recipientId",
          populate: { path: "userId", select: "email" }
        })
        .sort({ matchedAt: -1 })
        .skip(skip)
        .limit(limit),
      Match.countDocuments({})
    ]);

    return {
      matches,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Updates match status (Hospital Admin or Donor/Recipient accept).
   * 
   * @param {string} matchId - Match ID
   * @param {string} status - Target status (ACCEPTED, DECLINED, COMPLETED)
   * @returns {Promise<import('./match.model.js').Match>} Updated match
   */
  async updateMatchStatus(matchId, status) {
    const validStatuses = ["ACCEPTED", "DECLINED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid match status. Must be: ${validStatuses.join(", ")}`);
    }

    const match = await Match.findById(matchId);
    if (!match) {
      throw new NotFoundError("Match record not found");
    }

    match.status = status;
    await match.save();

    // If a match is completed or accepted, update donor availability if applicable
    if (status === "COMPLETED") {
      await Donor.findByIdAndUpdate(match.donorId, { availability: false });
    }

    return match;
  }
}

export default new MatchService();
export { MatchService };
