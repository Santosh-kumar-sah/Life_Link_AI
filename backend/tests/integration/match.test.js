import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app.js";
import User from "../../src/features/auth/user.model.js";
import Donor from "../../src/features/donor/donor.model.js";
import Recipient from "../../src/features/recipient/recipient.model.js";
import Match from "../../src/features/matches/match.model.js";

// Set environment to test before db connection logic runs
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb+srv://sureshsirf886_db_user:Santosh123@cluster0.hnqkjkc.mongodb.net/lifelink_test?appName=Cluster0";

// Import DB connection
import connectDB from "../../src/config/db.js";

describe("Match API Integration Tests", () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    // Clear database collections
    await User.deleteMany({});
    await Donor.deleteMany({});
    await Recipient.deleteMany({});
    await Match.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const donorUser = {
    email: "donor@lifelink.org",
    password: "Password123!",
    role: "donor"
  };

  const recipientUser = {
    email: "recipient@lifelink.org",
    password: "Password123!",
    role: "recipient"
  };

  const adminUser = {
    email: "admin@lifelink.org",
    password: "Password123!",
    role: "admin"
  };

  it("should generate match records when donor and recipient profiles are created", async () => {
    const donorAgent = request.agent(app);
    const recipientAgent = request.agent(app);
    const adminAgent = request.agent(app);

    // 1. Create Recipient
    await recipientAgent.post("/api/v1/auth/register").send(recipientUser);
    await recipientAgent.post("/api/v1/auth/login").send({
      email: recipientUser.email,
      password: recipientUser.password
    });

    const recipientProfile = {
      organNeeded: "Kidney",
      bloodGroup: "O+",
      urgencyLevel: "HIGH",
      latitude: 28.6139,
      longitude: 77.2090,
      weight: 70
    };
    await recipientAgent.post("/api/v1/recipients/profile").send(recipientProfile);

    // 2. Create Donor (should trigger match generation)
    await donorAgent.post("/api/v1/auth/register").send(donorUser);
    await donorAgent.post("/api/v1/auth/login").send({
      email: donorUser.email,
      password: donorUser.password
    });

    const donorProfile = {
      organType: "Kidney",
      bloodGroup: "O-", // Compatible with O+
      availability: true,
      latitude: 28.6139,
      longitude: 77.2090, // Same location -> distance 0 km
      weight: 70
    };
    await donorAgent.post("/api/v1/donors/profile").send(donorProfile);

    // 3. Verify matches exist on Donor side
    const donorMatchRes = await donorAgent.get("/api/v1/matches");
    expect(donorMatchRes.status).toBe(200);
    expect(donorMatchRes.body.success).toBe(true);
    expect(donorMatchRes.body.data.length).toBe(1);
    expect(donorMatchRes.body.data[0].score).toBeGreaterThanOrEqual(80); // Compatible but non-identical blood group (score 80)
    expect(donorMatchRes.body.data[0].status).toBe("PENDING");

    // 4. Verify matches exist on Recipient side
    const recipientMatchRes = await recipientAgent.get("/api/v1/matches");
    expect(recipientMatchRes.status).toBe(200);
    expect(recipientMatchRes.body.data.length).toBe(1);

    // 5. Test Admin Oversight
    await adminAgent.post("/api/v1/auth/register").send(adminUser);
    await adminAgent.post("/api/v1/auth/login").send({
      email: adminUser.email,
      password: adminUser.password
    });

    const adminMatchRes = await adminAgent.get("/api/v1/matches/admin?page=1&limit=5");
    expect(adminMatchRes.status).toBe(200);
    expect(adminMatchRes.body.data.matches.length).toBe(1);
    expect(adminMatchRes.body.data.total).toBe(1);

    const matchRecord = adminMatchRes.body.data.matches[0];

    // 6. Test Admin Status Update to Completed
    const patchRes = await adminAgent
      .patch(`/api/v1/matches/admin/${matchRecord._id}`)
      .send({ status: "COMPLETED" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.data.status).toBe("COMPLETED");

    // 7. Verify donor availability updated to false on completion
    const checkDonorRes = await donorAgent.get("/api/v1/donors/profile");
    expect(checkDonorRes.body.data.availability).toBe(false);
  });
});
