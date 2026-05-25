// components/NextSteps.jsx — newcomer context, steps, explanation,
// plus an inline bridge to the consultant verification panel.

export default function NextSteps({ result, onVerifyConsultant }) {
  const isImmigration = result.category === "immigration";

  return (
    <div className="card">
      {result.newcomerContext && (
        <div className="newcomer-note">
          <strong>Why this targets newcomers:</strong> {result.newcomerContext}
        </div>
      )}

      <h3 className="section-title">What you should do</h3>
      <ol className="steps-list">
        {result.recommendedSteps?.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      {isImmigration && (
        <div className="verify-bridge">
          <div className="verify-bridge-text">
            <strong>This message involves an immigration consultant.</strong>
            <span>
              {" "}
              Anyone paid to represent you must be a licensed RCIC. Check them
              against the official register now.
            </span>
          </div>
          <button
            className="btn-primary verify-bridge-btn"
            type="button"
            onClick={onVerifyConsultant}
          >
            Verify the consultant →
          </button>
        </div>
      )}

      {result.explanation && (
        <>
          <h3 className="section-title">In plain English</h3>
          <p className="explanation">{result.explanation}</p>
        </>
      )}
    </div>
  );
}
