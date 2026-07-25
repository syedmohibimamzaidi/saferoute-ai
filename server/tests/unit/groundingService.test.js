import test from "node:test";
import assert from "node:assert/strict";
import { retrievePatterns } from "../../services/groundingService.js";

test("CRA arrest threat ranks cra-001 first", () => {
  const results = retrievePatterns(
    "CRA arrest warrant unpaid taxes pay by gift card immediately",
  );
  assert.equal(results[0]?.id, "cra-001");
});

test("deposit-before-viewing rental ranks housing-001 first", () => {
  const results = retrievePatterns(
    "Landlord is out of country. E-transfer deposit before viewing and keys will be mailed.",
  );
  assert.equal(results[0]?.id, "housing-001");
});

test("upfront job fee ranks job-002 first", () => {
  const results = retrievePatterns(
    "Pay a training fee and work permit processing fee to secure your job",
  );
  assert.equal(results[0]?.id, "job-002");
});

test("indirect certification purchase for a job ranks job-002 first", () => {
  const results = retrievePatterns(
    "The employer says I can begin Monday after I purchase their required certification package from a private payment link. They will not reimburse the cost, and the place will go to another applicant if I wait.",
  );
  assert.equal(results[0]?.id, "job-002");
});

test("results are sorted by descending score", () => {
  const results = retrievePatterns(
    "CRA tax refund claim link verify account and banking login details",
  );
  for (let i = 1; i < results.length; i += 1) {
    assert.ok(results[i - 1]._score >= results[i]._score);
  }
});

test("default retrieval returns no more than four patterns", () => {
  const results = retrievePatterns(
    "job bank account refund parcel rent deposit visa IRCC CRA link payment",
  );
  assert.ok(results.length <= 4);
});

test("empty text returns no patterns", () => {
  assert.deepEqual(retrievePatterns("   "), []);
});

test("category hint boosts patterns in that category", () => {
  const withoutHint = retrievePatterns("payment account", "");
  const withHint = retrievePatterns("payment account", "immigration");
  const maxImmigrationWithout = Math.max(
    0,
    ...withoutHint
      .filter((p) => p.category === "immigration")
      .map((p) => p._score),
  );
  const maxImmigrationWith = Math.max(
    0,
    ...withHint
      .filter((p) => p.category === "immigration")
      .map((p) => p._score),
  );
  assert.ok(maxImmigrationWith >= maxImmigrationWithout + 4);
});

test("category fallback returns patterns when text has no direct signal", () => {
  const results = retrievePatterns("completely unrelated wording", "housing");
  assert.ok(results.length > 0);
  assert.ok(results.every((p) => p.category === "housing"));
});

test("no category and no match returns an empty set", () => {
  const results = retrievePatterns("completely unrelated wording");
  assert.deepEqual(results, []);
});
