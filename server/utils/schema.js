// utils/schema.js
// The structured response contract — now enforced with Zod.

import { z } from "zod";

export const RISK_LEVELS = ["low", "medium", "high"];
export const CONFIDENCE_LEVELS = ["low", "medium", "high"];
export const CATEGORIES = [
  "job",
  "housing",
  "immigration",
  "cra",
  "banking",
  "phishing",
  "verified-safe",
];

const redFlagSchema = z.object({
  flag: z.string().min(1),
  explanation: z.string().min(1),
});

export const analysisSchema = z.object({
  riskScore: z.number().int().min(0).max(100),
  riskLevel: z.enum(RISK_LEVELS),
  category: z.enum(CATEGORIES),
  confidence: z.enum(CONFIDENCE_LEVELS),
  summary: z.string().min(1),
  redFlags: z.array(redFlagSchema),
  matchedPatterns: z.array(z.string()),
  newcomerContext: z.string(),
  recommendedSteps: z.array(z.string().min(1)).min(1),
  explanation: z.string().min(1),
});

/**
 * Validate and normalize a raw LLM response object.
 * Throws if it doesn't match the schema. Also self-heals the
 * riskLevel/riskScore relationship in case the model is inconsistent.
 */
export function validateAnalysis(raw) {
  const parsed = analysisSchema.parse(raw);

  // Keep riskLevel consistent with riskScore regardless of what the model said.
  if (parsed.riskScore <= 33) parsed.riskLevel = "low";
  else if (parsed.riskScore <= 66) parsed.riskLevel = "medium";
  else parsed.riskLevel = "high";

  return parsed;
}
