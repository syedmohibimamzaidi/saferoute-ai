# SafeRoute test directory

This directory is designed to be copied directly into the existing `SafeRoute/server` folder. It does not replace or duplicate the project's `client`, `server`, routes, services, data, or environment files.

After integration, the structure should be:

```text
SafeRoute/
  client/
  server/
    data/
    prompts/
    routes/
    services/
    utils/
    tests/          <-- this directory
    package.json
    index.js
```

## Setup

From `SafeRoute/server`:

```bash
node tests/install-scripts.mjs
npm install
npm test
```

The installer only adds test commands to the existing `server/package.json`. It creates `server/package.json.before-tests.backup` first.

Node.js 18 or newer is required because the suite uses the built-in test runner and `fetch`. Node.js 20 is recommended.

## What is included

- `unit/`: retrieval, schema, consultant-verification, and grounding-contract tests
- `integration/`: Express health and request-validation tests
- `fixtures/`: frozen scam, legitimate, ambiguous, injection, consistency, and UI cases
- `runners/`: live LLM evaluation, retrieval coverage, consistency, UI checklist, and deployment smoke tests
- `reports/`: generated local JSON and Markdown results; ignored by Git
- `helpers/`: test-only Express application setup

The tests do not require changes such as a separate production `app.js`. The test helper assembles the existing SafeRoute routers inside the test process.

## Deterministic tests

These do not call OpenAI:

```bash
npm test
```

Run one area at a time:

```bash
npm run test:grounding
npm run test:schema
npm run test:verify
npm run test:grounding-contract
npm run test:routes
```

The grounding-contract tests verify that the evaluation harness detects model-displayed pattern IDs that were not actually retrieved. The live scenario tests then apply that contract to real SafeRoute outputs.

## Retrieval coverage without an API call

List cases:

```bash
npm run eval:retrieval -- --list
```

Run one frozen case:

```bash
npm run eval:retrieval -- --id S01
```

Useful groups:

```bash
npm run eval:retrieval -- --group direct --all
npm run eval:retrieval -- --group paraphrased --all
npm run eval:retrieval -- --group legitimate --all
npm run eval:retrieval -- --group ambiguous --all
npm run eval:retrieval -- --group injection --all
```

## Live LLM evaluation

Ensure `server/.env` contains:

```env
OPENAI_API_KEY=your_key_here
```

List all cases:

```bash
npm run eval:list
```

Run one case:

```bash
npm run eval:scenario -- --id S01
```

Case IDs:

- `S01`–`S15`: direct scam-pattern cases
- `P01`–`P06`: harder paraphrased scam cases
- `L01`–`L06`: legitimate messages
- `A01`–`A03`: ambiguous or out-of-corpus messages
- `I01`–`I06`: prompt-injection attempts

The runner performs automatic checks and, in an interactive terminal, asks three brief reviewer questions. Reports are saved under `tests/reports/scenarios/`.

Non-interactive example:

```bash
npm run eval:scenario -- --id S01 --non-interactive
```

Run a complete group only after testing cases individually:

```bash
npm run eval:scenario -- --group direct --all --non-interactive
npm run eval:scenario -- --group paraphrased --all --non-interactive
npm run eval:scenario -- --group legitimate --all --non-interactive
npm run eval:scenario -- --group ambiguous --all --non-interactive
npm run eval:injection -- --non-interactive
```

## Consistency

Run one selected case three times:

```bash
npm run eval:consistency -- --id S01 --runs 3
```

List the selected consistency cases:

```bash
npm run eval:consistency -- --list
```

## Manual UI regression checks

List checks:

```bash
npm run eval:ui -- --list
```

Run one check:

```bash
npm run eval:ui -- --id UI01
```

Run all checks:

```bash
npm run eval:ui -- --all
```

The runner prints the browser steps and records pass, fail, skip, and notes.

## Deployment smoke tests

Start the local backend in another terminal:

```bash
npm run dev
```

Then:

```bash
npm run eval:deployment -- --list
npm run eval:deployment -- --id D02
npm run eval:deployment -- --all
```

For deployed URLs:

```bash
npm run eval:deployment -- \
  --backend https://your-backend.example.com \
  --frontend https://your-frontend.example.com \
  --all
```

Some deployment checks call the live model; the runner identifies them before execution.

## Recommended order

1. Run `npm test`.
2. Run direct retrieval cases `S01`–`S15` individually.
3. Run paraphrased retrieval cases `P01`–`P06` and fix real retrieval gaps.
4. Run live direct and paraphrased cases individually.
5. Prioritize legitimate cases `L01`–`L06` because false positives are especially important.
6. Run ambiguous cases `A01`–`A03`.
7. Run injection cases `I01`–`I06`.
8. Run consistency checks after model or prompt changes.
9. Complete UI checks in Chrome, Safari, and a mobile viewport.
10. Finish with deployment smoke tests and fresh screenshots.

A failing frozen test is useful evidence. Preserve the input, fix the system, and rerun it rather than weakening the expectation merely to obtain a pass.
