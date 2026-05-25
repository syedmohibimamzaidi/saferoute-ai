// routes/analyze.js
// POST /api/analyze — grounds, analyzes with the LLM, returns structured JSON.

import express from "express";
import { analyzeMessage } from "../services/llmService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { text, userCategory } = req.body ?? {};

  // Input guards.
  if (typeof text !== "string" || text.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "Missing or empty 'text' field in request body." });
  }
  if (text.length > 10000) {
    return res.status(400).json({
      error: "Input text is too long. Please paste a shorter message.",
    });
  }

  try {
    const analysis = await analyzeMessage(text, userCategory || "");
    return res.status(200).json(analysis);
  } catch (err) {
    console.error("[/api/analyze] error:", err.message);
    return res.status(502).json({
      error: "Analysis service is temporarily unavailable. Please try again.",
    });
  }
});

export default router;
