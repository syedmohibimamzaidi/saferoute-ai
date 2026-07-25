// Creates the SafeRoute Express app inside the test process without requiring
// production code to export the app separately from index.js.

import express from "express";
import cors from "cors";

export async function createTestApp() {
  // The route module imports llmService. A placeholder key is enough because
  // route-guard tests never make a model request.
  process.env.OPENAI_API_KEY ||= "test-key-not-used";

  const [{ default: analyzeRouter }, { default: verifyRouter }] =
    await Promise.all([
      import("../../routes/analyze.js"),
      import("../../routes/verify.js"),
    ]);

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "saferoute-ai" });
  });

  app.use("/api/analyze", analyzeRouter);
  app.use("/api/verify", verifyRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  return app;
}
