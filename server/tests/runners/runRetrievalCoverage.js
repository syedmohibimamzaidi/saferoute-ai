import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { retrievePatterns } from "../../services/groundingService.js";
import { parseArgs } from "./lib/cli.js";
import { writeReport } from "./lib/report.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, "..", "fixtures");
const cases = [
  ...JSON.parse(readFileSync(join(fixtureDir, "scenarios.json"), "utf8")),
  ...JSON.parse(readFileSync(join(fixtureDir, "promptInjection.json"), "utf8")),
];

function choose(args) {
  if (args.id) {
    const selected = cases.filter(
      (item) => item.id.toLowerCase() === String(args.id).toLowerCase(),
    );
    if (selected.length === 0) throw new Error(`Unknown case: ${args.id}`);
    return selected;
  }
  if (args.group) {
    const group = String(args.group).toLowerCase();
    if (group === "scenario") return cases.filter((item) => item.group !== "injection");
    if (group === "injection") return cases.filter((item) => item.group === "injection");
    const selected = cases.filter((item) => item.group === group);
    if (selected.length === 0) throw new Error(`Unknown group: ${group}`);
    return selected;
  }
  return [];
}

async function main() {
  const args = parseArgs();
  if (args.list) {
    for (const item of cases) console.log(`${item.id} ${item.group} ${item.title}`);
    return;
  }
  const selected = choose(args);
  if (selected.length === 0) {
    console.log("Use --id S01, or --group direct --all, or --group scenario --all.");
    return;
  }
  if (selected.length > 1 && !args.all) {
    throw new Error("Group runs require --all.");
  }

  const results = selected.map((testCase) => {
    const retrieved = retrievePatterns(testCase.input, testCase.categoryHint);
    const ids = retrieved.map((item) => item.id);
    const expectedFound =
      testCase.expectedPatternIds.length === 0 ||
      testCase.expectedPatternIds.some((id) => ids.includes(id));
    const result = {
      testCase,
      retrieved: retrieved.map((item) => ({
        id: item.id,
        score: item._score,
        matchedKeywords: item._matchedKeywords,
      })),
      expectedFound,
    };
    console.log(
      `${expectedFound ? "PASS" : "FAIL"} ${testCase.id} — ${ids.join(", ") || "none"}`,
    );
    return result;
  });

  const report = {
    runAt: new Date().toISOString(),
    results,
    passed: results.filter((item) => item.expectedFound).length,
    failed: results.filter((item) => !item.expectedFound).length,
  };
  const paths = writeReport("retrieval", args.id || args.group || "selection", report);
  console.log(`Report: ${paths.jsonPath}`);
  if (report.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
