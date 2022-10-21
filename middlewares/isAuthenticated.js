const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    console.log("Je passe dans mon middleware");
    //   Vérifier que j'ai bien un token qui m'est envoyé
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = req.headers.authorization.replace("Bearer ", "");
    // Je vais chercher mon user mais je ne sélectionne que ses clefs account et _id
    const user = await User.findOne({ token: token }).select("account");
    // Si je n'en trouve pas
    if (user === null) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Je stocke les infos de mon user dans req
    req.user = user;
    // Je passe à la suite
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
