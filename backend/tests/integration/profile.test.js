import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app.js";
import User from "../../src/features/auth/user.model.js";
import Donor from "../../src/features/donor/donor.model.js";
import Recipient from "../../src/features/recipient/recipient.model.js";

// Set environment to test before db connection logic runs
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/lifelink-test"; // Checked dynamically in tests if Atlas is needed

// Import config and DB connection
import connectDB from "../../src/config/db.js";

describe("Donor & Recipient Profile CRUD Integration Tests", () => {
  beforeAll(async () => {
    // Force testing on the Atlas connection string provided by the user
    process.env.MONGODB_URI = "mongodb+srv://sureshsirf886_db_user:Santosh123@cluster0.hnqkjkc.mongodb.net/lifelink_test?appName=Cluster0";
    await connectDB();
  });

  beforeEach(async () => {
    // Clean database before each test
    await User.deleteMany({});
    await Donor.deleteMany({});
    await Recipient.deleteMany({});
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

  describe("Donor Profile CRUD", () => {
    it("should allow a donor to create and read their profile", async () => {
      const agent = request.agent(app);
      
      // Register & Login donor
      await agent.post("/api/v1/auth/register").send(donorUser);
      await agent.post("/api/v1/auth/login").send({
        email: donorUser.email,
        password: donorUser.password
      });

      const profilePayload = {
        organType: "Kidney",
        bloodGroup: "O-",
        availability: true,
        latitude: 28.6139,
        longitude: 77.2090,
        weight: 75
      };

      // Create profile
      const postRes = await agent
        .post("/api/v1/donors/profile")
        .send(profilePayload);

      expect(postRes.status).toBe(200);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.data.organType).toBe(profilePayload.organType);
      expect(postRes.body.data.bloodGroup).toBe(profilePayload.bloodGroup);
      expect(postRes.body.data.location.coordinates).toEqual([
        profilePayload.longitude,
        profilePayload.latitude
      ]);
      expect(postRes.body.data.weight).toBe(profilePayload.weight);

      // Read profile
      const getRes = await agent.get("/api/v1/donors/profile");
      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.organType).toBe(profilePayload.organType);
      expect(getRes.body.data.weight).toBe(profilePayload.weight);
    });

    it("should deny recipient user access to donor profile endpoints", async () => {
      const agent = request.agent(app);
      
      // Register & Login recipient
      await agent.post("/api/v1/auth/register").send(recipientUser);
      await agent.post("/api/v1/auth/login").send({
        email: recipientUser.email,
        password: recipientUser.password
      });

      const getRes = await agent.get("/api/v1/donors/profile");
      expect(getRes.status).toBe(403); // Forbidden
      expect(getRes.body.success).toBe(false);
    });
  });

  describe("Recipient Profile CRUD", () => {
    it("should allow a recipient to create and read their profile", async () => {
      const agent = request.agent(app);
      
      // Register & Login recipient
      await agent.post("/api/v1/auth/register").send(recipientUser);
      await agent.post("/api/v1/auth/login").send({
        email: recipientUser.email,
        password: recipientUser.password
      });

      const profilePayload = {
        organNeeded: "Kidney",
        bloodGroup: "A+",
        urgencyLevel: "HIGH",
        latitude: 19.0760,
        longitude: 72.8777,
        weight: 65
      };

      // Create profile
      const postRes = await agent
        .post("/api/v1/recipients/profile")
        .send(profilePayload);

      expect(postRes.status).toBe(200);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.data.organNeeded).toBe(profilePayload.organNeeded);
      expect(postRes.body.data.bloodGroup).toBe(profilePayload.bloodGroup);
      expect(postRes.body.data.urgencyLevel).toBe(profilePayload.urgencyLevel);
      expect(postRes.body.data.location.coordinates).toEqual([
        profilePayload.longitude,
        profilePayload.latitude
      ]);
      expect(postRes.body.data.weight).toBe(profilePayload.weight);

      // Read profile
      const getRes = await agent.get("/api/v1/recipients/profile");
      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.organNeeded).toBe(profilePayload.organNeeded);
      expect(getRes.body.data.urgencyLevel).toBe(profilePayload.urgencyLevel);
    });

    it("should deny donor user access to recipient profile endpoints", async () => {
      const agent = request.agent(app);
      
      // Register & Login donor
      await agent.post("/api/v1/auth/register").send(donorUser);
      await agent.post("/api/v1/auth/login").send({
        email: donorUser.email,
        password: donorUser.password
      });

      const getRes = await agent.get("/api/v1/recipients/profile");
      expect(getRes.status).toBe(403); // Forbidden
      expect(getRes.body.success).toBe(false);
    });
  });
});
