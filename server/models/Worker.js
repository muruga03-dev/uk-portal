import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  type: String,
  description: String
}, { timestamps: true });

export default mongoose.model("Worker", workerSchema);
