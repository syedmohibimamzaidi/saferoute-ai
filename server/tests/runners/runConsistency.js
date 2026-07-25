import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, sleep } from "./lib/cli.js";
import { writeReport } from "./lib/report.js";

dotenv.config();
const { analyzeMessage } = await import("../../services/llmService.js");

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, "..", "fixtures");
const scenarios = JSON.parse(
  readFileSync(join(fixtureDir, "scenarios.json"), "utf8"),
);
const config = JSON.parse(
  readFileSync(join(fixtureDir, "consistency.json"), "utf8"),
);

function sameSet(values) {
  return new Set(values).size === 1;
}

async function main() {
  const args = parseArgs();
  if (args.list) {
    for (const id of config.scenarioIds) {
      const item = scenarios.find((scenario) => scenario.id === id);
      console.log(`${id} ${item?.title || "Unknown"}`);
    }
    return;
  }

  const ids = args.id ? [String(args.id).toUpperCase()] : config.scenarioIds;
  const runs = Number(args.runs || config.defaultRuns || 3);
  const delayMs = Number(args.delay || process.env.EVAL_DELAY_MS || 500);
  const records = [];

  for (const id of ids) {
    const testCase = scenarios.find((scenario) => scenario.id === id);
    if (!testCase) throw new Error(`Unknown consistency scenario: ${id}`);

    console.log(`\n${id} — ${testCase.title}`);
    const outputs = [];
    for (let run = 1; run <= runs; run += 1) {
      console.log(`  Run ${run}/${runs}`);
      const result = await analyzeMessage(testCase.input, testCase.categoryHint);
      outputs.push(result);
      if (run < runs && delayMs > 0) await sleep(delayMs);
    }

    const categories = outputs.map((item) => item.category);
    const riskLevels = outputs.map((item) => item.riskLevel);
    const allGroundingValid = outputs.every((item) =>
      (item.matchedPatterns || []).every((patternId) =>
        (item._meta?.retrievedPatterns || []).includes(patternId),
      ),
    );

    const assessment = {
      categoryStable: sameSet(categories),
      riskLevelStable: sameSet(riskLevels),
      groundingIntegrityStable: allGroundingValid,
      categories,
      riskLevels,
      displayedPatterns: outputs.map((item) => item.matchedPatterns),
      retrievedPatterns: outputs.map((item) => item._meta?.retrievedPatterns || []),
    };
    assessment.pass =
      assessment.categoryStable &&
      assessment.riskLevelStable &&
      assessment.groundingIntegrityStable;

    console.log(`  Category stable: ${assessment.categoryStable}`);
    console.log(`  Risk band stable: ${assessment.riskLevelStable}`);
    console.log(`  Grounding valid: ${assessment.groundingIntegrityStable}`);

    records.push({ testCase, runs: outputs, assessment });
    if (delayMs > 0) await sleep(delayMs);
  }

  const report = {
    runAt: new Date().toISOString(),
    requestedRuns: runs,
    records,
    passed: records.filter((item) => item.assessment.pass).length,
    failed: records.filter((item) => !item.assessment.pass).length,
  };
  const paths = writeReport("consistency", args.id || "all", report);
  console.log(`\nReport: ${paths.jsonPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
