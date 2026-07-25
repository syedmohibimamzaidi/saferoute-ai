import test from "node:test";
import assert from "node:assert/strict";
import { validateAnalysis } from "../../utils/schema.js";

function validRaw(overrides = {}) {
  return {
    riskScore: 50,
    riskLevel: "high",
    category: "job",
    confidence: "medium",
    summary: "A summary",
    redFlags: [{ flag: "Fee", explanation: "Money is requested." }],
    matchedPatterns: ["job-002"],
    newcomerContext: "",
    recommendedSteps: ["Do not pay."],
    explanation: "This is suspicious.",
    ...overrides,
  };
}

test("score 33 normalizes to low", () => {
  assert.equal(validateAnalysis(validRaw({ riskScore: 33 })).riskLevel, "low");
});

test("score 34 normalizes to medium", () => {
  assert.equal(validateAnalysis(validRaw({ riskScore: 34 })).riskLevel, "medium");
});

test("score 66 normalizes to medium", () => {
  assert.equal(validateAnalysis(validRaw({ riskScore: 66 })).riskLevel, "medium");
});

test("score 67 normalizes to high", () => {
  assert.equal(validateAnalysis(validRaw({ riskScore: 67 })).riskLevel, "high");
});

test("invalid category is rejected", () => {
  assert.throws(() => validateAnalysis(validRaw({ category: "other" })));
});

test("score above 100 is rejected", () => {
  assert.throws(() => validateAnalysis(validRaw({ riskScore: 101 })));
});

test("missing required fields are rejected", () => {
  const raw = validRaw();
  delete raw.summary;
  assert.throws(() => validateAnalysis(raw));
});

test("malformed red flags are rejected", () => {
  assert.throws(() =>
    validateAnalysis(validRaw({ redFlags: [{ flag: "Missing explanation" }] })),
  );
});

test("at least one recommended step is required", () => {
  assert.throws(() => validateAnalysis(validRaw({ recommendedSteps: [] })));
});
