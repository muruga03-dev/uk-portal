import jwt from "jsonwebtoken";
import Family from "../models/Family.js";

export const protectFamily = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const family = await Family.findById(decoded.id).select("-passwordHash");

    if (!family) return res.status(401).json({ message: "Not authorized, family not found" });

    req.family = family; // attach family to request
    next();
  } catch (err) {
    res.status(401).json({ message: "Not authorized, token invalid" });
  }
};
