// components/MessageInput.jsx — paste box, category hint, demo presets, submit.

import { useState } from "react";

const CATEGORY_OPTIONS = [
  { value: "", label: "Not sure / auto-detect" },
  { value: "job", label: "Job offer" },
  { value: "housing", label: "Housing listing" },
  { value: "immigration", label: "Immigration consultant" },
  { value: "cra", label: "CRA / tax message" },
  { value: "banking", label: "Banking message" },
  { value: "phishing", label: "Email / phishing" },
];

// Demo presets — the legit one is intentional: it shows the system
// can correctly clear a safe message, not just cry "scam".
const PRESETS = [
  {
    label: "CRA threat",
    category: "cra",
    text: "This is the CRA. A warrant has been issued for your arrest due to unpaid taxes. Pay $2,400 in gift cards immediately to avoid deportation.",
  },
  {
    label: "Job scam",
    category: "job",
    text: "Congratulations! You're hired as a remote admin assistant — no interview needed. We'll mail you a cheque for equipment. Just deposit it and e-transfer $500 to our vendor to get started.",
  },
  {
    label: "Fake consultant",
    category: "immigration",
    text: "Pay $5,000 cash and I guarantee your PR in 3 months. I have a contact inside IRCC who personally handles my files. Limited spots — decide today.",
  },
  {
    label: "Legitimate message",
    category: "",
    text: "Hi, this is Sarah from Bright Smiles Dental confirming your cleaning appointment on Tuesday at 2:00 PM. Please reply YES to confirm or call us to reschedule.",
  },
];

export default function MessageInput({
  onAnalyze,
  onPresetSelected,
  onInputChange,
  loading,
}) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");

  function handleSubmit() {
    if (text.trim().length === 0) return;
    onAnalyze(text, category);
  }

  function applyPreset(preset) {
    setText(preset.text);
    setCategory(preset.category);
    onPresetSelected?.(); // clear any previous result immediately
  }

  return (
    <div className="card">
      <label className="field-label" htmlFor="message">
        Paste a suspicious message
      </label>
      <textarea
        id="message"
        className="textarea"
        placeholder="Paste an email, job offer, housing listing, or text message you're unsure about..."
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onInputChange?.();
        }}
        rows={7}
      />

      <div className="preset-row">
        <span className="preset-label">Try an example:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="preset-chip"
            type="button"
            onClick={() => applyPreset(preset)}
            disabled={loading}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="input-row">
        <select
          className="select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          className="btn-primary"
          type="button"
          onClick={handleSubmit}
          disabled={loading || text.trim().length === 0}
        >
          {loading ? "Analyzing..." : "Analyze message"}
        </button>
      </div>
    </div>
  );
}
