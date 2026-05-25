// services/llmService.js
// Wraps the OpenAI call: builds the prompt, calls the model in JSON mode,
// validates the response, and retries once if validation fails.

import OpenAI from "openai";
import { retrievePatterns } from "./groundingService.js";
import { buildAnalyzePrompt } from "../prompts/analyzePrompt.js";
import { validateAnalysis } from "../utils/schema.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = "gpt-4o-mini"; // fast + cheap; good enough for the demo
const MAX_ATTEMPTS = 2;

/**
 * Analyze a suspicious message end-to-end.
 *
 * @param {string} text - the pasted message
 * @param {string} [userCategory] - optional category hint
 * @returns {Promise<object>} validated analysis matching analysisSchema
 */
export async function analyzeMessage(text, userCategory = "") {
  // 1. Ground: retrieve relevant Canadian scam patterns.
  const patterns = retrievePatterns(text, userCategory);
  const patternIds = patterns.map((p) => p.id);

  // 2. Build the grounded prompt.
  const { system, user } = buildAnalyzePrompt(text, patterns, userCategory);

  // 3. Call the model, validating the result; retry once on failure.
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.2, // low: we want consistent, careful analysis
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const rawContent = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(rawContent);
      const validated = validateAnalysis(parsed);

      // Attach which patterns were retrieved, for the demo's grounding proof.
      validated._meta = {
        retrievedPatterns: patternIds,
        model: MODEL,
        attempt,
      };
      return validated;
    } catch (err) {
      lastError = err;
      console.warn(`[llmService] attempt ${attempt} failed: ${err.message}`);
    }
  }

  // Both attempts failed — surface a clean error to the route.
  throw new Error(
    `Analysis failed after ${MAX_ATTEMPTS} attempts: ${lastError?.message}`,
  );
}
