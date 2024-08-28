const request = require("supertest");
const { server } = require("../server"); // Import the server
const mongoose = require("mongoose");
const User = require("../models/user.model");
const BlackListedToken = require("../models/token.model");
const bcrypt = require("bcryptjs");

describe("User API End-to-End Tests", () => {
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
    const adminUser = new User({
      username: "testuser",
      password: "password123",
      isAdmin: true,
    });
    await adminUser.save();
  });

  describe("POST /api/v1/admin/users", () => {
    it("should create a new user and return 201 status", async () => {
      const loginAdmin = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const userData = {
        username: "newuser",
        password: "password123",
        isAdmin: false,
      };
      const res = await request(server)
        .post("/api/v1/admin/users/register")
        .send(userData)
        .set("Authorization", `${loginAdmin.body.token}`);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe("newuser");
      expect(res.body.message).toBe("User created successfully");

      const user = await User.findOne({ username: "newuser" });
      expect(user).toBeTruthy();
      const isPasswordMatch = await bcrypt.compare(
        "password123",
        user.password
      );
      expect(isPasswordMatch).toBe(true);
    });

    it("should return 400 if validation fails", async () => {
      const loginAdmin = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const invalidUserData = {
        username: "", // Invalid username
        password: "password123",
        isAdmin: false,
      };

      const res = await request(server)
        .post("/api/v1/admin/users/register")
        .send(invalidUserData)
        .set("Authorization", `${loginAdmin.body.token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe("PUT /api/v1/admin/users/:userId", () => {
    it("should update the user and return 200 status", async () => {
      const user = await User.create({
        username: "testuser1",
        password: "password123",
        isAdmin: false,
      });
      const loginAdmin = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const updates = {
        username: "updateduser",
        password: "newpassword123",
      };

      const res = await request(server)
        .put(`/api/v1/admin/users/${user._id}`)
        .send(updates)
        .set("Authorization", `${loginAdmin.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe("updateduser");
      expect(res.body.message).toBe("User updated successfully");

      const updatedUser = await User.findById(user._id);
      expect(updatedUser).toBeTruthy();
      expect(updatedUser.username).toBe("updateduser");
      const isPasswordMatch = await bcrypt.compare(
        "newpassword123",
        updatedUser.password
      );
      expect(isPasswordMatch).toBe(true);
    });

    it("should return 400 if userId is invalid", async () => {
      const updates = {
        username: "updateduser",
        password: "newpassword123",
      };
      const loginAdmin = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });

      const res = await request(server)
        .put(`/api/v1/admin/users/invalidUserId`)
        .send(updates)
        .set("Authorization", `${loginAdmin.body.token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should return 400 if the update operation fails", async () => {
      const user = await User.create({
        username: "testuser1",
        password: "password123",
        isAdmin: false,
      });

      const invalidUpdates = {
        username: "testuser", // Invalid username
        password: "newpassword123",
      };
      const loginAdmin = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .put(`/api/v1/admin/users/${user._id}`)
        .send(invalidUpdates)
        .set("Authorization", `${loginAdmin.body.token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});
