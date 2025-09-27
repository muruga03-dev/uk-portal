import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Route imports
import adminRoutes from "./routes/adminRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Setup __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static uploads (images, documents, gallery files)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/admin", adminRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/public", publicRoutes); // Public endpoints (events, gallery, workers, history)

// Global error handler
app.use((err, req, res, next) => {
console.error("❌ Unhandled error:", err);
res.status(500).json({
message: "Internal Server Error",
error: process.env.NODE_ENV === "development" ? err.message : undefined,
});
});

// MongoDB connection + start server
const startServer = async () => {
try {
await mongoose.connect(process.env.MONGO_URI);
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