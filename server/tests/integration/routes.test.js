import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createTestApp } from "../helpers/createTestApp.js";

let server;
let baseUrl;

before(async () => {
  const app = await createTestApp();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("health endpoint responds", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    status: "ok",
    service: "saferoute-ai",
  });
});

test("analyze rejects empty input without calling the LLM", async () => {
  const res = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "" }),
  });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /empty|missing/i);
});

test("analyze rejects input longer than 10,000 characters", async () => {
  const res = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "a".repeat(10001) }),
  });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /too long/i);
});

test("verify rejects empty query", async () => {
  const res = await fetch(`${baseUrl}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "" }),
  });
  assert.equal(res.status, 400);
});

test("verify rejects query longer than 120 characters", async () => {
  const res = await fetch(`${baseUrl}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "a".repeat(121) }),
  });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /too long/i);
});

test("verify route returns active register result", async () => {
  const res = await fetch(`${baseUrl}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "R512345" }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "verified_active");
  assert.equal(body.register.count, 8);
});

test("unknown route returns 404", async () => {
  const res = await fetch(`${baseUrl}/api/does-not-exist`);
  assert.equal(res.status, 404);
});
