import express from "express";
import { protectFamily } from "../middleware/authMiddleware.js";
import {
  loginFamily,
  registerFamily,
  getMyFamily,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from "../controllers/familyController.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- Multer setup for document uploads ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/documents"));
  },
  filename: (req, file, cb) => {
    // Ensure safe + unique filename
    const safeName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\.-]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

export const upload = multer({ storage });

// ---------------- Public routes ----------------
router.post("/register", registerFamily);
router.post("/login", loginFamily);

// ---------------- Protected routes ----------------
router.use(protectFamily);

// Get logged-in family profile
router.get("/me", getMyFamily);

// Upload a document (field: "document")
router.post("/upload", upload.single("document"), uploadDocument);

// Download a document by filename
router.get("/download/:filename", downloadDocument);

// Delete a document by filename
router.delete("/delete/:filename", deleteDocument);

export default router;
