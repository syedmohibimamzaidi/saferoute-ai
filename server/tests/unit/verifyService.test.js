import test from "node:test";
import assert from "node:assert/strict";
import {
  getRegisterInfo,
  verifyConsultant,
} from "../../services/verifyService.js";

test("active RCIC number is verified", () => {
  const result = verifyConsultant("R512345");
  assert.equal(result.status, "verified_active");
  assert.equal(result.consultant?.fullName, "Aisha Rahman");
});

test("suspended RCIC number produces inactive warning", () => {
  const result = verifyConsultant("R329044");
  assert.equal(result.status, "verified_inactive");
  assert.equal(result.consultant?.status, "suspended");
});

test("revoked RCIC number produces inactive warning", () => {
  const result = verifyConsultant("R287610");
  assert.equal(result.status, "verified_inactive");
  assert.equal(result.consultant?.status, "revoked");
});

test("exact full name is matched", () => {
  const result = verifyConsultant("David Chen");
  assert.equal(result.status, "verified_active");
  assert.equal(result.consultant?.rcicNumber, "R610982");
  assert.equal(result.fuzzy, undefined);
});

test("minor spelling error is clearly marked fuzzy", () => {
  const result = verifyConsultant("Aisha Raman");
  assert.equal(result.status, "verified_active");
  assert.equal(result.fuzzy, true);
});

test("unknown person is not found", () => {
  const result = verifyConsultant("Totally Unknown Person");
  assert.equal(result.status, "not_found");
  assert.equal(result.consultant, null);
});

test("RCIC matching is case-insensitive", () => {
  assert.equal(verifyConsultant("r512345").status, "verified_active");
});

test("extra whitespace is normalized", () => {
  assert.equal(
    verifyConsultant("   Aisha   Rahman   ").consultant?.rcicNumber,
    "R512345",
  );
});

test("empty direct service query returns invalid", () => {
  assert.equal(verifyConsultant(" ").status, "invalid");
});

test("register metadata states that it is a demo sample", () => {
  const info = getRegisterInfo();
  assert.equal(info.count, 8);
  assert.match(info.note, /demo|sample/i);
});
