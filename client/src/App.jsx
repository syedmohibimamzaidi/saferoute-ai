// App.jsx — top-level layout and state for SafeRoute AI.

import { useState, useRef } from "react";
import MessageInput from "./components/MessageInput.jsx";
import VerifyPanel from "./components/VerifyPanel.jsx";
import RiskResult from "./components/RiskResult.jsx";
import RedFlagList from "./components/RedFlagList.jsx";
import NextSteps from "./components/NextSteps.jsx";
import EmptyState from "./components/EmptyState.jsx";
import { analyzeText } from "./lib/api.js";

function LoadingSkeleton() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton-row">
        <div className="skeleton-circle" />
        <div className="skeleton-lines">
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
        </div>
      </div>
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <p className="skeleton-note">Analyzing against Canadian scam patterns…</p>
    </div>
  );
}

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [verifyHighlight, setVerifyHighlight] = useState(false);
  const [verifyResetSignal, setVerifyResetSignal] = useState(0);

  const verifyRef = useRef(null);

  async function handleAnalyze(text, userCategory) {
    setLoading(true);
    setError(null);
    setResult(null);
    setHasRun(true);
    setVerifyResetSignal((n) => n + 1); // isolate each analysis flow
    try {
      const data = await analyzeText(text, userCategory);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Clear stale results the instant a preset is picked, before analysis runs.
  function handlePresetSelected() {
    setResult(null);
    setError(null);
    setVerifyResetSignal((n) => n + 1); // also reset the verify panel
  }

  // Called from the "Verify the consultant" bridge button in the results.
  function handleGoToVerify() {
    verifyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setVerifyHighlight(true);
    setTimeout(() => setVerifyHighlight(false), 2000);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          SafeRoute <span className="accent">AI</span>
        </h1>
        <p className="tagline">
          Fraud safety for newcomers, immigrants, and international students in
          Canada.
        </p>
      </header>

      <main className="app-main">
        <MessageInput
          onAnalyze={handleAnalyze}
          onPresetSelected={handlePresetSelected}
          loading={loading}
        />

        {error && <div className="error-box">{error}</div>}

        {loading && <LoadingSkeleton />}

        {!loading && !result && !error && !hasRun && <EmptyState />}

        {!loading && result && (
          <section className="results">
            <h2 className="results-heading">Analysis result</h2>
            <RiskResult result={result} />
            <RedFlagList redFlags={result.redFlags} />
            <NextSteps result={result} onVerifyConsultant={handleGoToVerify} />
          </section>
        )}

        <VerifyPanel
          ref={verifyRef}
          highlight={verifyHighlight}
          resetSignal={verifyResetSignal}
        />
      </main>

      <footer className="app-footer">
        Built for the Scale Without Borders AI hackathon · Demo prototype, not
        legal advice.
      </footer>
    </div>
  );
}
