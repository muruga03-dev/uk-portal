import express from "express";
import multer from "multer";
import {
  loginAdmin,
  createFamily,
  approveFamily,
  rejectFamily,
  updateTax,
  sendTaxNotifications,
  uploadGalleryImage,
  getGallery,
  deleteGallery,
  getAllFamilies,
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
  deleteHistory
} from "../controllers/adminController.js";

const router = express.Router();

// Multer setup for gallery upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/gallery"); // make sure folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ------------------ ADMIN LOGIN ------------------
router.post("/login", loginAdmin);

// ------------------ FAMILIES ------------------
router.get("/families", getAllFamilies);
router.post("/families", createFamily);
router.post("/families/approve", approveFamily);
router.post("/families/reject", rejectFamily);
router.post("/families/tax", updateTax);
router.post("/families/notify-tax", sendTaxNotifications);

// ------------------ GALLERY ------------------
router.post("/gallery", upload.single("image"), uploadGalleryImage);
router.get("/gallery", getGallery);
router.delete("/gallery/:id", deleteGallery);

// ------------------ EVENTS ------------------
router.get("/events", getEvents);
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

// ------------------ WORKERS ------------------
router.get("/workers", getWorkers);
router.post("/workers", createWorker);
router.put("/workers/:id", updateWorker);
router.delete("/workers/:id", deleteWorker);

// ------------------ HISTORY ------------------
router.get("/history", getHistory);
router.post("/history", createHistory);
router.put("/history/:id", updateHistory);
router.delete("/history/:id", deleteHistory);

export default router;
