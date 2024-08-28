const User = require("../models/user.model");
const BlackListedToken = require("../models/token.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).send({ message: "Invalid credentials" });
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) return res.status(400).send({ message: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  res
    .status(200)
    .send({ token: `Bearer ${token}`, message: "Login successful" });
};

exports.logout = async (req, res) => {
  try {
    if (req.body.token) {
      const { iat } = jwt.decode(req.body.token);
      await BlackListedToken.create({ blacklistedToken: req.body.token, iat });
      res.status(200).send({ message: "Log out successful" });
    } else {
      throw new Error("You must provide a token");
    }
  } catch (error) {
    res.status(500).send({ message: "Error: " + error });
  }
};
