import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  // store content for languages
  content: {
    en: String,
    ta: String
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("History", historySchema);
