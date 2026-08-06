/**
 * Rh-Aware Blood Group Compatibility Map
 * Key is the Donor, Value is the list of compatible Recipients.
 * 
 * @type {Record<string, string[]>}
 */
export const BLOOD_COMPATIBILITY = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"]
};

/**
 * Calculates Haversine distance in kilometers between two coordinates.
 * Used as a fallback for unit tests or when db distances are not pre-calculated.
 * 
 * Tradeoff Note: We use MongoDB's 2dsphere index and $geoNear/$nearSphere during
 * database queries to scale geographically, but this JS Haversine fallback enables
 * unit testing matching scores without database connections.
 * 
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon2 - Longitude of point 2
 * @param {number} lat2 - Latitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateHaversineDistance(lon1, lat1, lon2, lat2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes a matching score (0-100) between a donor and a recipient.
 * Returns null if blood group or organ type is incompatible.
 * 
 * @param {object} donor - Donor profile details
 * @param {string} donor.organType - Type of organ offered
 * @param {string} donor.bloodGroup - Blood group of donor (Rh-aware)
 * @param {number} donor.weight - Weight in kg
 * @param {object} donor.location - Location object with coordinates [lon, lat]
 * @param {object} recipient - Recipient profile details
 * @param {string} recipient.organNeeded - Type of organ needed
 * @param {string} recipient.bloodGroup - Blood group of recipient (Rh-aware)
 * @param {string} recipient.urgencyLevel - Urgency Level (LOW, MEDIUM, HIGH, CRITICAL)
 * @param {number} recipient.weight - Weight in kg
 * @param {object} recipient.location - Location object with coordinates [lon, lat]
 * @param {Date|string} recipient.registrationDate - Registration date of recipient
 * @param {number} [precalculatedDistanceKm] - Optional precalculated distance in km (e.g. from MongoDB $geoNear query)
 * @returns {number|null} Match compatibility score (0-100), or null if incompatible
 */
export function calculateMatchScore(donor, recipient, precalculatedDistanceKm = null) {
  const organsList = donor.organs || (donor.organType ? [donor.organType] : []);
  if (!organsList.includes(recipient.organNeeded)) {
    return null;
  }

  // 2. Blood Group Compatibility Filter (Strict Rh-Aware check)
  const compatibleRecipients = BLOOD_COMPATIBILITY[donor.bloodGroup];
  if (!compatibleRecipients || !compatibleRecipients.includes(recipient.bloodGroup)) {
    return null;
  }

  // --- SCORE COMPONENT 1: Blood Group Match Quality (Weight: 0.20) ---
  let bloodScore = 50; // Compatible but non-identical
  if (donor.bloodGroup === recipient.bloodGroup) {
    bloodScore = 100; // Perfect identical match
  }

  // --- SCORE COMPONENT 2: Medical Urgency & Waiting Time (Weight: 0.40) ---
  const urgencyBaseScores = {
    CRITICAL: 100,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25
  };

  const baseUrgencyScore = urgencyBaseScores[recipient.urgencyLevel] || 25;
  
  // Waiting Time Modifier: +1 point for every 30 days registered, capped at 10 points
  const regDate = new Date(recipient.registrationDate);
  const diffTime = Math.max(0, Date.now() - regDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const waitingBonus = Math.min(10, Math.floor(diffDays / 30));
  
  const urgencyScore = Math.min(100, baseUrgencyScore + waitingBonus);

  // --- SCORE COMPONENT 3: Distance/Proximity (Weight: 0.20) ---
  let distanceKm = precalculatedDistanceKm;
  if (distanceKm === null || distanceKm === undefined) {
    const [lon1, lat1] = donor.location.coordinates;
    const [lon2, lat2] = recipient.location.coordinates;
    distanceKm = calculateHaversineDistance(lon1, lat1, lon2, lat2);
  }

  const maxDistanceKm = 2000;
  const distanceScore = Math.max(0, 100 * (1 - distanceKm / maxDistanceKm));

  // --- SCORE COMPONENT 4: Weight/Size Compatibility (Weight: 0.20) ---
  const ratio = donor.weight / recipient.weight;
  let sizeScore = 0;
  if (ratio >= 0.8 && ratio <= 1.2) {
    sizeScore = 100;
  } else {
    // Gradual score drop-off based on deviation from perfect ratio (1.0)
    sizeScore = Math.max(0, 100 * (1 - Math.abs(1 - ratio)));
  }

  // --- WEIGHTED SUM ---
  const finalScore =
    0.20 * bloodScore +
    0.40 * urgencyScore +
    0.20 * distanceScore +
    0.20 * sizeScore;

  // Round to nearest 2 decimal places
  return Math.round(finalScore * 100) / 100;
}

export default {
  BLOOD_COMPATIBILITY,
  calculateHaversineDistance,
  calculateMatchScore
};
