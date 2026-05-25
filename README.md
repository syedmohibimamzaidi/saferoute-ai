# SafeRoute AI

**An AI-powered fraud safety assistant for newcomers, immigrants, and international students in Canada.**

Built for the **Scale Without Borders AI Hackathon**.

> SafeRoute AI helps newcomers detect suspicious messages — job offers, housing listings, immigration consultant claims, CRA threats, and phishing attempts — by combining LLM analysis with grounding in real Canadian fraud patterns, plus a concrete consultant-verification feature.

---

## Live Demo

- **App:** https://saferoute-canada.vercel.app
- **API:** https://saferoute-ai-wjx1.onrender.com

> The consultant verification feature uses a representative demo register. In production it would query the live CICC public register at [college-ic.ca](https://college-ic.ca).

---

## Screenshots

### CRA Scam Detection
![CRA Scam Detection](./screenshots/cra-scam.png)

### Fake Consultant Verification Flow
![Consultant Verification](./screenshots/consultant-verify.png)

### Legitimate Message Detection
![Legitimate Message](./screenshots/legit-message.png)

---

## The Problem

Newcomers to Canada are disproportionately targeted by fraud. They are often unfamiliar with how Canadian institutions like the CRA, IRCC, and banks actually communicate, and scammers exploit that gap — frequently by implying that a tax or paperwork issue could threaten someone's immigration status.

The categories that hurt newcomers most are specific:

- **CRA impersonation** — threats of arrest or deportation over unpaid taxes.
- **Job scams** — fake offers, upfront "fees," and overpayment cheque fraud aimed at students seeking work.
- **Housing scams** — phantom rentals demanding a deposit before viewing, which exploit people renting from abroad.
- **Fake immigration consultants** — unlicensed "consultants" guaranteeing permanent residency for large cash fees.
- **Banking and phishing** — fake fraud-department calls, lookalike e-Transfer notices, and account-suspension links.

A generic scam detector does not address this. SafeRoute AI is built specifically around **Canadian fraud patterns and the newcomer experience**.

---

## What Makes This Different

SafeRoute AI is deliberately **not** a thin wrapper around an LLM. It is a real system with the model as one component:

1. **Canadian-grounded analysis (RAG).** Every analysis is grounded in a curated dataset of Canadian scam patterns sourced from the Canadian Anti-Fraud Centre (CAFC), IRCC, the CRA, the RCMP, and the College of Immigration and Citizenship Consultants (CICC). A retrieval layer surfaces the most relevant patterns and injects them into the model's prompt, so analysis reasons from real Canadian fraud data — not just the model's priors.

2. **A concrete verification feature.** Beyond detection, SafeRoute AI lets users verify an immigration consultant by name or RCIC number against a CICC-style register, returning a clear verdict — verified, suspended, revoked, or not found. The analysis flow links directly into this: when a message involves an immigration consultant, the result surfaces a one-click path to verify them.

3. **Newcomer-focused, trust-first design.** Output is calm and non-alarmist, written in plain English for users who may not be fluent. Each result explains *why* a given scam targets newcomers specifically. The system also correctly clears legitimate messages as low-risk, rather than treating everything as a threat.

---

## Features

- **Paste-and-analyze** any suspicious email, job offer, housing message, immigration claim, or text.
- **Structured risk analysis:** risk score (0–100), risk level, scam category, confidence level, and a plain-English summary.
- **Red flag breakdown** — each warning sign explained in one clear sentence.
- **"Why this targets newcomers"** context for every scam type.
- **Recommended next steps** that are safe and concrete.
- **Visible grounding** — every result cites the Canadian source patterns it relied on.
- **Immigration consultant verification** — check a name or RCIC number against a CICC-style register, integrated directly into the analysis flow.
- **Honest low-risk handling** — legitimate messages get a reassuring "what we checked" result instead of false alarms.

---

## Recommended Demo Flow

1. Analyze a CRA threat message
2. Show the red flags and grounded Canadian fraud source
3. Analyze the fake consultant example
4. Click “Verify the consultant”
5. Search a suspended consultant (e.g. Priya Sharma)
6. End by showing a legitimate low-risk message

This sequence demonstrates:
- scam detection
- grounded reasoning
- newcomer-specific context
- verification workflow integration
- trust-focused low-risk handling

---

## How It Works

```text
User pastes a message
        │
        ▼
┌─────────────────────┐     retrieves relevant
│  Grounding Service  │ ──► Canadian scam patterns
│  (keyword scoring)  │     from a curated dataset
└─────────────────────┘
        │
        ▼
┌─────────────────────┐     patterns injected into a
│   LLM Analysis      │ ──► grounded prompt; response
│  (OpenAI, JSON mode)│     validated against a schema
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Structured Result  │ ──► risk score, red flags, steps,
│  + Verification     │     and a link to verify any
│       Bridge        │     immigration consultant
└─────────────────────┘
```

The pipeline has three stages: a **grounding service** that scores and retrieves the most relevant Canadian scam patterns for the pasted text; an **LLM analysis** step that injects those patterns into the prompt, calls the model in JSON mode, and validates the structured response against a strict schema; and a **verification feature** that checks immigration consultants against a CICC-style register.

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React (Vite)                        |
| Backend      | Node.js, Express                    |
| AI           | OpenAI API (JSON mode)              |
| Validation   | Zod                                 |
| Data         | Curated local JSON datasets         |
| Deployment   | Vercel (frontend), Render (backend) |

---

## Project Structure

```text
saferoute-ai/
├── server/                       # Node.js + Express backend
│   ├── index.js                  # Express app entry
│   ├── routes/
│   │   ├── analyze.js            # POST /api/analyze
│   │   └── verify.js             # POST /api/verify
│   ├── services/
│   │   ├── llmService.js         # OpenAI call + retry + validation
│   │   ├── groundingService.js   # scam-pattern retrieval
│   │   └── verifyService.js      # consultant verification logic
│   ├── prompts/
│   │   └── analyzePrompt.js      # grounded system/user prompt
│   ├── data/
│   │   ├── scamPatterns.json     # curated Canadian scam patterns
│   │   └── ciccConsultants.json  # CICC-style consultant register
│   └── utils/
│       └── schema.js             # Zod response schema + validation
│
└── client/                       # React (Vite) frontend
    └── src/
        ├── App.jsx
        ├── components/           # input, risk result, red flags,
        │                         # next steps, verify panel, etc.
        └── lib/                  # API wrapper + display helpers
```

---

## API Reference

### `POST /api/analyze`

Analyzes a suspicious message.

#### Request body

```json
{
  "text": "This is the CRA. Pay $2400 in gift cards or face arrest.",
  "userCategory": "cra"
}
```

`userCategory` is optional — an auto-detect hint.

#### Response

```json
{
  "riskScore": 95,
  "riskLevel": "high",
  "category": "cra",
  "confidence": "high",
  "summary": "This message shows strong signs of a CRA impersonation scam.",
  "redFlags": [
    {
      "flag": "Threatens arrest",
      "explanation": "The real CRA never threatens arrest."
    }
  ],
  "matchedPatterns": ["cra-001"],
  "newcomerContext": "Scammers imply tax issues could affect immigration status — they cannot.",
  "recommendedSteps": [
    "Do not reply or pay.",
    "Verify through CRA My Account."
  ],
  "explanation": "This message is designed to scare you into paying quickly..."
}
```

### `POST /api/verify`

Verifies an immigration consultant by name or RCIC number.

#### Request body

```json
{
  "query": "R512345"
}
```

#### Response

```json
{
  "status": "verified_active",
  "verdict": "Verified — licensed and in good standing",
  "detail": "This consultant is an active RCIC authorized to provide paid immigration advice.",
  "consultant": {
    "rcicNumber": "R512345",
    "fullName": "...",
    "status": "active"
  }
}
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- OpenAI API key

### Backend

```bash
cd server
npm install
```

Create a `server/.env` file:

```env
PORT=3001
OPENAI_API_KEY=your-openai-api-key
```

Then start it:

```bash
npm run dev
```

The backend runs on `http://localhost:3001`.

### Frontend

```bash
cd client
npm install
```

Create a `client/.env` file:

```env
VITE_API_URL=http://localhost:3001
```

Then start it:

```bash
npm run dev
```

The app runs on `http://localhost:5173`.

---

## Try It

Use the built-in example buttons in the app:

- **CRA threat** — a high-risk CRA impersonation scam.
- **Job scam** — an overpayment cheque scam targeting students.
- **Fake consultant** — an unlicensed consultant guaranteeing PR; the result links directly into consultant verification.
- **Legitimate message** — a genuine appointment reminder, correctly cleared as low-risk.

For consultant verification, try:
- `Aisha Rahman` (verified)
- `Priya Sharma` (suspended)
- `R512345`

---

## Limitations & Future Work

SafeRoute AI is a hackathon prototype, not legal or financial advice.

- The scam-pattern dataset and consultant register are curated samples. Production would integrate the live CICC public register and an expanded, regularly updated pattern set.
- Retrieval currently uses keyword and category scoring. Semantic embedding-based retrieval is a natural next step.
- Future directions include:
  - OCR for screenshots
  - multilingual support
  - browser/email extensions
  - community scam reporting

---

## Judging Criteria Alignment

### Innovation
Combines LLM analysis with RAG grounding in real Canadian fraud data and a concrete verification workflow rather than generic scam classification.

### Impact
Addresses a real, underserved problem: scams disproportionately targeting newcomers to Canada.

### Technical Implementation
A structured pipeline of grounding, schema-validated LLM analysis, retry handling, and consultant verification.

### Creativity
The analysis-to-verification workflow turns detection into a concrete protective action.

### Presentation Quality
A calm, trust-focused interface that handles both scam and legitimate messages credibly.

---

## Team

**Mohib Zaidi**

Built for the Scale Without Borders AI Hackathon.

---

*SafeRoute AI is a prototype and does not constitute legal, financial, or immigration advice. Always verify information through official Government of Canada channels.*
