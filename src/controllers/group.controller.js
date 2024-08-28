const Group = require("../models/group.model");
const User = require("../models/user.model");

exports.createGroup = async (req, res) => {
  const { name } = req.body;
  try {
    const group = await Group.create({ name });
    res.status(201).send({ group, message: "Group created successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    await Group.findByIdAndDelete(groupId);
    res.status(200).send({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

exports.addMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  try {
    const [group, user] = await Promise.all([
      Group.findById(groupId),
      User.findById(userId),
    ]);
    if (!group || !user)
      return res.status(404).send({ message: "Group or User not found" });
    const groupMemberAlreadyExists = group.members.findIndex(
      (user) => user._id === user
    );
    if (groupMemberAlreadyExists !== -1) {
      res.status(400).send({ message: "Group member already exists" });
    } else {
      group.members.push(user._id);
      await group.save();
      res
        .status(201)
        .send({ group, message: "Successfully added new member to group" });
    }
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

exports.searchGroup = async (req, res) => {
  const { name } = req.query;
  try {
    const groups = await Group.find({
      name: { $regex: name || "", $options: "i" },
    });
    res.status(200).send({ groups, message: "Group(s) found successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

exports.removeMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  try {
    const [group, user] = await Promise.all([
      Group.findById(groupId),
      User.findById(userId),
    ]);
    if (!group || !user)
      return res.status(404).send({ message: "Group or User not found" });
    const groupMemberFoundInGroup = group.members.findIndex(
      (user) => user == user._id
    );
    if (groupMemberFoundInGroup !== -1) {
      group.members.splice(groupMemberFoundInGroup, 1);
      await group.save();
      res
        .status(200)
        .send({ group, message: "Successfully removed member from group" });
    } else {
      res.status(400).send({ message: "Invalid request" });
    }
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
