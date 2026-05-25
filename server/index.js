// index.js — Express app entry point for SafeRoute AI backend.
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

const { default: analyzeRouter } = await import("./routes/analyze.js");
const { default: verifyRouter } = await import("./routes/verify.js");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // open CORS is fine for a hackathon; lock down later if needed
app.use(express.json({ limit: "1mb" }));

// Health check — handy for confirming the server is alive.
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "saferoute-ai" });
});

// Core routes
app.use("/api/analyze", analyzeRouter);
app.use("/api/verify", verifyRouter);

// Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`SafeRoute AI backend running on http://localhost:${PORT}`);
});
