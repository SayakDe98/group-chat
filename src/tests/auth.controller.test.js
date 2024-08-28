const request = require("supertest");
const { server } = require("../server");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const BlackListedToken = require("../models/token.model");
const jwt = require("jsonwebtoken");

describe("Auth API End-to-End Tests", () => {
  beforeAll(async () => {
    // Connect to the test database
    const testDB = process.env.MONGO_URI_TEST;
    if (!testDB) {
      throw new Error("MONGO_URI_TEST is not defined in environment variables");
    }

    await mongoose.connect(testDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  afterEach(async () => {
    await User.deleteMany({});
  });
  afterAll(async () => {
    // Clean up the database and close the connection
    await User.deleteMany({});
    await BlackListedToken.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Reset the database before each test
    await User.deleteMany({});
    await BlackListedToken.deleteMany({});
  });

  describe("POST /api/v1/auth/login", () => {
    it("should return 200 and a token on successful login", async () => {
      const uniqueUsername = `testuser_${Date.now()}`;
      const user = new User({
        username: uniqueUsername,
        password: "password123",
        isAdmin: false,
      });
      await user.save();
      const res = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: uniqueUsername, password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.message).toBe("Login successful");
    });

    it("should return 400 for invalid credentials", async () => {
      const uniqueUsername = `testuser_${Date.now()}`;
      const user = new User({
        username: uniqueUsername,
        password: "password123",
        isAdmin: false,
      });
      await user.save();

      const res = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: uniqueUsername, password: "wrongpassword" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should return 400 if the user does not exist", async () => {
      const res = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "nonexistentuser", password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should return 200 and blacklist the token on successful logout", async () => {
      const uniqueUsername = `testuser_${Date.now()}`;
      const user = new User({
        username: uniqueUsername,
        password: "password123",
        isAdmin: false,
      });
      await user.save();
      const token = jwt.sign(
        { userId: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const res = await request(server)
        .post("/api/v1/auth/logout")
        .send({ token });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Log out successful");

      const blacklistedToken = await BlackListedToken.findOne({
        blacklistedToken: token,
      });
      expect(blacklistedToken).toBeTruthy();
    });

    it("should return 500 if no token is provided", async () => {
      const res = await request(server).post("/api/v1/auth/logout").send({});

      expect(res.status).toBe(500);
      expect(res.body.message).toContain("Error:");
    });

    it("should return 500 if an invalid token is provided", async () => {
      const res = await request(server)
        .post("/api/v1/auth/logout")
        .send({ token: "InvalidToken" });

      expect(res.status).toBe(500);
      expect(res.body.message).toContain("Error:");
    });
  });
});
