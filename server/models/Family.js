import mongoose from "mongoose";

// ---------------- Subschemas ----------------
const taxSchema = new mongoose.Schema({
  month: {
    type: String, // e.g. "2025-09"
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  paid: {
    type: Boolean,
    default: false,
  },
});

const docSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true,
  },
  path: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

// ---------------- Main Family Schema ----------------
const familySchema = new mongoose.Schema(
  {
    familyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    leaderName: {
      type: String,
      required: true,
      trim: true,
    },
    members: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    approved: {
      type: Boolean,
      default: false,
    },
    taxHistory: {
      type: [taxSchema],
      default: [],
    },
    documents: {
      type: [docSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Family", familySchema);
