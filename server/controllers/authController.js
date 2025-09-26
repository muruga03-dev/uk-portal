// Placeholder for server/controllers/authController.js
const Family = require("../models/Family");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Family Registration
exports.registerFamily = async (req, res) => {
  const { familyId, name, address, password } = req.body;
  try {
    const existing = await Family.findOne({ familyId });
    if (existing) return res.status(400).json({ message: "Family ID already exists" });

    const hash = await bcrypt.hash(password, 10);
    const family = new Family({ familyId, name, address, passwordHash: hash });
    await family.save();

    res.status(201).json({ message: "Registration submitted for approval" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Family Login
exports.loginFamily = async (req, res) => {
  const { familyId, password } = req.body;
  try {
    const family = await Family.findOne({ familyId });
    if (!family) return res.status(404).json({ message: "Family not found" });
    if (!family.approved) return res.status(403).json({ message: "Registration not approved yet" });

    const valid = await bcrypt.compare(password, family.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: family._id, role: "family" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, familyId: family.familyId, name: family.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
