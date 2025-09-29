import express from "express";
import { protectFamily } from "../middleware/authMiddleware.js";
import {
  loginFamily,
  registerFamily,
  getMyFamily,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  deleteTax,         // import deleteTax controller
} from "../controllers/familyController.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- Multer setup for document uploads ----------------
const uploadPath = path.join(__dirname, "../uploads/documents");

// Ensure the upload folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\.-]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

// ---------------- Public routes ----------------
router.post("/register", registerFamily);
router.post("/login", loginFamily);

// ---------------- Protected routes ----------------
router.use(protectFamily);

// Get logged-in family profile
router.get("/me", getMyFamily);

// Upload a document
router.post("/upload", upload.single("document"), uploadDocument);

// Download a document
router.get("/download/:filename", downloadDocument);

// Delete a document
router.delete("/delete/:filename", deleteDocument);

// ---------------- Tax record routes ----------------
// Delete a specific tax record
router.delete("/tax/:taxId", deleteTax);

// (Optional) You can add update/toggle tax routes here if needed
// Example: router.post("/tax", updateTaxStatus);

export default router;
