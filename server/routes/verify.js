// routes/verify.js
// POST /api/verify — verifies an immigration consultant against the register.

import express from "express";
import {
  verifyConsultant,
  getRegisterInfo,
} from "../services/verifyService.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { query } = req.body ?? {};

  if (typeof query !== "string" || query.trim().length === 0) {
    return res
      .status(400)
      .json({
        error: "Missing 'query' — provide a consultant name or RCIC number.",
      });
  }
  if (query.length > 120) {
    return res.status(400).json({ error: "Query is too long." });
  }

  const result = verifyConsultant(query);
  return res.status(200).json({
    ...result,
    register: getRegisterInfo(),
  });
});

export default router;
