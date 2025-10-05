// controllers/adminController.js
import Admin from "../models/Admin.js";
import Family from "../models/Family.js";
import Event from "../models/Event.js";
import Worker from "../models/Worker.js";
import History from "../models/History.js";
import Gallery from "../models/Gallery.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Multer temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../uploads/temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
export const uploadGallery = multer({ storage });

// ---------------- Admin login ----------------
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      admin: { id: admin._id, username: admin.username, role: "admin" },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ---------------- Families CRUD ----------------
export const getAllFamilies = async (req, res) => {
  try {
    const families = await Family.find().select("-passwordHash").lean();
    res.json(families);
  } catch (err) {
    console.error("Get all families error:", err);
    res.status(500).json({ message: "Failed to fetch families" });
  }
};

export const createFamily = async (req, res) => {
  try {
    const { familyId, leaderName, members, address, email, phone, password } = req.body;
    
    if (!familyId || !leaderName || !email || !password) {
      return res.status(400).json({ message: "Family ID, Leader Name, Email, and Password are required" });
    }

    const existing = await Family.findOne({ 
      $or: [
        { familyId },
        { email }
      ]
    });
    if (existing) {
      return res.status(400).json({ message: "Family ID or Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const family = new Family({
      familyId,
      leaderName,
      members: Array.isArray(members) ? members : (members ? members.split(",").map(m => m.trim()) : []),
      address: address || "",
      email,
      phone: phone || "",
      passwordHash,
      approved: false,
      taxHistory: [],
      documents: [],
    });

    await family.save();
    
    // Return family without password hash
    const familyResponse = await Family.findById(family._id).select("-passwordHash");
    res.status(201).json({ message: "Family created successfully", family: familyResponse });
  } catch (err) {
    console.error("Create family error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to create family" });
  }
};

export const approveFamily = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "Family ID is required" });

    const family = await Family.findById(id);
    if (!family) return res.status(404).json({ message: "Family not found" });
    
    family.approved = true;
    await family.save();
    
    const updatedFamily = await Family.findById(id).select("-passwordHash");
    res.json({ message: "Family approved successfully", family: updatedFamily });
  } catch (err) {
    console.error("Approve family error:", err);
    res.status(500).json({ message: "Failed to approve family" });
  }
};

export const rejectFamily = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "Family ID is required" });

    const family = await Family.findById(id);
    if (!family) return res.status(404).json({ message: "Family not found" });
    
    family.approved = false;
    await family.save();
    
    const updatedFamily = await Family.findById(id).select("-passwordHash");
    res.json({ message: "Family rejected successfully", family: updatedFamily });
  } catch (err) {
    console.error("Reject family error:", err);
    res.status(500).json({ message: "Failed to reject family" });
  }
};

// ---------------- Tax Operations ----------------
export const updateTax = async (req, res) => {
  try {
    const { familyId, month, amount, paid } = req.body;
    if (!familyId || !month) {
      return res.status(400).json({ message: "Family ID and month are required" });
    }

    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    const taxEntry = family.taxHistory.find((t) => t.month === month);
    if (taxEntry) {
      taxEntry.amount = Number(amount) || taxEntry.amount;
      if (typeof paid === "boolean") taxEntry.paid = paid;
      taxEntry.updatedAt = new Date();
    } else {
      family.taxHistory.push({ 
        month, 
        amount: Number(amount) || 0, 
        paid: !!paid,
        createdAt: new Date()
      });
    }

    await family.save();
    
    const updatedFamily = await Family.findById(familyId).select("-passwordHash");
    res.json({ message: "Tax updated successfully", family: updatedFamily });
  } catch (err) {
    console.error("Update tax error:", err);
    res.status(500).json({ message: "Failed to update tax" });
  }
};

export const markTaxPaid = async (req, res) => {
  try {
    const { familyId } = req.params;
    const { month, paid, amount } = req.body;
    
    if (!familyId || !month) {
      return res.status(400).json({ message: "Family ID and month are required" });
    }

    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    let taxEntry = family.taxHistory.find((t) => t.month === month);
    if (!taxEntry) {
      taxEntry = { 
        month, 
        amount: amount || 0, 
        paid: !!paid,
        createdAt: new Date()
      };
      family.taxHistory.push(taxEntry);
    } else {
      if (amount !== undefined) taxEntry.amount = Number(amount);
      if (typeof paid === "boolean") taxEntry.paid = paid;
      taxEntry.updatedAt = new Date();
    }

    await family.save();
    
    const updatedFamily = await Family.findById(familyId).select("-passwordHash");
    res.json({ message: "Tax entry updated successfully", family: updatedFamily });
  } catch (err) {
    console.error("Mark tax paid error:", err);
    res.status(500).json({ message: "Failed to update tax entry" });
  }
};

export const getTotalTaxByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    if (!month) return res.status(400).json({ message: "Month is required" });

    const families = await Family.find({ "taxHistory.month": month }).lean();
    
    let totalPaid = 0;
    let totalPending = 0;
    let paidCount = 0;
    let pendingCount = 0;

    families.forEach(family => {
      family.taxHistory.forEach(tax => {
        if (tax.month === month) {
          if (tax.paid) {
            totalPaid += Number(tax.amount) || 0;
            paidCount++;
          } else {
            totalPending += Number(tax.amount) || 0;
            pendingCount++;
          }
        }
      });
    });

    res.json({ 
      month, 
      totalPaid,
      totalPending,
      totalAmount: totalPaid + totalPending,
      paidCount,
      pendingCount,
      totalFamilies: paidCount + pendingCount
    });
  } catch (err) {
    console.error("Get total tax error:", err);
    res.status(500).json({ message: "Failed to get tax summary" });
  }
};

export const bulkUpdateTax = async (req, res) => {
  try {
    const { familyIds, month, amount, paid } = req.body;
    
    if (!familyIds || !Array.isArray(familyIds) || familyIds.length === 0) {
      return res.status(400).json({ message: "Family IDs must be a non-empty array" });
    }
    if (!month) return res.status(400).json({ message: "Month is required" });

    const numericAmount = Number(amount || 0);
    const isPaid = !!paid;
    const results = { 
      updated: 0, 
      created: 0, 
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (const id of familyIds) {
      try {
        const family = await Family.findById(id);
        if (!family) { 
          results.skipped += 1; 
          results.errors.push(`Family not found: ${id}`);
          continue; 
        }

        const existing = family.taxHistory.find(t => t.month === month);
        if (existing) {
          existing.amount = numericAmount;
          existing.paid = isPaid;
          existing.updatedAt = new Date();
          results.updated += 1;
        } else {
          family.taxHistory.push({ 
            month, 
            amount: numericAmount, 
            paid: isPaid,
            createdAt: new Date()
          });
          results.created += 1;
        }
        await family.save();
      } catch (error) {
        results.failed += 1;
        results.errors.push(`Failed to update family ${id}: ${error.message}`);
      }
    }

    res.json({ 
      message: `Tax processing completed for ${familyIds.length} families`,
      results 
    });
  } catch (err) {
    console.error("Bulk update tax error:", err);
    res.status(500).json({ message: "Failed to process bulk tax update" });
  }
};

export const deleteTax = async (req, res) => {
  try {
    const { familyId, taxId } = req.params;
    
    if (!familyId || !taxId) {
      return res.status(400).json({ message: "Family ID and Tax ID are required" });
    }

    const family = await Family.findById(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    const originalLength = family.taxHistory.length;
    family.taxHistory = family.taxHistory.filter(t => t._id.toString() !== taxId);
    
    if (family.taxHistory.length === originalLength) {
      return res.status(404).json({ message: "Tax record not found" });
    }

    await family.save();
    
    const updatedFamily = await Family.findById(familyId).select("-passwordHash");
    res.json({ message: "Tax record deleted successfully", family: updatedFamily });
  } catch (err) {
    console.error("Delete tax error:", err);
    res.status(500).json({ message: "Failed to delete tax record" });
  }
};

// ---------------- Notifications ----------------
export const sendTaxNotifications = async (req, res) => {
  try {
    // Find families with pending taxes in the current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const families = await Family.find({ 
      "taxHistory": {
        $elemMatch: {
          month: currentMonth,
          paid: false
        }
      }
    });

    if (families.length === 0) {
      return res.json({ message: "No families with pending taxes found for current month", count: 0 });
    }

    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        message: "Email configuration not set up. Notifications simulated.",
        count: families.length,
        families: families.map(f => ({ familyId: f.familyId, leaderName: f.leaderName, email: f.email }))
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    let sentCount = 0;
    const failedEmails = [];

    for (const family of families) {
      if (!family.email) {
        failedEmails.push({ familyId: family.familyId, reason: "No email address" });
        continue;
      }

      try {
        const pendingTax = family.taxHistory.find(t => t.month === currentMonth && !t.paid);
        
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: family.email,
          subject: "Pending Tax Payment Reminder",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Tax Payment Reminder</h2>
              <p>Dear ${family.leaderName},</p>
              <p>This is a reminder that you have a pending tax payment for <strong>${currentMonth}</strong>.</p>
              ${pendingTax ? `<p>Amount: <strong>₹${pendingTax.amount}</strong></p>` : ''}
              <p>Please make the payment at your earliest convenience to avoid any issues.</p>
              <br>
              <p>Best regards,<br>Community Administration</p>
            </div>
          `,
        });
        sentCount += 1;
      } catch (emailError) {
        console.error(`Failed to send email to ${family.email}:`, emailError);
        failedEmails.push({ 
          familyId: family.familyId, 
          email: family.email, 
          reason: emailError.message 
        });
      }
    }

    res.json({ 
      message: `Tax notifications processed`,
      sent: sentCount,
      failed: failedEmails.length,
      totalFamilies: families.length,
      failedEmails
    });
  } catch (err) {
    console.error("Send notifications error:", err);
    res.status(500).json({ message: "Failed to send notifications" });
  }
};

// ---------------- Events CRUD ----------------
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { title, date, description, location } = req.body;
    
    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required" });
    }

    const event = new Event({
      title,
      date,
      description: description || "",
      location: location || ""
    });

    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
  } catch (err) {
    console.error("Create event error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to create event" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const event = await Event.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!event) return res.status(404).json({ message: "Event not found" });
    
    res.json({ message: "Event updated successfully", event });
  } catch (err) {
    console.error("Update event error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to update event" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ message: "Failed to delete event" });
  }
};

// ---------------- Workers CRUD ----------------
export const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().sort({ type: 1 });
    res.json(workers);
  } catch (err) {
    console.error("Get workers error:", err);
    res.status(500).json({ message: "Failed to fetch workers" });
  }
};

export const createWorker = async (req, res) => {
  try {
    const { type, description, contact, availability } = req.body;
    
    if (!type) {
      return res.status(400).json({ message: "Worker type is required" });
    }

    const worker = new Worker({
      type,
      description: description || "",
      contact: contact || "",
      availability: availability || "Available"
    });

    await worker.save();
    res.status(201).json({ message: "Worker created successfully", worker });
  } catch (err) {
    console.error("Create worker error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to create worker" });
  }
};

export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const worker = await Worker.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    
    res.json({ message: "Worker updated successfully", worker });
  } catch (err) {
    console.error("Update worker error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to update worker" });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await Worker.findByIdAndDelete(id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    
    res.json({ message: "Worker deleted successfully" });
  } catch (err) {
    console.error("Delete worker error:", err);
    res.status(500).json({ message: "Failed to delete worker" });
  }
};

// ---------------- History CRUD ----------------
export const getHistory = async (req, res) => {
  try {
    const history = await History.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ message: "Failed to fetch history" });
  }
};

export const createHistory = async (req, res) => {
  try {
    const { content, title, year } = req.body;
    
    if (!content || (!content.en && !content.ta)) {
      return res.status(400).json({ message: "History content is required in at least one language" });
    }

    const historyEntry = new History({
      title: title || "Historical Event",
      content: {
        en: content.en || "",
        ta: content.ta || ""
      },
      year: year || new Date().getFullYear()
    });

    await historyEntry.save();
    res.status(201).json({ message: "History entry created successfully", entry: historyEntry });
  } catch (err) {
    console.error("Create history error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to create history entry" });
  }
};

export const updateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const historyEntry = await History.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!historyEntry) return res.status(404).json({ message: "History entry not found" });
    
    res.json({ message: "History entry updated successfully", entry: historyEntry });
  } catch (err) {
    console.error("Update history error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to update history entry" });
  }
};

export const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const historyEntry = await History.findByIdAndDelete(id);
    if (!historyEntry) return res.status(404).json({ message: "History entry not found" });
    
    res.json({ message: "History entry deleted successfully" });
  } catch (err) {
    console.error("Delete history error:", err);
    res.status(500).json({ message: "Failed to delete history entry" });
  }
};

// ---------------- Gallery (Cloudinary) ----------------
export const uploadGalleryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path); // Clean up temp file
      return res.status(400).json({ 
        message: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, AVI, MOV) are allowed." 
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path); // Clean up temp file
      return res.status(400).json({ 
        message: "File too large. Maximum size is 10MB." 
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "uk-portal/gallery",
      use_filename: true,
      unique_filename: true,
      resource_type: "auto", // Automatically detect image or video
      transformation: [
        { quality: "auto", fetch_format: "auto" }
      ]
    });

    const galleryItem = new Gallery({
      title: req.body.title || "Untitled",
      description: req.body.description || "",
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      fileType: req.file.mimetype
    });

    await galleryItem.save();

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json({ 
      message: "Gallery item uploaded successfully", 
      galleryItem 
    });
  } catch (err) {
    console.error("Gallery upload error:", err);
    
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (err.message.includes("File size too large")) {
      return res.status(400).json({ message: "File size exceeds Cloudinary limits" });
    }
    
    res.status(500).json({ message: "Failed to upload gallery item" });
  }
};

export const getGallery = async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({ createdAt: -1 });
    res.json(gallery);
  } catch (err) {
    console.error("Get gallery error:", err);
    res.status(500).json({ message: "Failed to fetch gallery" });
  }
};

export const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;

    const galleryItem = await Gallery.findById(id);
    if (!galleryItem) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(galleryItem.publicId, {
        resource_type: galleryItem.resourceType || 'image'
      });
    } catch (cloudinaryError) {
      console.warn("Cloudinary delete warning:", cloudinaryError.message);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await Gallery.findByIdAndDelete(id);

    res.json({ message: "Gallery item deleted successfully" });
  } catch (err) {
    console.error("Gallery deletion error:", err);
    res.status(500).json({ message: "Failed to delete gallery item" });
  }
};