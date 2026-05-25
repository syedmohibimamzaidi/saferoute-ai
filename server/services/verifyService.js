// services/verifyService.js
// Verifies an immigration consultant against the CICC-style register.
// Supports lookup by RCIC number (exact) or by name (exact + fuzzy).
// Pure logic — no LLM, no network.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "data", "ciccConsultants.json");

const register = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const CONSULTANTS = register.consultants;

const RCIC_PATTERN = /^R\d{6,7}$/i;

function normalizeName(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "") // drop punctuation, apostrophes, digits
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Levenshtein distance — small inputs only, fine for name matching.
 */
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

/**
 * Build a user-facing verdict from a register entry (or lack of one).
 */
function buildVerdict(entry, query) {
  if (!entry) {
    return {
      status: "not_found",
      verdict: "Not found in the register",
      detail: `No consultant matching "${query}" was found. Anyone charging a fee to represent you for Canadian immigration MUST be on the CICC register. Treat an unlisted "consultant" as a serious red flag.`,
      consultant: null,
    };
  }

  if (entry.status === "active") {
    return {
      status: "verified_active",
      verdict: "Verified — licensed and in good standing",
      detail: `${entry.fullName} (${entry.rcicNumber}) is an active ${entry.designation} based in ${entry.city}, ${entry.province}. They are authorized to provide paid immigration advice.`,
      consultant: entry,
    };
  }

  // suspended or revoked
  return {
    status: "verified_inactive",
    verdict:
      entry.status === "suspended"
        ? "Found — but currently SUSPENDED"
        : "Found — but licence REVOKED",
    detail: `${entry.fullName} (${entry.rcicNumber}) appears in the register but their licence status is "${entry.status}". They are NOT currently authorized to represent you. Do not proceed.`,
    consultant: entry,
  };
}

/**
 * Verify a consultant by RCIC number or name.
 *
 * @param {string} query - an RCIC number ("R512345") or a full name
 * @returns {object} verdict object
 */
export function verifyConsultant(query) {
  const raw = (query || "").trim();
  if (raw.length === 0) {
    return {
      status: "invalid",
      verdict: "No query provided",
      detail: "Enter a consultant's name or RCIC number to verify.",
      consultant: null,
    };
  }

  // --- Path 1: looks like an RCIC number → exact match ---
  if (RCIC_PATTERN.test(raw)) {
    const match = CONSULTANTS.find(
      (c) => c.rcicNumber.toLowerCase() === raw.toLowerCase(),
    );
    return buildVerdict(match, raw);
  }

  // --- Path 2: treat as a name ---
  const normQuery = normalizeName(raw);

  // 2a. Exact normalized name match.
  const exact = CONSULTANTS.find(
    (c) => normalizeName(c.fullName) === normQuery,
  );
  if (exact) return buildVerdict(exact, raw);

  // 2b. Fuzzy match — tolerate small typos.
  let best = null;
  let bestDist = Infinity;
  for (const c of CONSULTANTS) {
    const dist = editDistance(normQuery, normalizeName(c.fullName));
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  // Accept fuzzy match only if it's close relative to the name length.
  if (best && bestDist <= Math.max(2, Math.floor(normQuery.length * 0.25))) {
    const result = buildVerdict(best, raw);
    result.fuzzy = true;
    result.detail =
      `Closest match found (you searched "${raw}"). ` + result.detail;
    return result;
  }

  return buildVerdict(null, raw);
}

export function getRegisterInfo() {
  return {
    registerName: register.registerName,
    note: register.note,
    count: CONSULTANTS.length,
  };
}
