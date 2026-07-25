import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_ROOT = join(__dirname, "..", "..", "reports");

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function writeReport(kind, name, data, markdown) {
  const dir = join(REPORT_ROOT, kind);
  mkdirSync(dir, { recursive: true });
  const base = `${timestamp()}-${name}`;
  const jsonPath = join(dir, `${base}.json`);
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n");

  let mdPath = null;
  if (markdown) {
    mdPath = join(dir, `${base}.md`);
    writeFileSync(mdPath, markdown);
  }

  return { jsonPath, mdPath };
}

export function checkLine(check) {
  return `- ${check.pass ? "PASS" : "FAIL"}: ${check.name}${
    check.detail ? ` — ${check.detail}` : ""
  }`;
}
