// components/RiskResult.jsx — gauge, risk badge, grounding credit, summary.

import { riskStyle, categoryLabel } from "../lib/format.js";
import RiskGauge from "./RiskGauge.jsx";

// Maps pattern-id prefixes to the Canadian authority behind them.
const SOURCE_BY_PREFIX = {
  cra: "CRA",
  job: "CAFC",
  housing: "RCMP",
  immigration: "IRCC",
  banking: "CAFC",
  phishing: "CAFC",
};

function groundingSources(patternIds) {
  if (!patternIds || patternIds.length === 0) return [];
  const sources = new Set();
  for (const id of patternIds) {
    const prefix = id.split("-")[0];
    if (SOURCE_BY_PREFIX[prefix]) sources.add(SOURCE_BY_PREFIX[prefix]);
  }
  return [...sources];
}

export default function RiskResult({ result }) {
  const style = riskStyle(result.riskLevel);
  const sources = groundingSources(result.matchedPatterns);

  return (
    <div className="card">
      <div className="risk-header">
        <RiskGauge score={result.riskScore} level={result.riskLevel} />

        <div className="risk-meta">
          <span
            className="risk-badge"
            style={{ background: style.bg, color: style.color }}
          >
            {style.label}
          </span>
          <div className="risk-tags">
            <span className="tag">{categoryLabel(result.category)}</span>
            <span className="tag tag-muted">
              Confidence: {result.confidence}
            </span>
          </div>
        </div>
      </div>

      <p className="summary">{result.summary}</p>

      {result.matchedPatterns?.length > 0 && (
        <div className="grounding-credit">
          <span className="grounding-dot" aria-hidden="true" />
          <span>
            Grounded in Canadian fraud data
            {sources.length > 0 && <strong> · {sources.join(" · ")}</strong>}
            <span className="grounding-ids">
              {" "}
              ({result.matchedPatterns.join(", ")})
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
