const mongoose = require("mongoose");

const BlackListedTokenSchema = new mongoose.Schema({
  blacklistedToken: String,
  iat: Number,
});

module.exports = mongoose.model("BlackListedToken", BlackListedTokenSchema);
