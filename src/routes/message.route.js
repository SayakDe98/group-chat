const express = require("express");
const router = express.Router();
const {
  sendMessage,
  likeMessage,
  deleteMessage,
  getAllMessages,
} = require("../controllers/message.controller");

router.post("/:groupId", sendMessage);
router.post("/:groupId/like", likeMessage);
router.get("/:groupId", getAllMessages);
router.delete("/:groupId/:messageId", deleteMessage);

module.exports = router;
