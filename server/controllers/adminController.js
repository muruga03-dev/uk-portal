// controllers/adminController.js
import Admin from "../models/Admin.js";
import Family from "../models/Family.js";
import Event from "../models/Event.js";
import Worker from "../models/Worker.js";
import History from "../models/History.js";
import Gallery from "../models/Gallery.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Multer temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../uploads/temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
export const uploadGallery = multer({ storage });

// ---------------- Admin login ----------------
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      admin: { id: admin._id, username: admin.username, role: "admin" },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Families CRUD ----------------
export const getAllFamilies = async (req, res) => {
  try {
    const families = await Family.find().select("-passwordHash").lean();
    res.json(families);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createFamily = async (req, res) => {
  try {
    const { familyId, leaderName, members, address, email, phone, password } = req.body;
    if (!familyId || !leaderName || !email || !password) return res.status(400).json({ message: "Missing required fields" });

    const existing = await Family.findOne({ familyId });
    if (existing) return res.status(400).json({ message: "Family already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const family = new Family({
      familyId,
      leaderName,
      members: members || [],
      address: address || "",
      email,
      phone: phone || "",
      passwordHash,
      approved: false,
      taxHistory: [],
      documents: [],
    });

    await family.save();
    res.json({ message: "Family created", family });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveFamily = async (req, res) => {
  try {
    const { id } = req.body;
    const family = await Family.findById(id);
    if (!family) return res.status(404).json({ message: "Family not found" });
    family.approved = true;
    await family.save();
    res.json({ message: "Family approved", family });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const rejectFamily = async (req, res) => {
  try {
    const { id } = req.body;
    const family = await Family.findById(id);
    if (!family) return res.status(404).json({ message: "Family not found" });
    family.approved = false;
    await family.save();
    res.json({ message: "Family rejected", family });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Tax Operations ----------------
export const updateTax = async (req, res) => {
  try {
    const { familyId, month, amount, paid } = req.body;
    if (!familyId || !month) return res.status(400).json({ message: "familyId and month are required" });

    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    const taxEntry = family.taxHistory.find((t) => t.month === month);
    if (taxEntry) {
      taxEntry.amount = Number(amount) || taxEntry.amount;
      if (typeof paid === "boolean") taxEntry.paid = paid;
    } else {
      family.taxHistory.push({ month, amount: Number(amount) || 0, paid: !!paid });
    }

    await family.save();
    res.json({ message: "Tax updated", family });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markTaxPaid = async (req, res) => {
  try {
    const { familyId } = req.params;
    const { month, paid, amount } = req.body;
    if (!familyId || !month) return res.status(400).json({ message: "familyId and month are required" });

    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    let taxEntry = family.taxHistory.find((t) => t.month === month);
    if (!taxEntry) {
      taxEntry = { month, amount: amount || 0, paid: !!paid };
      family.taxHistory.push(taxEntry);
    } else {
      if (amount !== undefined) taxEntry.amount = Number(amount);
      if (typeof paid === "boolean") taxEntry.paid = paid;
    }

    await family.save();
    res.json({ message: "Tax entry updated", family });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTotalTaxByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    if (!month) return res.status(400).json({ message: "month is required" });

    const families = await Family.find({ "taxHistory.month": month }).lean();
    let total = 0;
    families.forEach(family => {
      const entry = family.taxHistory.find(t => t.month === month && t.paid);
      if (entry) total += Number(entry.amount) || 0;
    });

    res.json({ month, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const bulkUpdateTax = async (req, res) => {
  try {
    const { familyIds, month, amount, paid } = req.body;
    if (!familyIds || !Array.isArray(familyIds) || familyIds.length === 0) return res.status(400).json({ message: "familyIds must be a non-empty array" });
    if (!month) return res.status(400).json({ message: "month is required" });

    const numericAmount = Number(amount || 0);
    const results = { updated: 0, created: 0, skipped: 0 };

    for (const id of familyIds) {
      const family = await Family.findById(id);
      if (!family) { results.skipped += 1; continue; }

      const existing = family.taxHistory.find(t => t.month === month);
      if (existing) {
        existing.amount = numericAmount;
        if (typeof paid === "boolean") existing.paid = paid;
        results.updated += 1;
      } else {
        family.taxHistory.push({ month, amount: numericAmount, paid: !!paid });
        results.created += 1;
      }
      await family.save();
    }

    res.json({ message: `Tax processed for ${familyIds.length} families`, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTax = async (req, res) => {
  try {
    const { familyId, taxId } = req.params;
    if (!familyId || !taxId) return res.status(400).json({ message: "familyId and taxId are required" });

    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    const originalLength = family.taxHistory.length;
    family.taxHistory = family.taxHistory.filter(t => t._id.toString() !== taxId);
    if (family.taxHistory.length === originalLength) return res.status(404).json({ message: "Tax record not found" });

    await family.save();
    res.json({ message: "Tax record deleted successfully", family });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Notifications ----------------
export const sendTaxNotifications = async (req, res) => {
  try {
    const families = await Family.find({ "taxHistory.paid": false });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    let count = 0;
    for (const f of families) {
      if (!f.email) continue;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: f.email,
        subject: "Pending Tax Notification",
        text: `Dear ${f.leaderName}, you have pending tax to pay. Please pay as soon as possible.`,
      });
      count += 1;
    }

    res.json({ message: "Notifications sent", count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Events CRUD ----------------
export const getEvents = async (req, res) => {
  try {
    res.json(await Event.find().sort({ date: 1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.json({ message: "Event created", event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ message: "Event updated", event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Workers CRUD ----------------
export const getWorkers = async (req, res) => {
  try {
    res.json(await Worker.find());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createWorker = async (req, res) => {
  try {
    const { type, description } = req.body;
    if (!type) return res.status(400).json({ message: "Worker type is required" });
    const worker = new Worker({ type, description });
    await worker.save();
    res.json({ message: "Worker created", worker });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await Worker.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ message: "Worker updated", worker });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    await Worker.findByIdAndDelete(id);
    res.json({ message: "Worker deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- History CRUD ----------------
export const getHistory = async (req, res) => {
  try {
    res.json(await History.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createHistory = async (req, res) => {
  try {
    const entry = new History(req.body);
    await entry.save();
    res.json({ message: "History entry created", entry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await History.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ message: "History updated", entry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    await History.findByIdAndDelete(id);
    res.json({ message: "History entry deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Gallery (Cloudinary) ----------------
export const uploadGalleryImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "uk-portal/gallery",
      use_filename: true,
      unique_filename: false,
      resource_type: "auto",
    });

    const galleryItem = new Gallery({
      title: req.body.title || "Untitled",
      description: req.body.description || "",
      url: result.secure_url,
    });
    await galleryItem.save();

    fs.unlinkSync(req.file.path); // delete temp file

    res.json({ message: "Gallery uploaded", galleryItem });
  } catch (err) {
    console.error("Gallery upload error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGallery = async (req, res) => {
  try {
    res.json(await Gallery.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const galleryItem = await Gallery.findById(id);
    if (!galleryItem) return res.status(404).json({ message: "Gallery item not found" });

    try {
      const urlParts = galleryItem.url.split("/");
      const lastPart = urlParts[urlParts.length - 1];
      const publicId = lastPart.split(".")[0];
      await cloudinary.uploader.destroy(`uk-portal/gallery/${publicId}`);
    } catch (e) {
      console.warn("Cloudinary delete failed:", e.message);
    }

    await Gallery.findByIdAndDelete(id);
    res.json({ message: "Gallery item deleted" });
  } catch (err) {
    console.error("Gallery deletion error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
