import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const testsDir = dirname(fileURLToPath(import.meta.url));
const packagePath = join(testsDir, "..", "package.json");
const backupPath = join(testsDir, "..", "package.json.before-tests.backup");

const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
pkg.scripts ||= {};

const scripts = {
  test: "node --test tests/unit/*.test.js tests/integration/*.test.js",
  "test:grounding": "node --test tests/unit/groundingService.test.js",
  "test:schema": "node --test tests/unit/schema.test.js",
  "test:verify": "node --test tests/unit/verifyService.test.js",
  "test:grounding-contract": "node --test tests/unit/groundingContract.test.js",
  "test:routes": "node --test tests/integration/routes.test.js",
  "eval:list": "node tests/runners/runLlmEvaluation.js --list",
  "eval:scenario": "node tests/runners/runLlmEvaluation.js",
  "eval:scenarios": "node tests/runners/runLlmEvaluation.js --group scenario --all",
  "eval:injection": "node tests/runners/runLlmEvaluation.js --group injection --all",
  "eval:consistency": "node tests/runners/runConsistency.js",
  "eval:ui": "node tests/runners/runManualChecklist.js",
  "eval:deployment": "node tests/runners/runDeploymentSmoke.js",
  "eval:retrieval": "node tests/runners/runRetrievalCoverage.js"
};

writeFileSync(backupPath, JSON.stringify(pkg, null, 2) + "\n");
Object.assign(pkg.scripts, scripts);
writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");

console.log("SafeRoute test scripts added to server/package.json.");
console.log(`Backup written to: ${backupPath}`);
console.log("Next: npm test");
