import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Family from "../models/Family.js";

// ---------------- Protect Family Routes ----------------
export const protectFamily = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.role !== "family") return res.status(403).json({ message: "Forbidden" });

    req.family = await Family.findById(decoded.id);
    if (!req.family) return res.status(404).json({ message: "Family not found" });

    next();
  } catch (err) {
    res.status(401).json({ message: "Not authorized" });
  }
};

// ---------------- Protect Admin Routes ----------------
export const protectAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    if (decoded.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    req.admin = await Admin.findById(decoded.id);
    if (!req.admin) return res.status(404).json({ message: "Admin not found" });

    next();
  } catch (err) {
    res.status(401).json({ message: "Not authorized" });
  }
};
