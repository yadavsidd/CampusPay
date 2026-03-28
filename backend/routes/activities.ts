import express from "express";
import { db } from "../db/database";

const router = express.Router();

router.get("/activities", (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const activities = db.prepare("SELECT * FROM activities ORDER BY created_at DESC LIMIT ?").all(limit);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

export default router;
