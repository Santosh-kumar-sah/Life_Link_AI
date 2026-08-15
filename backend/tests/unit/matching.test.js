import { calculateMatchScore, calculateHaversineDistance, calculateHlaMismatch } from "../../src/features/matches/matchingEngine.js";

describe("Matching Engine Unit Tests", () => {
  const baseDonor = {
    organType: "Kidney",
    organs: ["Kidney"],
    bloodGroup: "O-", // Universal donor
    weight: 70,
    age: 35,
    hla: {
      a1: "A1",
      a2: "A2",
      b1: "B1",
      b2: "B2",
      dr1: "DR1",
      dr2: "DR2"
    },
    location: {
      type: "Point",
      coordinates: [77.2090, 28.6139] // Delhi
    }
  };

  const baseRecipient = {
    organNeeded: "Kidney",
    bloodGroup: "O-",
    urgencyLevel: "CRITICAL",
    weight: 70,
    age: 35,
    hla: {
      a1: "A1",
      a2: "A2",
      b1: "B1",
      b2: "B2",
      dr1: "DR1",
      dr2: "DR2"
    },
    registrationDate: new Date().toISOString(), // Newly registered (no waiting bonus)
    location: {
      type: "Point",
      coordinates: [77.2090, 28.6139] // Delhi (0 km distance)
    }
  };

  describe("Geospatial Distance fallback (Haversine)", () => {
    it("should calculate correct distance between Delhi and Mumbai", () => {
      const distance = calculateHaversineDistance(77.2090, 28.6139, 72.8777, 19.0760);
      expect(distance).toBeGreaterThan(1100);
      expect(distance).toBeLessThan(1200); // Actually ~1148 km
    });
  });

  describe("HLA Mismatch Calculator", () => {
    it("should return 0 mismatch for identical HLA", () => {
      const mismatch = calculateHlaMismatch(baseDonor.hla, baseRecipient.hla);
      expect(mismatch).toBe(0);
    });

    it("should calculate correct mismatch count for differing alleles", () => {
      const donorHla = { a1: "A1", a2: "A2", b1: "B1", b2: "B2", dr1: "DR1", dr2: "DR2" };
      const recipientHla = { a1: "A1", a2: "A3", b1: "B1", b2: "B4", dr1: "DR1", dr2: "DR2" };
      // Donor A2 is not in recipient A1, A3 (+1 mismatch)
      // Donor B2 is not in recipient B1, B4 (+1 mismatch)
      // Total mismatch = 2
      const mismatch = calculateHlaMismatch(donorHla, recipientHla);
      expect(mismatch).toBe(2);
    });

    it("should return 6 mismatch if HLA data is missing", () => {
      const mismatch = calculateHlaMismatch(null, baseRecipient.hla);
      expect(mismatch).toBe(6);
    });
  });

  describe("Compatibility Filters & CIT Limits", () => {
    it("should reject mismatching organs", () => {
      const donor = { ...baseDonor, organs: ["Heart"] };
      const score = calculateMatchScore(donor, baseRecipient);
      expect(score).toBeNull();
    });

    it("should reject incompatible blood groups", () => {
      const donor = { ...baseDonor, bloodGroup: "A+" };
      const score = calculateMatchScore(donor, baseRecipient);
      expect(score).toBeNull();
    });

    it("should reject Kidneys when distance exceeds 2000 km", () => {
      const score = calculateMatchScore(baseDonor, baseRecipient, 2500);
      expect(score).toBeNull();
    });

    it("should reject Hearts when distance exceeds 400 km", () => {
      const donorHeart = { ...baseDonor, organs: ["Heart"] };
      const recipientHeart = { ...baseRecipient, organNeeded: "Heart" };
      // 500 km distance exceeds Heart CIT limit of 400 km
      const score = calculateMatchScore(donorHeart, recipientHeart, 500);
      expect(score).toBeNull();
    });

    it("should accept Hearts when distance is within 400 km", () => {
      const donorHeart = { ...baseDonor, organs: ["Heart"] };
      const recipientHeart = { ...baseRecipient, organNeeded: "Heart" };
      const score = calculateMatchScore(donorHeart, recipientHeart, 300);
      expect(score).not.toBeNull();
    });
  });

  describe("Scoring Calculations", () => {
    it("should return a perfect 100 for identical profiles in same location and critical status", () => {
      const score = calculateMatchScore(baseDonor, baseRecipient);
      expect(score).toBe(100);
    });

    it("should award compatible but non-identical blood group matching 50 points", () => {
      const recipient = { ...baseRecipient, bloodGroup: "A+" }; // Donor is O- (compatible, non-identical)
      const score = calculateMatchScore(baseDonor, recipient);
      // blood component: 0.2 * 50 = 10 points (loses 10 points from maximum 20)
      expect(score).toBe(90);
    });

    it("should scale down distance score based on proximity", () => {
      // Distance is exactly 1000 km (should yield 50 points in distance score)
      const score = calculateMatchScore(baseDonor, baseRecipient, 1000);
      // distance component: 0.2 * 50 = 10 points (loses 10 points)
      expect(score).toBe(90);
    });

    it("should apply waiting time bonus in urgency score", () => {
      const date180DaysAgo = new Date();
      date180DaysAgo.setDate(date180DaysAgo.getDate() - 180);

      const recipientWithBonus = {
        ...baseRecipient,
        urgencyLevel: "HIGH", // base urgency is 75 points
        registrationDate: date180DaysAgo.toISOString()
      };

      // Recipient urgency score = 75 + (180 / 30) = 75 + 6 = 81 points
      const score = calculateMatchScore(baseDonor, recipientWithBonus);
      // score components:
      // blood: 0.2 * 100 = 20
      // urgency: 0.3 * 81 = 24.3
      // distance: 0.2 * 100 = 20
      // hla: 0.2 * 100 = 20
      // size: 0.05 * 100 = 5
      // age: 0.05 * 100 = 5
      // total = 94.3
      expect(score).toBe(94.3);
    });

    it("should drop size score when weight ratio falls outside [0.8, 1.2]", () => {
      const recipientHeavy = {
        ...baseRecipient,
        weight: 100 // Donor weight is 70, ratio is 0.7 (outside [0.8, 1.2])
      };
      
      const score = calculateMatchScore(baseDonor, recipientHeavy);
      // ratio: 70/100 = 0.7
      // sizeScore: 100 * (1 - |1 - 0.7|) = 100 * 0.7 = 70 points
      // size component: 0.05 * 70 = 3.5 points (loses 1.5 points)
      expect(score).toBe(98.5);
    });

    it("should drop age score when ages differ", () => {
      const recipientOlder = {
        ...baseRecipient,
        age: 45 // Donor age is 35, difference is 10
      };

      const score = calculateMatchScore(baseDonor, recipientOlder);
      // ageScore: 100 - 3 * 10 = 70 points
      // age component: 0.05 * 70 = 3.5 points (loses 1.5 points)
      expect(score).toBe(98.5);
    });
  });
});
