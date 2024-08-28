const express = require("express");
const { createUser, editUser } = require("../controllers/user.controller");
const router = express.Router();

router.post("/users/register", createUser);
router.put("/users/:userId", editUser);

module.exports = router;
