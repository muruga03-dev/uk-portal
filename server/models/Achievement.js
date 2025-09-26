import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
  title: String,
  description: String,
  year: Number
}, { timestamps: true });

export default mongoose.model("Achievement", achievementSchema);
