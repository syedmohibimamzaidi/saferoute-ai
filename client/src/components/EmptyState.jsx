// components/EmptyState.jsx — shown before the first analysis.

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        🛡️
      </div>
      <p className="empty-title">Paste a message above to check it</p>
      <p className="empty-text">
        SafeRoute AI analyzes the message against known Canadian scam patterns
        and explains, in plain language, whether it looks safe.
      </p>
    </div>
  );
}
