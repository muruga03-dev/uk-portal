import express from "express";
import { protectAdmin } from "../middleware/authMiddleware.js";
import {
  loginAdmin,
  // Families
  getAllFamilies,
  createFamily,
  approveFamily,
  rejectFamily,
  updateTax,
  bulkUpdateTax,
  sendTaxNotifications,
  deleteTax,            // Added delete tax record
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

const router = express.Router();

// ---------------- Admin login ----------------
router.post("/login", loginAdmin);

// ---------------- Protected Routes ----------------
router.use(protectAdmin);

// ---------------- Families ----------------
router.get("/families", getAllFamilies);
router.post("/families", createFamily);
router.post("/families/approve", approveFamily);
router.post("/families/reject", rejectFamily);
router.post("/families/tax", updateTax);
router.post("/families/tax/bulk", bulkUpdateTax);
router.post("/families/notify", sendTaxNotifications);
router.delete("/families/tax/:taxId/:familyId", deleteTax); // Delete specific tax record

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
router.post("/gallery/upload", uploadGallery.single("file"), uploadGalleryImage);
router.get("/gallery", getGallery);
router.delete("/gallery/:id", deleteGallery);

export default router;
