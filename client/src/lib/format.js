// lib/format.js — shared display helpers.

export const RISK_STYLES = {
  low: { label: "Low Risk", color: "#16a34a", bg: "#dcfce7" },
  medium: { label: "Medium Risk", color: "#d97706", bg: "#fef3c7" },
  high: { label: "High Risk", color: "#dc2626", bg: "#fee2e2" },
};

export const CATEGORY_LABELS = {
  job: "Job Offer",
  housing: "Housing",
  immigration: "Immigration",
  cra: "CRA / Tax",
  banking: "Banking",
  phishing: "Phishing",
  "verified-safe": "Verified Safe",
};

export function riskStyle(level) {
  return RISK_STYLES[level] || RISK_STYLES.medium;
}

export function categoryLabel(cat) {
  return CATEGORY_LABELS[cat] || "Verified Safe";
}
