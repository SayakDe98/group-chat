const express = require("express");
const router = express.Router();

const {
  createGroup,
  deleteGroup,
  addMember,
  searchGroup,
  removeMember,
} = require("../controllers/group.controller");
const { isAdmin } = require("../middlewares/admin.middleware");

router.post("/", createGroup);
router.post("/:groupId/member", addMember);
router.get("/", searchGroup);
router.delete("/:groupId", deleteGroup);
router.delete("/:groupId/member", isAdmin, removeMember);

module.exports = router;
