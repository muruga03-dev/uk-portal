import express from "express";
import { protectFamily } from "../middleware/authMiddleware.js";
import {
  loginFamily,
  registerFamily,
  getMyFamily,
  uploadDocument,
  downloadDocument,
} from "../controllers/familyController.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// ---------------- Multer setup for document uploads ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/documents"));
  },
  filename: (req, file, cb) => {
    // Ensure unique filename
    cb(null, `${Date.now()}-${file.originalname}`);
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

// Upload document
router.post("/upload", upload.single("document"), uploadDocument);

// Download document by filename
router.get("/download/:filename", downloadDocument);

export default router;
