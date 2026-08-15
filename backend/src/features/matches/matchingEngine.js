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
 * Calculates HLA mismatch count (0 to 6) between donor and recipient.
 * Mismatch occurs when a donor allele is not present in the recipient's alleles for that locus.
 * 
 * @param {object} donorHla - Donor's HLA object
 * @param {object} recipientHla - Recipient's HLA object
 * @returns {number} Mismatch count from 0 to 6
 */
export function calculateHlaMismatch(donorHla, recipientHla) {
  if (!donorHla || !recipientHla) return 6; // Max mismatch if hla is missing
  
  let mismatch = 0;

  // Locus A
  const donorA = [donorHla.a1, donorHla.a2].filter(Boolean).map(a => a.trim().toUpperCase());
  const recipientA = [recipientHla.a1, recipientHla.a2].filter(Boolean).map(a => a.trim().toUpperCase());
  for (const allele of donorA) {
    if (!recipientA.includes(allele)) mismatch++;
  }

  // Locus B
  const donorB = [donorHla.b1, donorHla.b2].filter(Boolean).map(b => b.trim().toUpperCase());
  const recipientB = [recipientHla.b1, recipientHla.b2].filter(Boolean).map(b => b.trim().toUpperCase());
  for (const allele of donorB) {
    if (!recipientB.includes(allele)) mismatch++;
  }

  // Locus DR
  const donorDR = [donorHla.dr1, donorHla.dr2].filter(Boolean).map(dr => dr.trim().toUpperCase());
  const recipientDR = [recipientHla.dr1, recipientHla.dr2].filter(Boolean).map(dr => dr.trim().toUpperCase());
  for (const allele of donorDR) {
    if (!recipientDR.includes(allele)) mismatch++;
  }

  return Math.min(6, mismatch);
}

/**
 * Computes a matching score (0-100) between a donor and a recipient.
 * Returns null if blood group or organ type is incompatible, or if the
 * geographic distance exceeds the organ's maximum Cold Ischemia Time (CIT) limit.
 * 
 * @param {object} donor - Donor profile details
 * @param {object} recipient - Recipient profile details
 * @param {number} [precalculatedDistanceKm] - Optional precalculated distance in km
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

  // Calculate distance first to enforce Cold Ischemia Time limits
  let distanceKm = precalculatedDistanceKm;
  if (distanceKm === null || distanceKm === undefined) {
    const [lon1, lat1] = donor.location.coordinates;
    const [lon2, lat2] = recipient.location.coordinates;
    distanceKm = calculateHaversineDistance(lon1, lat1, lon2, lat2);
  }

  // Enforce organ-specific travel limits (CIT limits)
  let maxDistanceLimit = 2000;
  if (recipient.organNeeded === "Heart" || recipient.organNeeded === "Lung") {
    maxDistanceLimit = 400; // Heart/Lung must be matched within ~400km (4 hours)
  } else if (recipient.organNeeded === "Liver" || recipient.organNeeded === "Pancreas") {
    maxDistanceLimit = 1200; // Liver/Pancreas matched within ~1200km (12 hours)
  } else if (recipient.organNeeded === "Kidney") {
    maxDistanceLimit = 2000; // Kidneys can survive longer travel up to 2000km
  }

  if (distanceKm > maxDistanceLimit) {
    return null; // Incompatible due to excess travel distance / ischemia risk
  }

  // --- SCORE COMPONENT 1: Blood Group Match Quality (Weight: 0.20) ---
  let bloodScore = 50; // Compatible but non-identical
  if (donor.bloodGroup === recipient.bloodGroup) {
    bloodScore = 100; // Perfect identical match
  }

  // --- SCORE COMPONENT 2: Medical Urgency & Waiting Time (Weight: 0.30) ---
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
  const distanceScore = Math.max(0, 100 * (1 - distanceKm / maxDistanceLimit));

  // --- SCORE COMPONENT 4: HLA Antigen Match Quality (Weight: 0.20) ---
  const mismatchCount = calculateHlaMismatch(donor.hla, recipient.hla);
  const hlaScore = 100 * (1 - mismatchCount / 6);

  // --- SCORE COMPONENT 5: Age & Weight Similarity (Weight: 0.10) ---
  // Weight/Size sub-component (5% weight)
  const ratio = donor.weight / recipient.weight;
  let sizeScore = 0;
  if (ratio >= 0.8 && ratio <= 1.2) {
    sizeScore = 100;
  } else {
    sizeScore = Math.max(0, 100 * (1 - Math.abs(1 - ratio)));
  }

  // Age sub-component (5% weight)
  const donorAge = donor.age || 35;
  const recipientAge = recipient.age || 35;
  const ageDiff = Math.abs(donorAge - recipientAge);
  const ageScore = Math.max(0, 100 - 3 * ageDiff);

  const finalScore =
    0.20 * bloodScore +
    0.30 * urgencyScore +
    0.20 * distanceScore +
    0.20 * hlaScore +
    0.05 * sizeScore +
    0.05 * ageScore;

  // Round to nearest 2 decimal places
  return Math.round(finalScore * 100) / 100;
}

export default {
  BLOOD_COMPATIBILITY,
  calculateHaversineDistance,
  calculateHlaMismatch,
  calculateMatchScore
};
