const express = require("express");
const app = express();
require("./config/db")();
require("dotenv").config();
const userRoutes = require("./routes/user.route");
const authRoutes = require("./routes/auth.route");
const groupRoutes = require("./routes/group.route");
const messageRoutes = require("./routes/message.route");
const { auth } = require("./middlewares/auth.middleware");
const { isAdmin } = require("./middlewares/admin.middleware");
require("./cron-job/clearOutdatedBlackListedToken")();
// Middleware to parse JSON bodies
app.use(express.json());

// Authentication routes (login, logout)
app.use("/api/v1/auth", authRoutes);

// User management routes (admin only)
app.use("/api/v1/admin", auth, isAdmin, userRoutes);

// Group routes
app.use("/api/v1/groups", auth, groupRoutes);

// Message routes
app.use("/api/v1/messages", auth, messageRoutes);

// Error handling middleware (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
app.listen(process.env.PORT || 4000, () => {
  console.log("Listening on port: " + process.env.PORT || 4000);
});

module.exports.server = app;
