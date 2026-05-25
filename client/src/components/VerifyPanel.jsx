// components/VerifyPanel.jsx — consultant verification, linkable from analysis.

import { useState, useEffect, forwardRef } from "react";
import { verifyConsultant } from "../lib/api.js";

const STATUS_STYLES = {
  verified_active: { color: "#16a34a", bg: "#dcfce7", icon: "✓" },
  verified_inactive: { color: "#d97706", bg: "#fef3c7", icon: "!" },
  not_found: { color: "#dc2626", bg: "#fee2e2", icon: "✕" },
  invalid: { color: "#64748b", bg: "#f1f5f9", icon: "?" },
};

const VerifyPanel = forwardRef(function VerifyPanel(
  { highlight, resetSignal },
  ref,
) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset the panel whenever App signals a new demo flow (preset / analysis).
  // The initial render (resetSignal === 0) is skipped so nothing clears on mount.
  useEffect(() => {
    if (resetSignal > 0) {
      setQuery("");
      setResult(null);
      setError(null);
      setLoading(false);
    }
  }, [resetSignal]);

  async function handleVerify() {
    if (query.trim().length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await verifyConsultant(query);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const style = result
    ? STATUS_STYLES[result.status] || STATUS_STYLES.invalid
    : null;

  return (
    <div
      ref={ref}
      className={`card verify-panel${highlight ? " verify-panel-highlight" : ""}`}
    >
      <h3 className="section-title">Verify an immigration consultant</h3>
      <p className="verify-intro">
        Anyone paid to represent you for Canadian immigration must be a licensed
        RCIC on the CICC register. Check a name or RCIC number (e.g.{" "}
        <code>R512345</code>).
      </p>

      <div className="input-row">
        <input
          className="text-input"
          type="text"
          placeholder="Consultant name or RCIC number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
        />
        <button
          className="btn-primary"
          type="button"
          onClick={handleVerify}
          disabled={loading || query.trim().length === 0}
        >
          {loading ? "Checking..." : "Verify"}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {result && style && (
        <div
          className="verify-result"
          style={{ background: style.bg, borderColor: style.color }}
        >
          <div className="verify-verdict" style={{ color: style.color }}>
            <span className="verify-icon">{style.icon}</span>
            {result.verdict}
          </div>
          <p className="verify-detail">{result.detail}</p>
          {result.fuzzy && (
            <p className="verify-fuzzy">
              Note: matched on a similar name — confirm the spelling.
            </p>
          )}
        </div>
      )}

      {result?.register && (
        <p className="grounding-note">{result.register.note}</p>
      )}
    </div>
  );
});

export default VerifyPanel;
