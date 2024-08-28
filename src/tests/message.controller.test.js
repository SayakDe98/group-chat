const request = require("supertest");
const { server } = require("../server"); // Import the server
const mongoose = require("mongoose");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const Group = require("../models/group.model");

describe("Message API End-to-End Tests", () => {
  // Establish connection to the test database before tests
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  afterEach(async () => {
    await User.deleteMany({});
  });
  // Close database connection after all tests
  afterAll(async () => {
    await mongoose.connection.close();

  });

  // Reset the database before each test
  beforeEach(async () => {
    await Message.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({});
    const normalUser = new User({
      username: "normaltestuser",
      password: "password123",
      isAdmin: false,
    });
    await normalUser.save();
  });

  describe("POST /api/v1/messages/:groupId", () => {
    it("should send a message to a group and return 201 status", async () => {
      const group = await Group.create({ name: "Test Group" });
      const user = await User.create({
        username: "testuser",
        password: "password123",
      });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "normaltestuser", password: "password123" });
      const res = await request(server)
        .post(`/api/v1/messages/${group._id}`)
        .send({ text: "Hello, world!" })
        .set("Authorization", loginUser.body.token); // Assuming JWT token or any auth header setup

      expect(res.status).toBe(201);
      expect(res.body.messageDetails).toBeDefined();
      expect(res.body.messageDetails.text).toBe("Hello, world!");
      expect(res.body.message).toBe("Message sent successfully");
    });

    it("should return 400 if sending a message fails", async () => {
      const group = await Group.create({ name: "Test Group" });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "normaltestuser", password: "password123" });
      const res = await request(server)
        .post(`/api/v1/messages/${group._id}`)
        .send({}) // No text provided
        .set("Authorization", loginUser.body.token);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("POST /api/v1/messages/like", () => {
    it("should like a message and return 200 status", async () => {
      const user = await User.create({
        username: "testuser",
        password: "password123",
      });
      const message = await Message.create({
        groupId: new mongoose.Types.ObjectId(),
        sender: user._id,
        text: "Hello, world!",
      });
      const group = await Group.create({ name: "Test Group" });

      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const res = await request(server)
        .post(`/api/v1/messages/${group._id}/like`)
        .send({ messageId: message._id })
        .set("Authorization", loginUser.body.token);

      expect(res.status).toBe(200);
      expect(res.body.messageDetails.likes).toContain(user._id.toString());
      expect(res.body.message).toBe("Liked message successfully");
    });

    it("should unlike a message and return 200 status", async () => {
      const user = await User.create({
        username: "testuser",
        password: "password123",
      });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "testuser", password: "password123" });
      const message = await Message.create({
        groupId: new mongoose.Types.ObjectId(),
        sender: user._id,
        text: "Hello, world!",
        likes: [user._id],
      });
      const group = await Group.create({ name: "Test Group" });

      const res = await request(server)
        .post(`/api/v1/messages/${group._id}/like`)
        .send({ messageId: message._id })
        .set("Authorization", loginUser.body.token);

      expect(res.status).toBe(200);
      expect(res.body.messageDetails.likes).not.toContain(user._id.toString());
      expect(res.body.message).toBe("Unliked message successfully");
    });

    it("should return 404 if the message is not found", async () => {
      const user = await User.create({
        username: "testuser",
        password: "password123",
      });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "normaltestuser", password: "password123" });
      const invalidMessageId = new mongoose.Types.ObjectId();
      const group = await Group.create({ name: "Test Group" });

      const res = await request(server)
        .post(`/api/v1/messages/${group._id}/like`)
        .send({ messageId: invalidMessageId })
        .set("Authorization", loginUser.body.token);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Message not found");
    });
  });

  describe("DELETE /api/v1/messages/:groupId/:messageId", () => {
    it("should delete a message and return 200 status", async () => {
      const group = await Group.create({ name: "Test Group" });
      const user = await User.create({
        username: "testuser",
        password: "password123",
      });
      const adminUser = await User.create({
        username: "admin",
        password: "password123",
        isAdmin: true,
      });
      const loginAdmin = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "admin", password: "password123" });
      const message = await Message.create({
        groupId: group._id,
        sender: user._id,
        text: "Hello, world!",
      });

      const res = await request(server)
        .delete(`/api/v1/messages/${group._id}/${message._id}`)
        .set("Authorization", loginAdmin.body.token);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Message deleted successfully");

      const deletedMessage = await Message.findById(message._id);
      expect(deletedMessage).toBeNull();
    });

    it("should return 403 if the user does not have permission to delete the message", async () => {
      const group = await Group.create({ name: "Test Group" });
      const sender = await User.create({
        username: "sender",
        password: "password123",
      });
      const otherUser = await User.create({
        username: "otheruser",
        password: "password123",
      });
      const message = await Message.create({
        groupId: group._id,
        sender: sender._id,
        text: "Hello, world!",
      });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "normaltestuser", password: "password123" });
      const res = await request(server)
        .delete(`/api/v1/messages/${group._id}/${message.id}`) //
        .set("Authorization", loginUser.body.token);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe(
        "You don't have permission to delete this message."
      );
    });

    it("should return 400 if deletion fails", async () => {
      const group = await Group.create({ name: "Test Group" });
      const user = await User.create({
        username: "testuser",
        password: "password123",
      });
      const invalidMessageId = new mongoose.Types.ObjectId();
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "normaltestuser", password: "password123" });
      const res = await request(server)
        .delete(`/api/v1/messages/${group._id}/${invalidMessageId}`)
        .set("Authorization", loginUser.body.token);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("GET /api/v1/messages/:groupId", () => {
    it("should fetch all messages for a group and return 200 status", async () => {
      const group = await Group.create({ name: "Test Group" });
      const user = await User.create({
        username: "testuser",
        password: "password123",
      });
      await Message.create({
        groupId: group._id,
        sender: user._id,
        text: "Message 1",
      });
      await Message.create({
        groupId: group._id,
        sender: user._id,
        text: "Message 2",
      });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "normaltestuser", password: "password123" });
      const res = await request(server)
        .get(`/api/v1/messages/${group._id}`)
        .set("Authorization", loginUser.body.token);

      expect(res.status).toBe(200);
      expect(res.body.messages.length).toBe(2);
      expect(res.body.messages[0].text).toBe("Message 1");
      expect(res.body.messages[1].text).toBe("Message 2");
      expect(res.body.message).toBe("Fetched all messages successfully");
    });

    it("should return an empty array if there are no messages in the group", async () => {
      const group = await Group.create({ name: "Empty Group" });
      const user = await User.create({
        username: "testuser",
        password: "password123",
      });
      const loginUser = await request(server)
        .post("/api/v1/auth/login")
        .send({ username: "normaltestuser", password: "password123" });
      const res = await request(server)
        .get(`/api/v1/messages/${group.id}`)
        .set("Authorization", loginUser.body.token);

      expect(res.status).toBe(200);
      expect(res.body.messages).toEqual([]);
      expect(res.body.message).toBe("Fetched all messages successfully");
    });
  });
});
