// Placeholder for server/controllers/villageController.js
// controllers/villageController.js
import Event from "../models/Event.js";
import Achievement from "../models/Achievement.js";
import Worker from "../models/Worker.js";
import History from "../models/History.js";

// 📌 Fetch all events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error });
  }
};

// 📌 Fetch all achievements
export const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find();
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: "Error fetching achievements", error });
  }
};

// 📌 Fetch all worker types
export const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching workers", error });
  }
};

// 📌 Fetch history (based on language)
export const getHistory = async (req, res) => {
  try {
    const { lang } = req.params;
    const history = await History.findOne({ language: lang });
    if (!history) return res.status(404).json({ message: "History not found" });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history", error });
  }
};
