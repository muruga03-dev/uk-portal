import express from "express";
import {
  loginAdmin,
  getAllFamilies,
  createFamily,
  approveFamily,
  rejectFamily,
  updateTax,
  bulkUpdateTax,
  sendTaxNotifications,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  getHistory,
  createHistory,
  updateHistory,
  deleteHistory,
  uploadGallery,        // multer middleware
  uploadGalleryImage,
  getGallery,
  deleteGallery
} from "../controllers/adminController.js";

const router = express.Router();

// ---------------- Admin login ----------------
router.post("/login", loginAdmin);

// ---------------- Families ----------------
router.get("/families", getAllFamilies);
router.post("/families", createFamily);
router.post("/families/approve", approveFamily);
router.post("/families/reject", rejectFamily);
router.post("/families/tax", updateTax);
router.post("/families/tax/bulk", bulkUpdateTax);
router.post("/families/notify", sendTaxNotifications);

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
// Use `uploadGallery.single("image")` because your frontend sends 'image' field
router.post("/gallery/upload", uploadGallery.single("image"), uploadGalleryImage);
router.get("/gallery", getGallery);
router.delete("/gallery/:id", deleteGallery);

export default router;
