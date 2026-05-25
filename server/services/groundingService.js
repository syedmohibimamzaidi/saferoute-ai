// services/groundingService.js
// Retrieval layer: given pasted text (and an optional category hint),
// return the most relevant Canadian scam patterns from the local dataset.
// Pure scoring logic — no LLM, no network. Tunable and testable.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "data", "scamPatterns.json");

// Load once at startup. The dataset is static during a run.
const dataset = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const PATTERNS = dataset.patterns;

// --- Scoring weights -------------------------------------------------------
// Tweak these if retrieval feels off. Keyword hits are the main signal;
// category hint and indicator phrasing are softer boosts.
const WEIGHTS = {
  keyword: 3, // each dataset keyword found in the text
  indicator: 2, // each indicator phrase loosely matched in the text
  categoryHint: 4, // user told us the category and it matches this pattern
};

const DEFAULT_TOP_N = 4;

/**
 * Normalize text for matching: lowercase, collapse whitespace.
 */
function normalize(str) {
  return (str || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Score a single pattern against the normalized input text.
 * Returns { score, matchedKeywords } so callers can explain the match.
 */
function scorePattern(pattern, normText, userCategory) {
  let score = 0;
  const matchedKeywords = [];

  // 1. Keyword hits — the primary signal.
  for (const kw of pattern.keywords) {
    if (normText.includes(kw.toLowerCase())) {
      score += WEIGHTS.keyword;
      matchedKeywords.push(kw);
    }
  }

  // 2. Indicator phrasing — softer. We check for meaningful words from
  //    each indicator appearing in the text, not the whole phrase verbatim.
  for (const indicator of pattern.indicators) {
    const words = normalize(indicator)
      .split(" ")
      .filter((w) => w.length > 4); // skip short connective words
    if (words.length === 0) continue;
    const hits = words.filter((w) => normText.includes(w)).length;
    // Count the indicator as matched if most of its key words appear.
    if (hits / words.length >= 0.6) {
      score += WEIGHTS.indicator;
    }
  }

  // 3. Category hint from the user.
  if (userCategory && userCategory === pattern.category) {
    score += WEIGHTS.categoryHint;
  }

  return { score, matchedKeywords };
}

/**
 * Retrieve the most relevant scam patterns for a piece of text.
 *
 * @param {string} text - the pasted suspicious message
 * @param {string} [userCategory] - optional category hint from the user
 * @param {number} [topN] - max patterns to return
 * @returns {Array} ranked patterns, each with _score and _matchedKeywords
 */
export function retrievePatterns(
  text,
  userCategory = "",
  topN = DEFAULT_TOP_N,
) {
  const normText = normalize(text);
  if (normText.length === 0) return [];

  const scored = PATTERNS.map((pattern) => {
    const { score, matchedKeywords } = scorePattern(
      pattern,
      normText,
      userCategory,
    );
    return { ...pattern, _score: score, _matchedKeywords: matchedKeywords };
  });

  // Keep only patterns with a real signal, best first.
  const relevant = scored
    .filter((p) => p._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, topN);

  // Fallback: nothing matched at all. If the user gave a category hint,
  // return patterns from that category so the LLM still has some grounding.
  if (relevant.length === 0 && userCategory) {
    return scored.filter((p) => p.category === userCategory).slice(0, topN);
  }

  return relevant;
}

/**
 * Format retrieved patterns into a compact text block for prompt injection.
 * Step 5 drops this straight into the system/user prompt.
 */
export function formatPatternsForPrompt(patterns) {
  if (!patterns || patterns.length === 0) {
    return "No specific matching patterns found in the Canadian scam database.";
  }

  return patterns
    .map((p, i) => {
      return [
        `Pattern ${i + 1} [${p.id}] — ${p.title} (category: ${p.category}, severity: ${p.severity})`,
        `Description: ${p.description}`,
        `Common indicators: ${p.indicators.join("; ")}`,
        `Why it targets newcomers: ${p.whyTargetsNewcomers}`,
        `Recommended action: ${p.recommendedAction}`,
        `Source: ${p.source}`,
      ].join("\n");
    })
    .join("\n\n");
}

// Expose dataset metadata for health checks / debugging.
export function getDatasetInfo() {
  return {
    version: dataset.version,
    patternCount: PATTERNS.length,
    sources: dataset.sources,
  };
}
