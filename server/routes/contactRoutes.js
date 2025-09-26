// server/routes/contactRoutes.js
import express from "express";
const router = express.Router();

// Example contact form route
router.post("/", (req, res) => {
  const { name, email, message } = req.body;
  // TODO: handle sending email here
  res.json({ success: true, msg: "Message received" });
});

export default router;
