import { parseArgs } from "./lib/cli.js";
import { writeReport } from "./lib/report.js";

const PRESETS = {
  D06: {
    name: "CRA preset",
    text: "This is the CRA. A warrant has been issued for your arrest due to unpaid taxes. Pay $2,400 in gift cards immediately to avoid deportation.",
    userCategory: "cra",
    expectedRisk: "high",
  },
  D07: {
    name: "Job preset",
    text: "Congratulations! You're hired as a remote admin assistant — no interview needed. We'll mail you a cheque for equipment. Just deposit it and e-transfer $500 to our vendor to get started.",
    userCategory: "job",
    expectedRisk: "high",
  },
  D08: {
    name: "Immigration preset",
    text: "Pay $5,000 cash and I guarantee your PR in 3 months. I have a contact inside IRCC who personally handles my files. Limited spots — decide today.",
    userCategory: "immigration",
    expectedRisk: "high",
  },
  D09: {
    name: "Legitimate preset",
    text: "Hi, this is Sarah from Bright Smiles Dental confirming your cleaning appointment on Tuesday at 2:00 PM. Please reply YES to confirm or call us to reschedule.",
    userCategory: "",
    expectedRisk: "low",
  },
};

function smokeTests(frontendUrl) {
  return [
    ...(frontendUrl
      ? [{ id: "D01", name: "Frontend loads", kind: "frontend" }]
      : []),
    { id: "D02", name: "Backend health", kind: "health" },
    { id: "D03", name: "Unknown route returns 404", kind: "404" },
    { id: "D04", name: "Analyze rejects empty input", kind: "empty" },
    { id: "D05", name: "Consultant verification works", kind: "verify" },
    ...Object.entries(PRESETS).map(([id, value]) => ({ id, kind: "preset", ...value })),
    { id: "D10", name: "Analyze rejects oversized input", kind: "oversized" },
  ];
}

async function execute(test, backendUrl, frontendUrl) {
  if (test.kind === "frontend") {
    const res = await fetch(frontendUrl);
    const html = await res.text();
    return {
      pass: res.ok && !html.includes("sk-"),
      status: res.status,
      detail: res.ok ? "Frontend returned HTML; no obvious sk- secret in HTML." : "Frontend request failed.",
    };
  }
  if (test.kind === "health") {
    const res = await fetch(`${backendUrl}/api/health`);
    const body = await res.json();
    return { pass: res.status === 200 && body.status === "ok", status: res.status, body };
  }
  if (test.kind === "404") {
    const res = await fetch(`${backendUrl}/api/not-real`);
    return { pass: res.status === 404, status: res.status, body: await res.json() };
  }
  if (test.kind === "empty") {
    const res = await fetch(`${backendUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });
    return { pass: res.status === 400, status: res.status, body: await res.json() };
  }
  if (test.kind === "verify") {
    const res = await fetch(`${backendUrl}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "R512345" }),
    });
    const body = await res.json();
    return {
      pass: res.status === 200 && body.status === "verified_active",
      status: res.status,
      body,
    };
  }
  if (test.kind === "preset") {
    const res = await fetch(`${backendUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: test.text, userCategory: test.userCategory }),
    });
    const body = await res.json();
    const groundingValid = (body.matchedPatterns || []).every((id) =>
      (body._meta?.retrievedPatterns || []).includes(id),
    );
    return {
      pass:
        res.status === 200 &&
        body.riskLevel === test.expectedRisk &&
        groundingValid,
      status: res.status,
      body,
      groundingValid,
    };
  }
  if (test.kind === "oversized") {
    const res = await fetch(`${backendUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "a".repeat(10001) }),
    });
    return { pass: res.status === 400, status: res.status, body: await res.json() };
  }
  throw new Error(`Unknown test kind: ${test.kind}`);
}

async function main() {
  const args = parseArgs();
  const backendUrl = String(
    args.backend || process.env.BACKEND_URL || "http://localhost:3001",
  ).replace(/\/$/, "");
  const frontendUrl = args.frontend || process.env.FRONTEND_URL || "";
  const tests = smokeTests(frontendUrl);

  if (args.list) {
    for (const test of tests) console.log(`${test.id} ${test.name}`);
    return;
  }

  let selected;
  if (args.id) {
    selected = tests.filter(
      (test) => test.id.toLowerCase() === String(args.id).toLowerCase(),
    );
    if (selected.length === 0) throw new Error(`Unknown smoke test: ${args.id}`);
  } else if (args.all) {
    selected = tests;
  } else {
    console.log("Use --id D02 to run one smoke test, or --all to run all.");
    return;
  }

  const results = [];
  for (const test of selected) {
    console.log(`\n${test.id} — ${test.name}`);
    try {
      const result = await execute(test, backendUrl, frontendUrl);
      console.log(result.pass ? "PASS" : "FAIL");
      results.push({ test, ...result });
    } catch (error) {
      console.log(`FAIL — ${error.message}`);
      results.push({ test, pass: false, error: error.message });
    }
  }

  const report = {
    runAt: new Date().toISOString(),
    backendUrl,
    frontendUrl: frontendUrl || null,
    results,
    passed: results.filter((item) => item.pass).length,
    failed: results.filter((item) => !item.pass).length,
  };
  const paths = writeReport("deployment", args.id || "all", report);
  console.log(`\nReport: ${paths.jsonPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
