import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { askChoice, createPrompt, parseArgs, sleep } from "./lib/cli.js";
import { evaluateResult } from "./lib/evaluate.js";
import { checkLine, writeReport } from "./lib/report.js";

dotenv.config();
const { analyzeMessage } = await import("../../services/llmService.js");

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, "..", "fixtures");
const scenarios = JSON.parse(
  readFileSync(join(fixtureDir, "scenarios.json"), "utf8"),
);
const injections = JSON.parse(
  readFileSync(join(fixtureDir, "promptInjection.json"), "utf8"),
);
const allCases = [...scenarios, ...injections];

function listCases(cases = allCases) {
  for (const item of cases) {
    console.log(`${item.id.padEnd(4)} ${item.group.padEnd(11)} ${item.title}`);
  }
}

function selectCases(args) {
  if (args.id) {
    const found = allCases.find(
      (item) => item.id.toLowerCase() === String(args.id).toLowerCase(),
    );
    if (!found) throw new Error(`Unknown case ID: ${args.id}`);
    return [found];
  }

  if (args.group) {
    const group = String(args.group).toLowerCase();
    if (group === "scenario") return scenarios;
    if (group === "injection") return injections;
    const selected = allCases.filter((item) => item.group === group);
    if (selected.length === 0) throw new Error(`Unknown group: ${group}`);
    return selected;
  }

  return [];
}

async function collectManualReview(rl) {
  const concepts = await askChoice(
    rl,
    "Did the explanation identify the important warning signs? [y/n/s]: ",
    ["y", "n", "s"],
  );
  const advice = await askChoice(
    rl,
    "Were the recommended steps safe and actionable? [y/n/s]: ",
    ["y", "n", "s"],
  );
  const invented = await askChoice(
    rl,
    "Did the response invent unsupported official facts? [y/n/s]: ",
    ["y", "n", "s"],
  );
  const notes = await rl.question("Optional reviewer notes: ");

  return {
    warningSignsPass: concepts === "y" ? true : concepts === "n" ? false : null,
    safeAdvicePass: advice === "y" ? true : advice === "n" ? false : null,
    inventedFactsPass:
      invented === "n" ? true : invented === "y" ? false : null,
    notes: notes.trim(),
  };
}

function markdownFor(record) {
  const { testCase, result, evaluation, manualReview, error } = record;
  const lines = [
    `# ${testCase.id} — ${testCase.title}`,
    "",
    `- Group: ${testCase.group}`,
    `- Ground truth: ${testCase.groundTruth}`,
    `- Automatic result: ${evaluation?.autoPass ? "PASS" : "FAIL"}`,
    "",
    "## Input",
    "",
    testCase.input,
    "",
  ];

  if (error) {
    lines.push("## Error", "", error, "");
    return lines.join("\n") + "\n";
  }

  lines.push("## Automatic checks", "");
  lines.push(...evaluation.checks.map(checkLine), "");
  lines.push(
    "## Output",
    "",
    "```json",
    JSON.stringify(result, null, 2),
    "```",
    "",
  );
  if (manualReview) {
    lines.push(
      "## Manual review",
      "",
      `- Warning signs: ${String(manualReview.warningSignsPass)}`,
      `- Safe advice: ${String(manualReview.safeAdvicePass)}`,
      `- No invented facts: ${String(manualReview.inventedFactsPass)}`,
      `- Notes: ${manualReview.notes || "None"}`,
      "",
    );
  }
  return lines.join("\n") + "\n";
}

async function main() {
  const args = parseArgs();
  if (args.list) {
    listCases();
    return;
  }

  let selected = selectCases(args);
  let rl = null;

  if (selected.length === 0) {
    if (!process.stdin.isTTY) {
      throw new Error("Provide --id CASE_ID or --group GROUP --all.");
    }
    listCases();
    rl = createPrompt();
    const id = (await rl.question("Enter the case ID to run: ")).trim();
    selected = selectCases({ id });
  }

  if (selected.length > 1 && !args.all) {
    throw new Error(
      "Group runs require --all to prevent accidental API spend.",
    );
  }

  const interactive = !args["non-interactive"] && process.stdin.isTTY;
  if (interactive && !rl) rl = createPrompt();
  const delayMs = Number(args.delay || process.env.EVAL_DELAY_MS || 500);
  const batch = [];

  for (const [index, testCase] of selected.entries()) {
    console.log(
      `\n[${index + 1}/${selected.length}] ${testCase.id} — ${testCase.title}`,
    );
    console.log(testCase.input);

    const record = {
      runAt: new Date().toISOString(),
      testCase,
      result: null,
      evaluation: null,
      manualReview: null,
      error: null,
    };

    try {
      const result = await analyzeMessage(
        testCase.input,
        testCase.categoryHint,
      );
      const evaluation = evaluateResult(testCase, result);
      record.result = result;
      record.evaluation = evaluation;

      console.log(`Category: ${result.category}`);
      console.log(`Risk: ${result.riskLevel} (${result.riskScore})`);
      console.log(
        `Retrieved: ${result._meta?.retrievedPatterns?.join(", ") || "none"}`,
      );
      console.log(`Displayed: ${result.matchedPatterns?.join(", ") || "none"}`);
      console.log("\nSummary:");
      console.log(result.summary || "None");

      console.log("\nExplanation:");
      console.log(result.explanation || "None");

      console.log("\nRed flags:");
      if (result.redFlags?.length) {
        for (const item of result.redFlags) {
          console.log(`- ${item.flag}: ${item.explanation}`);
        }
      } else {
        console.log("None");
      }

      console.log("\nRecommended steps:");
      if (result.recommendedSteps?.length) {
        for (const step of result.recommendedSteps) {
          console.log(`- ${step}`);
        }
      } else {
        console.log("None");
      }

      console.log(`Automatic checks: ${evaluation.autoPass ? "PASS" : "FAIL"}`);
      for (const check of evaluation.checks.filter((item) => !item.pass)) {
        console.log(
          `  FAIL: ${check.name}${check.detail ? ` — ${check.detail}` : ""}`,
        );
      }

      if (interactive) {
        record.manualReview = await collectManualReview(rl);
      }
    } catch (error) {
      record.error = error instanceof Error ? error.message : String(error);
      console.error(`ERROR: ${record.error}`);
    }

    const paths = writeReport(
      testCase.group === "injection" ? "injection" : "scenarios",
      testCase.id,
      record,
      markdownFor(record),
    );
    console.log(`Report: ${paths.mdPath || paths.jsonPath}`);
    batch.push(record);

    if (index < selected.length - 1 && delayMs > 0) await sleep(delayMs);
  }

  if (selected.length > 1) {
    const passed = batch.filter((item) => item.evaluation?.autoPass).length;
    const summary = {
      runAt: new Date().toISOString(),
      caseIds: selected.map((item) => item.id),
      automaticPassed: passed,
      automaticFailed: selected.length - passed,
      records: batch,
    };
    const paths = writeReport("batches", `batch-${selected[0].group}`, summary);
    console.log(`\nBatch summary: ${paths.jsonPath}`);
  }

  await rl?.close();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
