const Message = require("../models/message.model");
const User = require("../models/user.model");

exports.sendMessage = async (req, res) => {
  const { groupId } = req.params;
  const { text } = req.body;
  try {
    const messageDetails = await Message.create({
      groupId,
      sender: req?.user?.userId,
      text,
    });
    res
      .status(201)
      .send({ message: "Message sent successfully", messageDetails });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

exports.likeMessage = async (req, res) => {
  const { messageId } = req.body;
  try {
    const messageDetails = await Message.findById(messageId);
    if (!messageDetails)
      return res.status(404).send({ error: "Message not found" });
    const userAlreadyLikedMessage = messageDetails.likes.findIndex(
      (user) => user == req.user.userId
    );
    if (userAlreadyLikedMessage === -1) {
      messageDetails.likes.push(req?.user?.userId);
    } else {
      messageDetails.likes.splice(userAlreadyLikedMessage, 1);
    }
    await messageDetails.save();
    res.status(200).send({
      message: `${
        userAlreadyLikedMessage === -1 ? "Liked" : "Unliked"
      } message successfully`,
      messageDetails,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  const { groupId, messageId } = req.params;
  try {
    const [requestedUser, messageDetails] = await Promise.all([
      User.findOne({ _id: req?.user?.userId }),
      Message.findOne({ _id: messageId }),
    ]);
    if (messageDetails.sender === requestedUser || requestedUser.isAdmin) {
      await Message.deleteOne({
        groupId,
      });
      res.status(200).send({ message: "Message deleted successfully" });
    } else {
      res
        .status(403)
        .send({ message: "You don't have permission to delete this message." });
    }
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

exports.getAllMessages = async (req, res) => {
  const { groupId } = req.params;
  try {
    const messages = await Message.find({ groupId });
    res
      .status(200)
      .send({ message: "Fetched all messages successfully", messages });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};
