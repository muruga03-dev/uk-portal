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

// ---------------- Multer setup for gallery uploads ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/gallery")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
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

    res.json({ token, admin: { id: admin._id, username: admin.username, role: "admin" } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Families ----------------
export const getAllFamilies = async (req, res) => {
  try {
    const families = await Family.find().select("-passwordHash");
    res.json(families);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createFamily = async (req, res) => {
  try {
    const { familyId, leaderName, members, address, email, phone, password } = req.body;
    if (!familyId || !leaderName || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

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

// ---------------- Update Tax ----------------
export const updateTax = async (req, res) => {
  try {
    const { familyId, month, amount } = req.body;
    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    const taxEntry = family.taxHistory.find((t) => t.month === month);
    if (taxEntry) taxEntry.amount = amount;
    else family.taxHistory.push({ month, amount, paid: false });

    await family.save();
    res.json({ message: "Tax updated", family });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Send notifications ----------------
export const sendTaxNotifications = async (req, res) => {
  try {
    const families = await Family.find({ "taxHistory.paid": false });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    for (const f of families) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: f.email,
        subject: "Pending Tax Notification",
        text: `Dear ${f.leaderName}, you have pending tax to pay. Please pay as soon as possible.`,
      });
    }

    res.json({ message: "Notifications sent", count: families.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Events CRUD ----------------
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
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
    const workers = await Worker.find();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createWorker = async (req, res) => {
  try {
    const worker = new Worker(req.body);
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
    const history = await History.find();
    res.json(history);
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

// ---------------- Gallery ----------------
export const uploadGalleryImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const galleryItem = new Gallery({
      title: req.body.title || "Untitled",
      description: req.body.description || "",
      url: `/uploads/gallery/${req.file.filename}`,
    });

    await galleryItem.save();
    res.json({ message: "Gallery uploaded", galleryItem });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGallery = async (req, res) => {
  try {
    const gallery = await Gallery.find();
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const galleryItem = await Gallery.findById(id);
    if (!galleryItem) return res.status(404).json({ message: "Gallery item not found" });

    const filePath = path.join(__dirname, "../", galleryItem.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Gallery.findByIdAndDelete(id);
    res.json({ message: "Gallery item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
