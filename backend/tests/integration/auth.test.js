import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app.js";
import User from "../../src/features/auth/user.model.js";
import connectDB from "../../src/config/db.js";

describe("Auth Integration Tests", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterEach(async () => {
    // Clear user collection after each test to keep environment clean
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Disconnect DB after tests complete
    await mongoose.connection.close();
  });

  const testUser = {
    email: "test@lifelink.org",
    password: "Password123!",
    role: "donor"
  };

  describe("POST /api/v1/auth/register", () => {
    it("should successfully register a new user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.role).toBe(testUser.role);
      expect(res.body.data.userId).toBeDefined();

      const userInDb = await User.findOne({ email: testUser.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.role).toBe(testUser.role);
    });

    it("should fail validation with invalid email format", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "invalid-email",
          password: "Password123!",
          role: "donor"
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.errors).toHaveProperty("email");
    });

    it("should fail validation with short password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "test@lifelink.org",
          password: "short",
          role: "donor"
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.errors).toHaveProperty("password");
    });

    it("should reject duplicate email registrations", async () => {
      // Register first user
      await request(app).post("/api/v1/auth/register").send(testUser);

      // Try registering duplicate
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("already registered");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      // Pre-register user for login tests
      await request(app).post("/api/v1/auth/register").send(testUser);
    });

    it("should login registered user and return httpOnly cookies", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe(testUser.role);

      // Check cookies
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();

      const accessCookie = cookies.find((c) => c.startsWith("access_token="));
      const refreshCookie = cookies.find((c) => c.startsWith("refresh_token="));

      expect(accessCookie).toContain("HttpOnly");
      expect(refreshCookie).toContain("HttpOnly");
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword"
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("Invalid email or password");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    let agent;

    beforeEach(async () => {
      agent = request.agent(app);
      await agent.post("/api/v1/auth/register").send(testUser);
      await agent.post("/api/v1/auth/login").send({
        email: testUser.email,
        password: testUser.password
      });
    });

    it("should fetch current user profile with valid session cookie", async () => {
      const res = await agent.get("/api/v1/auth/me");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe(testUser.role);
    });

    it("should reject access when authentication cookie is missing", async () => {
      const res = await request(app).get("/api/v1/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("Authentication token is missing");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    let agent;

    beforeEach(async () => {
      agent = request.agent(app);
      await agent.post("/api/v1/auth/register").send(testUser);
      await agent.post("/api/v1/auth/login").send({
        email: testUser.email,
        password: testUser.password
      });
    });

    it("should clear auth cookies and unset refresh token on logout", async () => {
      const res = await agent.post("/api/v1/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers["set-cookie"];
      // Cookies should be cleared (expires/max-age 0 or empty)
      expect(cookies.some((c) => c.includes("access_token=;"))).toBe(true);
      expect(cookies.some((c) => c.includes("refresh_token=;"))).toBe(true);

      // Verify profile access is blocked post-logout
      const meRes = await agent.get("/api/v1/auth/me");
      expect(meRes.status).toBe(401);
    });
  });
});
