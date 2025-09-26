import express from "express";
import Event from "../models/Event.js";
import Achievement from "../models/Achievement.js";
import Worker from "../models/Worker.js";
import History from "../models/History.js";
import Gallery from "../models/Gallery.js";

const router = express.Router();

router.get("/events", async (req, res) => {
  res.json(await Event.find());
});
router.get("/achievements", async (req, res) => res.json(await Achievement.find()));
router.get("/workers", async (req, res) => res.json(await Worker.find()));
router.get("/history", async (req, res) => res.json(await History.find()));
router.get("/gallery", async (req, res) => res.json(await Gallery.find()));

export default router;
