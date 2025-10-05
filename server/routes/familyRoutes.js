import express from "express";
import { protectFamily } from "../middleware/authMiddleware.js";
import {
  loginFamily,
  registerFamily,
  getMyFamily,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  deleteTax,
  updateProfile,  // Added updateProfile controller
} from "../controllers/familyController.js";
import { upload } from "../controllers/familyController.js"; // Import the configured upload middleware

const router = express.Router();

// ---------------- Public routes ----------------
router.post("/register", registerFamily);
router.post("/login", loginFamily);

// ---------------- Protected routes ----------------
router.use(protectFamily);

// Family profile routes
router.get("/me", getMyFamily);                    // Get logged-in family profile
router.put("/profile", updateProfile);             // Update family profile

// Document management routes
router.post("/upload", upload.single("document"), uploadDocument);  // Upload document
router.get("/document/:filename", downloadDocument);               // Download document
router.delete("/document/:docId", deleteDocument);                 // Delete document

// Tax management routes
router.delete("/tax/:taxId", deleteTax);          // Delete tax record

export default router;