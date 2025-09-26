// Placeholder for server/models/Document.js
// models/Document.js
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  familyId: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
});

export default mongoose.model("Document", documentSchema);
