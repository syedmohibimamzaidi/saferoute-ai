import test from "node:test";
import assert from "node:assert/strict";
import { evaluateResult } from "../runners/lib/evaluate.js";

const testCase = {
  groundTruth: "scam",
  expectedCategories: ["cra"],
  expectedRiskLevels: ["high"],
  expectedPatternIds: ["cra-001"],
  requiredConcepts: [],
  forbiddenOutcomeTerms: [],
};

function result(overrides = {}) {
  return {
    riskScore: 90,
    riskLevel: "high",
    category: "cra",
    confidence: "high",
    summary: "Suspicious CRA threat.",
    redFlags: [{ flag: "Threat", explanation: "Immediate arrest threat." }],
    matchedPatterns: ["cra-001"],
    newcomerContext: "",
    recommendedSteps: ["Do not pay."],
    explanation: "The message uses threats and unusual payment methods.",
    _meta: { retrievedPatterns: ["cra-001"] },
    ...overrides,
  };
}

function groundingCheck(evaluation) {
  return evaluation.checks.find(
    (check) => check.name === "Displayed evidence is a subset of retrieved evidence",
  );
}

test("evaluation accepts displayed IDs that were actually retrieved", () => {
  const check = groundingCheck(evaluateResult(testCase, result()));
  assert.equal(check?.pass, true);
});

test("evaluation rejects a model-invented pattern ID", () => {
  const check = groundingCheck(
    evaluateResult(
      testCase,
      result({ matchedPatterns: ["cra-001", "invented-999"] }),
    ),
  );
  assert.equal(check?.pass, false);
});

test("evaluation rejects displayed evidence when retrieval was empty", () => {
  const check = groundingCheck(
    evaluateResult(
      testCase,
      result({
        matchedPatterns: ["cra-001"],
        _meta: { retrievedPatterns: [] },
      }),
    ),
  );
  assert.equal(check?.pass, false);
});
