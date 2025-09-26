import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Family from "./models/Family.js";
import Admin from "./models/Admin.js";

dotenv.config();

// -------------------
// MongoDB Connection
// -------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// -------------------
// Seed Function
// -------------------
const seedData = async () => {
  try {
    // Clear existing data
    await Family.deleteMany({});
    await Admin.deleteMany({});

    // -------------------
    // Admins
    // -------------------
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = new Admin({
      username: "admin1",
      passwordHash: adminPassword,
      role: "superadmin",
    });
    await admin.save();

    // -------------------
    // Families
    // -------------------
    const familyPassword = await bcrypt.hash("family123", 10);
    const families = [
      {
        familyId: "FAM001",
        passwordHash: familyPassword,
        leaderName: "Ravi Kumar",
        members: ["Ravi Kumar", "Anita", "Arjun"],
        address: "12 Main Street, Udaikulam",
        email: "ravi.family@example.com",
        phone: "9876543210",
        approved: false,
        taxHistory: [],
      },
      {
        familyId: "FAM002",
        passwordHash: familyPassword,
        leaderName: "Priya Devi",
        members: ["Priya Devi", "Sanjay", "Divya"],
        address: "45 Lake Road, Udaikulam",
        email: "priya.family@example.com",
        phone: "9876501234",
        approved: false,
        taxHistory: [],
      },
    ];

    await Family.insertMany(families);

    console.log("Database seeded successfully!");
    process.exit();
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
};

seedData();
