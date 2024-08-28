const request = require("supertest");
const { server } = require("../server");
const mongoose = require("mongoose");
const Group = require("../models/group.model");
const User = require("../models/user.model");

describe("Group API End-to-End Tests", () => {
  // Connect to test database before all tests
  beforeAll(async () => {
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
    await Group.deleteMany({});
    await User.deleteMany({});
  });
  // Clean up database and close connection after all tests
  afterAll(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // Reset database before each test
  beforeEach(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
    const normalUser = new User({
      username: "testuser",
      password: "password123",
      isAdmin: true,
    });
    await normalUser.save();
  });

  describe("POST /api/v1/groups", () => {
    it("should create a new group and return 201 status", async () => {
      const groupData = { name: "Test Group" };
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .post("/api/v1/groups")
        .send(groupData)
        .set("Authorization", `${loginUser.body.token}`);

      expect(res.status).toBe(201);
      expect(res.body.group).toBeDefined();
      expect(res.body.group.name).toBe("Test Group");
      expect(res.body.message).toBe("Group created successfully");
    });

    it("should return 400 if group creation fails", async () => {
      const invalidGroupData = {}; // No name provided
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .post("/api/v1/groups")
        .send(invalidGroupData)
        .set("Authorization", `${loginUser.body.token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("DELETE /api/v1/groups/:groupId", () => {
    it("should delete a group and return 200 status", async () => {
      const group = await Group.create({ name: "Group to Delete" });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .delete(`/api/v1/groups/${group._id}`)
        .set("Authorization", `${loginUser.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Group deleted successfully");

      const deletedGroup = await Group.findById(group._id);
      expect(deletedGroup).toBeNull();
    });

    it("should return 400 if group deletion fails", async () => {
      const invalidGroupId = "invalidGroupId";
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .delete(`/api/v1/groups/${invalidGroupId}`)
        .set("Authorization", `${loginUser.body.token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("POST /api/v1/groups/:groupId/members", () => {
    it("should add a new member to a group and return 201 status", async () => {
      const group = await Group.create({ name: "Group with Members" });
      const user = await User.create({
        username: "testuser1",
        password: "password123",
      });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .post(`/api/v1/groups/${group._id}/member`)
        .send({ userId: user._id })
        .set("Authorization", `${loginUser.body.token}`);

      expect(res.status).toBe(201);
      expect(res.body.group).toBeDefined();
      expect(res.body.group.members).toContain(user._id.toString());
      expect(res.body.message).toBe("Successfully added new member to group");
    });

    it("should return 404 if group or user is not found", async () => {
      const invalidGroupId = new mongoose.Types.ObjectId();
      const invalidUserId = new mongoose.Types.ObjectId();
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .post(`/api/v1/groups/${invalidGroupId}/member`)
        .send({ userId: invalidUserId })
        .set("Authorization", `${loginUser.body.token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Group or User not found");
    });

    it("should return 400 if the member already exists in the group", async () => {
      const group = await Group.create({ name: "Group with Members" });
      const adminUser = new User({
        username: "testuseradmin",
        password: "password123",
        isAdmin: true,
      });
      await adminUser.save();
      const loginAdmin = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const user = await User.create({
        username: "testuser1",
        password: "password123",
      });

      // Add member the first time
      await group.members.push(user._id);
      await group.save();

      const res = await request(server)
        .post(`/api/v1/groups/${group._id}/member`)
        .send({ userId: user._id })
        .set("Authorization", `${loginAdmin.body.token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Group member already exists");
    });
  });

  describe("GET /api/v1/groups", () => {
    it("should search for groups by name and return 200 status", async () => {
      await Group.create({ name: "Test Group 1" });
      await Group.create({ name: "Another Group" });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .get("/api/v1/groups")
        .query({ name: "Test" })
        .set("Authorization", `${loginUser.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.groups).toBeDefined();
      expect(res.body.groups.length).toBe(1);
      expect(res.body.groups[0].name).toBe("Test Group 1");
      expect(res.body.message).toBe("Group(s) found successfully");
    });

    it("should return an empty array if no groups match the search", async () => {
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .get("/api/v1/groups")
        .query({ name: "Nonexistent Group" })
        .set("Authorization", `${loginUser.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.groups).toEqual([]);
      expect(res.body.message).toBe("Group(s) found successfully");
    });
  });

  describe("DELETE /api/v1/groups/:groupId/member", () => {
    it("should remove a member from a group and return 200 status", async () => {
      const group = await Group.create({ name: "Group with Members" });
      const admin = await User.create({
        username: "admin",
        password: "password123",
        isAdmin: true,
      });
      const loginAdmin = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "admin", password: "password123" });
      const user = await User.create({
        username: "testuser2",
        password: "password123",
      });

      group.members.push(user._id);
      await group.save();

      const res = await request(server)
        .delete(`/api/v1/groups/${group._id}/member`)
        .send({ userId: user._id })
        .set("Authorization", `${loginAdmin.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.group).toBeDefined();
      expect(res.body.group.members).not.toContain(user._id.toString());
      expect(res.body.message).toBe("Successfully removed member from group");
    });

    it("should return 404 if group or user is not found", async () => {
      const invalidGroupId = new mongoose.Types.ObjectId();
      const invalidUserId = new mongoose.Types.ObjectId();

      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .delete(`/api/v1/groups/${invalidGroupId}/member`)
        .send({ userId: invalidUserId })
        .set("Authorization", `${loginUser.body.token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Group or User not found");
    });

    it("should return 400 if the member does not exist in the group", async () => {
      const group = await Group.create({ name: "Group without Members" });
      const user = await User.create({
        username: "testuser1",
        password: "password123",
      });
      const loginAdmin = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .delete(`/api/v1/groups/${group._id}/member`)
        .send({ userId: user._id })
        .set("Authorization", `${loginAdmin.body.token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid request");
    });

    it("should return 403 if user does not have permission to remove a member", async () => {
      const group = await Group.create({ name: "Group with Members" });
      const user = await User.create({
        username: "testuser4",
        password: "password123",
        isAdmin: false,
      });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser4", password: "password123" });
      const res = await request(server)
        .delete(`/api/v1/groups/${group._id}/member`)
        .send({ userId: user._id })
        .set("Authorization", `${loginUser.body.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access denied");
    });
  });
});
