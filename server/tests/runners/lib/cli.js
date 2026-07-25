import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

export function createPrompt() {
  return readline.createInterface({ input, output });
}

export async function askChoice(rl, question, validChoices) {
  const normalized = new Set(validChoices.map((v) => v.toLowerCase()));
  while (true) {
    const answer = (await rl.question(question)).trim().toLowerCase();
    if (normalized.has(answer)) return answer;
    console.log(`Enter one of: ${validChoices.join(", ")}`);
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
