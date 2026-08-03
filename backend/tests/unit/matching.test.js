import { calculateMatchScore, calculateHaversineDistance } from "../../src/features/matches/matchingEngine.js";

describe("Matching Engine Unit Tests", () => {
  const baseDonor = {
    organType: "Kidney",
    bloodGroup: "O-", // Universal donor
    weight: 70,
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
    registrationDate: new Date().toISOString(), // Newly registered (no waiting bonus)
    location: {
      type: "Point",
      coordinates: [77.2090, 28.6139] // Delhi (0 km distance)
    }
  };

  describe("Geospatial Distance fallback (Haversine)", () => {
    it("should calculate correct distance between Delhi and Mumbai", () => {
      // Coordinates: Delhi (77.2090, 28.6139) to Mumbai (72.8777, 19.0760)
      const distance = calculateHaversineDistance(77.2090, 28.6139, 72.8777, 19.0760);
      expect(distance).toBeGreaterThan(1100);
      expect(distance).toBeLessThan(1200); // Actually ~1148 km
    });
  });

  describe("Compatibility Filters", () => {
    it("should reject mismatching organs", () => {
      const donor = { ...baseDonor, organType: "Heart" };
      const score = calculateMatchScore(donor, baseRecipient);
      expect(score).toBeNull();
    });

    it("should reject incompatible blood groups", () => {
      // A+ donor cannot donate to O- recipient
      const donor = { ...baseDonor, bloodGroup: "A+" };
      const score = calculateMatchScore(donor, baseRecipient);
      expect(score).toBeNull();
    });

    it("should accept compatible blood groups", () => {
      // O- donor can donate to A+ recipient
      const recipient = { ...baseRecipient, bloodGroup: "A+" };
      const score = calculateMatchScore(baseDonor, recipient);
      expect(score).not.toBeNull();
    });
  });

  describe("Scoring Calculations", () => {
    it("should return a perfect 100 for identical profiles in same location and critical status", () => {
      const score = calculateMatchScore(baseDonor, baseRecipient);
      expect(score).toBe(100); // 0.2*100 + 0.4*100 + 0.2*100 + 0.2*100 = 100
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

    it("should cap distance score at 0 when distance exceeds 2000 km", () => {
      const score = calculateMatchScore(baseDonor, baseRecipient, 2500);
      // distance component: 0.2 * 0 = 0 points
      expect(score).toBe(80);
    });

    it("should apply waiting time bonus capped at 10 points", () => {
      // Backdate registration date by 180 days (should yield +6 points bonus)
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
      // urgency: 0.4 * 81 = 32.4
      // distance: 0.2 * 100 = 20
      // size: 0.2 * 100 = 20
      // total = 92.4
      expect(score).toBe(92.4);
    });

    it("should cap urgency score component at 100 even with waiting bonus", () => {
      const date180DaysAgo = new Date();
      date180DaysAgo.setDate(date180DaysAgo.getDate() - 180);

      const recipientWithBonus = {
        ...baseRecipient,
        urgencyLevel: "CRITICAL", // base urgency is 100 points
        registrationDate: date180DaysAgo.toISOString()
      };

      // urgency score is capped at 100
      const score = calculateMatchScore(baseDonor, recipientWithBonus);
      expect(score).toBe(100);
    });

    it("should drop size score when weight ratio falls outside [0.8, 1.2]", () => {
      const recipientHeavy = {
        ...baseRecipient,
        weight: 100 // Donor weight is 70, ratio is 0.7 (outside [0.8, 1.2])
      };
      
      const score = calculateMatchScore(baseDonor, recipientHeavy);
      // ratio: 70/100 = 0.7
      // sizeScore: 100 * (1 - |1 - 0.7|) = 100 * 0.7 = 70 points
      // size component: 0.2 * 70 = 14 points (loses 6 points)
      expect(score).toBe(94);
    });
  });
});
