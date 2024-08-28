const User = require("../models/user.model");
const createUserValidator = require("../validators/user.validator");
const bcrypt = require("bcryptjs");

exports.createUser = async (req, res) => {
  const { username, password, isAdmin } = req.body;
  try {
    createUserValidator(req.body);
    const user = await User.create({ username, password, isAdmin });
    res.status(201).send({ user, message: "User created successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.editUser = async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;
  try {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    res.status(200).send({ user, message: "User updated successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
