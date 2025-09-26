import express from "express";
import {
  loginAdmin,
  getAllFamilies,
  updateFamilyApproval,
  updateTaxAmount,
  createEvent,
  getEvents,
  deleteEvent,
} from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/login", loginAdmin);
router.use(protectAdmin);

router.get("/families", getAllFamilies);
router.post("/families/approve", updateFamilyApproval);
router.post("/families/tax", updateTaxAmount);

router.post("/events", createEvent);
router.get("/events", getEvents);
router.delete("/events/:id", deleteEvent);

export default router;
