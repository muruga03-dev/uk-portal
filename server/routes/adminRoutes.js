import express from "express";
import {
  loginAdmin,
  // Families
  getAllFamilies,
  createFamily,
  approveFamily,
  rejectFamily,
  updateTax,         // update single tax
  bulkUpdateTax,     // update multiple taxes
  sendTaxNotifications,
  // Events
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  // Workers
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  // History
  getHistory,
  createHistory,
  updateHistory,
  deleteHistory,
  // Gallery
  uploadGallery,
  uploadGalleryImage,
  getGallery,
  deleteGallery,
} from "../controllers/adminController.js";

import { protectAdmin } from "../middleware/authMiddleware.js";

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const router = express.Router();

// ---------------- Multer setup for gallery uploads ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const galleryPath = path.join(__dirname, "../uploads/gallery");
if (!fs.existsSync(galleryPath)) fs.mkdirSync(galleryPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, galleryPath),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\.-]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

export const uploadGalleryMiddleware = multer({ storage });

// ---------------- Admin login ----------------
router.post("/login", loginAdmin);

// ---------------- Protected routes ----------------
router.use(protectAdmin);

// ---------------- Families ----------------
router.get("/families", getAllFamilies);
router.post("/families", createFamily);
router.post("/families/approve", approveFamily);
router.post("/families/reject", rejectFamily);

// Tax operations
router.post("/families/tax", updateTax);          // Update a single tax record
router.post("/families/tax/bulk", bulkUpdateTax); // Update multiple tax records
router.post("/families/notify", sendTaxNotifications); // Send notifications

// ---------------- Events ----------------
router.get("/events", getEvents);
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

// ---------------- Workers ----------------
router.get("/workers", getWorkers);
router.post("/workers", createWorker);
router.put("/workers/:id", updateWorker);
router.delete("/workers/:id", deleteWorker);

// ---------------- History ----------------
router.get("/history", getHistory);
router.post("/history", createHistory);
router.put("/history/:id", updateHistory);
router.delete("/history/:id", deleteHistory);

// ---------------- Gallery ----------------
router.post("/gallery/upload", uploadGalleryMiddleware.single("file"), uploadGalleryImage);
router.get("/gallery", getGallery);
router.delete("/gallery/:id", deleteGallery);

export default router;
