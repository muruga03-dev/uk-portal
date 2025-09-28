import Family from "../models/Family.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- Multer setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/documents");
    try {
      fs.mkdirSync(uploadPath, { recursive: true }); // ensure folder exists
    } catch (err) {
      return cb(err);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\.-]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

export const upload = multer({ storage });

// ---------------- Family Registration ----------------
export const registerFamily = async (req, res) => {
  try {
    const { familyId, leaderName, email, password, members, address, phone } =
      req.body;
    if (!familyId || !leaderName || !email || !password) {
      return res.status(400).json({
        message: "Family ID, Leader Name, Email, and Password are required",
      });
    }

    const existing = await Family.findOne({ familyId });
    if (existing) {
      return res.status(400).json({ message: "Family ID already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newFamily = new Family({
      familyId,
      leaderName,
      email,
      passwordHash,
      members: members || [],
      address: address || "",
      phone: phone || "",
      taxHistory: [],
      documents: [],
      approved: false,
    });

    await newFamily.save();

    res.json({ message: "Family registered successfully", family: newFamily });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Family Login ----------------
export const loginFamily = async (req, res) => {
  try {
    const { familyId, password } = req.body;
    if (!familyId || !password) {
      return res.status(400).json({ message: "Family ID and password are required" });
    }

    const family = await Family.findOne({ familyId });
    if (!family) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, family.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: family._id, role: "family" },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      family: {
        id: family._id,
        familyId: family.familyId,
        leaderName: family.leaderName,
        members: family.members,
        address: family.address,
        email: family.email,
        phone: family.phone,
        taxHistory: family.taxHistory,
        documents: family.documents,
        approved: family.approved,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Get logged-in family profile ----------------
export const getMyFamily = async (req, res) => {
  try {
    const family = await Family.findById(req.family._id).select("-passwordHash");
    if (!family) return res.status(404).json({ message: "Family not found" });
    res.json(family);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Upload document ----------------
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const family = await Family.findById(req.family._id);
    if (!family) return res.status(404).json({ message: "Family not found" });

    const documentEntry = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: `/uploads/documents/${req.file.filename}`, // public path
      uploadedAt: new Date(),
    };

    family.documents.push(documentEntry);
    await family.save();

    res.json({ message: "Document uploaded successfully", document: documentEntry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Download document ----------------
export const downloadDocument = async (req, res) => {
  try {
    const { filename } = req.params;

    const family = await Family.findById(req.family._id);
    if (!family) return res.status(404).json({ message: "Family not found" });

    const doc = family.documents.find((d) => d.storedName === filename);
    if (!doc) {
      return res.status(404).json({ message: "Document not found in your uploads" });
    }

    const filePath = path.join(__dirname, "../uploads/documents", doc.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File does not exist on server" });
    }

    res.download(filePath, doc.originalName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Delete document ----------------
export const deleteDocument = async (req, res) => {
  try {
    const { filename } = req.params;

    const family = await Family.findById(req.family._id);
    if (!family) return res.status(404).json({ message: "Family not found" });

    const docIndex = family.documents.findIndex((d) => d.storedName === filename);
    if (docIndex === -1) {
      return res.status(404).json({ message: "Document not found" });
    }

    const doc = family.documents[docIndex];
    const filePath = path.join(__dirname, "../uploads/documents", doc.storedName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // delete file from server
    }

    family.documents.splice(docIndex, 1);
    await family.save();

    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
