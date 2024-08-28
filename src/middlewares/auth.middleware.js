const jwt = require("jsonwebtoken");
const BlackListedToken = require("../models/token.model");
require("dotenv").config();

module.exports = {
  auth: async (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token)
      return res.status(401).json({ msg: "No token, authorization denied" });
    const blacklistedToken = await BlackListedToken.findOne({
      blacklistedToken: token,
    });
    if (blacklistedToken) {
      return res
        .status(401)
        .send({ error: "Please re login with a new token" });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Token is not valid" });
    }
  },
};
