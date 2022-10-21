const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    // Destructuring
    const { username, email, password, newsletter } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      (newsletter !== false && newsletter !== true)
    ) {
      return res.status(400).json({ message: "Missing parameter" });
    }

    const userExists = await User.findOne({ email });
    console.log(userExists);
    if (userExists) {
      return res.status(409).json({ message: "This email is already used" });
    }

    const token = uid2(64);
    const salt = uid2(16);
    const hash = SHA256(salt + password).toString(encBase64);

    // Dans un objet, si la une clef et ce qu'elle est sensée contenir ont le même nom, je peux me contenter de ne mentioner ce dernier qu'un fois
    const newUser = new User({
      email,
      account: {
        username,
      },
      newsletter,
      token,
      salt,
      hash,
    });

    await newUser.save();
    res.json({
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(req.body);
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // console.log(user);
    const newHash = SHA256(user.salt + password).toString(encBase64);
    // console.log(newHash);
    if (newHash !== user.hash) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({
      _id: user._id,
      token: user.token,
      account: user.account,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
