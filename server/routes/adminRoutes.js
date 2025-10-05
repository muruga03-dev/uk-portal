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
  markTaxPaid,
  getTotalTaxByMonth,
  bulkUpdateTax,
  sendTaxNotifications,
  deleteTax,            
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
router.get("/families", getAllFamilies);                       // Get all families
router.post("/families", createFamily);                        // Create a new family
router.post("/families/approve", approveFamily);               // Approve a family
router.post("/families/reject", rejectFamily);                 // Reject a family

// Tax operations
router.put("/families/tax", updateTax);                        // Update single family's tax
router.patch("/families/:familyId/tax", markTaxPaid);          // Mark tax as paid for specific family
router.get("/tax/summary/:month", getTotalTaxByMonth);         // Get tax summary by month
router.post("/families/tax/bulk", bulkUpdateTax);              // Bulk update tax for multiple families
router.delete("/families/:familyId/tax/:taxId", deleteTax);    // Delete specific tax record

// Send tax notifications
router.post("/families/notify", sendTaxNotifications);         // Send tax notifications to families

// ---------------- Events ----------------
router.get("/events", getEvents);                              // Get all events
router.post("/events", createEvent);                           // Create new event
router.put("/events/:id", updateEvent);                        // Update event by ID
router.delete("/events/:id", deleteEvent);                     // Delete event by ID

// ---------------- Workers ----------------
router.get("/workers", getWorkers);                            // Get all workers
router.post("/workers", createWorker);                         // Create new worker
router.put("/workers/:id", updateWorker);                      // Update worker by ID
router.delete("/workers/:id", deleteWorker);                   // Delete worker by ID

// ---------------- History ----------------
router.get("/history", getHistory);                            // Get all history entries
router.post("/history", createHistory);                        // Create new history entry
router.put("/history/:id", updateHistory);                     // Update history entry by ID
router.delete("/history/:id", deleteHistory);                  // Delete history entry by ID

// ---------------- Gallery ----------------
router.post("/gallery/upload", uploadGallery.single("image"), uploadGalleryImage); // Upload gallery image
router.get("/gallery", getGallery);                            // Get all gallery items
router.delete("/gallery/:id", deleteGallery);                  // Delete gallery item by ID

export default router;