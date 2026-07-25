import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { askChoice, createPrompt, parseArgs } from "./lib/cli.js";
import { writeReport } from "./lib/report.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const checklist = JSON.parse(
  readFileSync(join(__dirname, "..", "fixtures", "uiChecklist.json"), "utf8"),
);

async function main() {
  const args = parseArgs();
  if (args.list) {
    for (const item of checklist) console.log(`${item.id} ${item.title}`);
    return;
  }

  let selected;
  if (args.id) {
    selected = checklist.filter(
      (item) => item.id.toLowerCase() === String(args.id).toLowerCase(),
    );
    if (selected.length === 0) throw new Error(`Unknown checklist ID: ${args.id}`);
  } else if (args.all) {
    selected = checklist;
  } else {
    console.log("Use --id UI01 to run one check, or --all to run all checks.");
    return;
  }

  if (!process.stdin.isTTY) {
    throw new Error("Manual checklist requires an interactive terminal.");
  }

  const rl = createPrompt();
  const results = [];
  for (const item of selected) {
    console.log(`\n${item.id} — ${item.title}`);
    item.steps.forEach((step, index) => console.log(`  ${index + 1}. ${step}`));
    console.log(`Expected: ${item.expected}`);

    const outcome = await askChoice(
      rl,
      "Result [p=pass/f=fail/s=skip]: ",
      ["p", "f", "s"],
    );
    const notes = await rl.question("Notes: ");
    results.push({
      ...item,
      outcome: outcome === "p" ? "pass" : outcome === "f" ? "fail" : "skip",
      notes: notes.trim(),
    });
  }
  await rl.close();

  const report = {
    runAt: new Date().toISOString(),
    results,
    passed: results.filter((item) => item.outcome === "pass").length,
    failed: results.filter((item) => item.outcome === "fail").length,
    skipped: results.filter((item) => item.outcome === "skip").length,
  };
  const paths = writeReport("ui", args.id || "all", report);
  console.log(`Report: ${paths.jsonPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
