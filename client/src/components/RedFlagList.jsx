// components/RedFlagList.jsx — red flags, or a reassurance card when there are none.

const SAFE_CHECKS = [
  "No threats, urgency, or pressure to act immediately",
  "No requests for payment, gift cards, or e-transfers",
  "No requests for personal, banking, or login information",
  "No suspicious links or lookalike sender addresses",
];

export default function RedFlagList({ redFlags }) {
  const hasFlags = redFlags && redFlags.length > 0;

  if (!hasFlags) {
    // Low-risk / legitimate message — reassure, don't show an empty card.
    return (
      <div className="card safe-card">
        <h3 className="section-title">What we checked</h3>
        <p className="safe-intro">
          This message doesn't show the warning signs of a scam:
        </p>
        <ul className="check-list">
          {SAFE_CHECKS.map((item, i) => (
            <li key={i} className="check-item">
              <span className="check-marker" aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="section-title">Red flags detected</h3>
      <ul className="flag-list">
        {redFlags.map((item, i) => (
          <li key={i} className="flag-item">
            <span className="flag-marker" aria-hidden="true">
              !
            </span>
            <div>
              <p className="flag-text">{item.flag}</p>
              <p className="flag-explain">{item.explanation}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
