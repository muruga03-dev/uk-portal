import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Route imports
import adminRoutes from "./routes/adminRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

dotenv.config();

const app = express();

// ---------------- Middleware ----------------
app.use(cors());
app.use(express.json());

// ---------------- Setup __dirname for ES Modules ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- Ensure uploads directories exist ----------------
const uploadDirs = [
  path.join(__dirname, "uploads/gallery"),
  path.join(__dirname, "uploads/temp"),
  path.join(__dirname, "uploads/documents"), // added for family documents
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ---------------- Serve static files ----------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------- API Routes ----------------
app.use("/api/admin", adminRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/public", publicRoutes);

// ---------------- Health check ----------------
app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

// ---------------- Global error handler ----------------
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ---------------- Start server + MongoDB connection ----------------
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();
