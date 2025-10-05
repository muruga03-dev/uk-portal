import Family from "../models/Family.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// __dirname setup for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- Multer Storage Setup -----
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/documents");
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    } catch (err) {
      console.error("Error creating upload directory:", err);
      cb(new Error("Failed to create upload directory"));
    }
  },
  filename: (req, file, cb) => {
    try {
      const safeName = file.originalname
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_\.-]/g, "");
      cb(null, `${Date.now()}-${safeName}`);
    } catch (err) {
      console.error("Error generating filename:", err);
      cb(new Error("Failed to generate filename"));
    }
  },
});

// File filter for Multer
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, GIF, and TXT files are allowed.'), false);
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// ----- Family Registration -----
export const registerFamily = async (req, res) => {
  try {
    const { familyId, leaderName, email, password, members, address, phone } = req.body;
    
    // Input validation
    if (!familyId || !leaderName || !email || !password) {
      return res.status(400).json({
        message: "Family ID, Leader Name, Email, and Password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check for existing family
    const existingFamily = await Family.findOne({ 
      $or: [
        { familyId },
        { email }
      ]
    });
    
    if (existingFamily) {
      if (existingFamily.familyId === familyId) {
        return res.status(400).json({ message: "Family ID already exists" });
      }
      if (existingFamily.email === email) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Process members array
    let membersArray = [];
    if (members) {
      if (Array.isArray(members)) {
        membersArray = members.filter(member => member.trim() !== '');
      } else if (typeof members === 'string') {
        membersArray = members.split(',').map(member => member.trim()).filter(member => member !== '');
      }
    }

    // Create new family
    const newFamily = new Family({
      familyId: familyId.trim(),
      leaderName: leaderName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      members: membersArray,
      address: address ? address.trim() : "",
      phone: phone ? phone.trim() : "",
      taxHistory: [],
      documents: [],
      approved: false,
    });

    await newFamily.save();

    // Return family without password hash
    const familyResponse = await Family.findById(newFamily._id).select("-passwordHash");
    
    res.status(201).json({ 
      message: "Family registered successfully", 
      family: familyResponse 
    });
  } catch (err) {
    console.error("Family registration error:", err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors 
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: "Family ID or Email already exists" 
      });
    }
    
    res.status(500).json({ 
      message: "Internal server error during registration" 
    });
  }
};

// ----- Family Login -----
export const loginFamily = async (req, res) => {
  try {
    const { familyId, password } = req.body;
    
    // Input validation
    if (!familyId || !password) {
      return res.status(400).json({ 
        message: "Family ID and password are required" 
      });
    }

    // Find family
    const family = await Family.findOne({ familyId: familyId.trim() });
    if (!family) {
      return res.status(401).json({ 
        message: "Invalid Family ID or password" 
      });
    }

    // Check if family is approved
    if (!family.approved) {
      return res.status(403).json({ 
        message: "Your account is pending approval. Please contact administrator." 
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, family.passwordHash);
    if (!match) {
      return res.status(401).json({ 
        message: "Invalid Family ID or password" 
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: family._id, 
        role: "family",
        familyId: family.familyId
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    // Return family data without password hash
    const familyData = await Family.findById(family._id).select("-passwordHash");

    res.json({
      message: "Login successful",
      token,
      family: familyData
    });
  } catch (err) {
    console.error("Family login error:", err);
    res.status(500).json({ 
      message: "Internal server error during login" 
    });
  }
};

// ----- Get My Family Profile -----
export const getMyFamily = async (req, res) => {
  try {
    if (!req.family || !req.family._id) {
      return res.status(401).json({ 
        message: "Authentication required" 
      });
    }

    const family = await Family.findById(req.family._id).select("-passwordHash");
    if (!family) {
      return res.status(404).json({ 
        message: "Family not found" 
      });
    }

    res.json(family);
  } catch (err) {
    console.error("Get family profile error:", err);
    res.status(500).json({ 
      message: "Failed to fetch family profile" 
    });
  }
};

// ----- Upload Document -----
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: "No file uploaded or invalid file type" 
      });
    }

    if (!req.family || !req.family._id) {
      return res.status(401).json({ 
        message: "Authentication required" 
      });
    }

    const family = await Family.findById(req.family._id);
    if (!family) {
      return res.status(404).json({ 
        message: "Family not found" 
      });
    }

    // Check if document with same name already exists
    const existingDoc = family.documents.find(
      doc => doc.originalName === req.file.originalname
    );
    
    if (existingDoc) {
      // Delete the old file
      const oldFilePath = path.join(__dirname, "../uploads/documents", existingDoc.storedName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      // Remove the old document entry
      family.documents = family.documents.filter(
        doc => doc.originalName !== req.file.originalname
      );
    }

    const documentEntry = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: `/uploads/documents/${req.file.filename}`,
      uploadedAt: new Date(),
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    family.documents.push(documentEntry);
    await family.save();

    // Get updated family without password hash
    const updatedFamily = await Family.findById(req.family._id).select("-passwordHash");

    res.status(201).json({
      message: "Document uploaded successfully",
      document: documentEntry,
      family: updatedFamily
    });
  } catch (err) {
    console.error("Document upload error:", err);
    
    // Clean up uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }
    
    if (err.message.includes('Invalid file type')) {
      return res.status(400).json({ 
        message: "Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, GIF, and TXT files are allowed." 
      });
    }
    
    if (err.message.includes('File too large')) {
      return res.status(400).json({ 
        message: "File too large. Maximum size is 10MB." 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to upload document" 
    });
  }
};

// ----- Download Document -----
export const downloadDocument = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!req.family || !req.family._id) {
      return res.status(401).json({ 
        message: "Authentication required" 
      });
    }

    const family = await Family.findById(req.family._id);
    if (!family) {
      return res.status(404).json({ 
        message: "Family not found" 
      });
    }

    const doc = family.documents.find((d) => d.storedName === filename);
    if (!doc) {
      return res.status(404).json({ 
        message: "Document not found in your uploads" 
      });
    }

    const filePath = path.join(__dirname, "../uploads/documents", doc.storedName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        message: "File does not exist on server" 
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.setHeader('Content-Length', doc.fileSize || fs.statSync(filePath).size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error("File stream error:", error);
      res.status(500).json({ 
        message: "Error downloading file" 
      });
    });

  } catch (err) {
    console.error("Document download error:", err);
    res.status(500).json({ 
      message: "Failed to download document" 
    });
  }
};

// ----- Delete Document -----
export const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;

    if (!req.family || !req.family._id) {
      return res.status(401).json({ 
        message: "Authentication required" 
      });
    }

    const family = await Family.findById(req.family._id);
    if (!family) {
      return res.status(404).json({ 
        message: "Family not found" 
      });
    }

    const docIndex = family.documents.findIndex(
      (d) => d._id.toString() === docId
    );
    
    if (docIndex === -1) {
      return res.status(404).json({ 
        message: "Document not found" 
      });
    }

    const doc = family.documents[docIndex];
    const filePath = path.join(__dirname, "../uploads/documents", doc.storedName);

    // Delete physical file
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileError) {
        console.error("Error deleting physical file:", fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Remove from database
    family.documents.splice(docIndex, 1);
    await family.save();

    // Get updated family without password hash
    const updatedFamily = await Family.findById(req.family._id).select("-passwordHash");

    res.json({ 
      message: "Document deleted successfully", 
      family: updatedFamily 
    });
  } catch (err) {
    console.error("Document deletion error:", err);
    res.status(500).json({ 
      message: "Failed to delete document" 
    });
  }
};

// ----- Delete Tax Record -----
export const deleteTax = async (req, res) => {
  try {
    const { taxId } = req.params;

    if (!req.family || !req.family._id) {
      return res.status(401).json({ 
        message: "Authentication required" 
      });
    }

    const family = await Family.findById(req.family._id);
    if (!family) {
      return res.status(404).json({ 
        message: "Family not found" 
      });
    }

    const originalLength = family.taxHistory.length;
    family.taxHistory = family.taxHistory.filter(
      (tax) => tax._id.toString() !== taxId
    );

    if (family.taxHistory.length === originalLength) {
      return res.status(404).json({ 
        message: "Tax record not found" 
      });
    }

    await family.save();

    // Get updated family without password hash
    const updatedFamily = await Family.findById(req.family._id).select("-passwordHash");

    res.json({ 
      message: "Tax record deleted successfully", 
      family: updatedFamily 
    });
  } catch (err) {
    console.error("Tax deletion error:", err);
    res.status(500).json({ 
      message: "Failed to delete tax record" 
    });
  }
};

// ----- Update Family Profile -----
export const updateProfile = async (req, res) => {
  try {
    const { leaderName, email, members, address, phone } = req.body;

    if (!req.family || !req.family._id) {
      return res.status(401).json({ 
        message: "Authentication required" 
      });
    }

    const family = await Family.findById(req.family._id);
    if (!family) {
      return res.status(404).json({ 
        message: "Family not found" 
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== family.email) {
      const existingFamily = await Family.findOne({ 
        email: email.trim().toLowerCase(),
        _id: { $ne: req.family._id }
      });
      
      if (existingFamily) {
        return res.status(400).json({ 
          message: "Email already registered by another family" 
        });
      }
      family.email = email.trim().toLowerCase();
    }

    // Update other fields
    if (leaderName) family.leaderName = leaderName.trim();
    if (address) family.address = address.trim();
    if (phone) family.phone = phone.trim();
    
    // Update members
    if (members !== undefined) {
      let membersArray = [];
      if (Array.isArray(members)) {
        membersArray = members.filter(member => member.trim() !== '');
      } else if (typeof members === 'string') {
        membersArray = members.split(',').map(member => member.trim()).filter(member => member !== '');
      }
      family.members = membersArray;
    }

    await family.save();

    // Return updated family without password hash
    const updatedFamily = await Family.findById(req.family._id).select("-passwordHash");

    res.json({
      message: "Profile updated successfully",
      family: updatedFamily
    });
  } catch (err) {
    console.error("Profile update error:", err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to update profile" 
    });
  }
};