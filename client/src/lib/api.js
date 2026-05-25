// lib/api.js — single fetch wrapper for all backend calls.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Sends suspicious text to the backend for analysis.
 * @param {string} text - the pasted message
 * @param {string} [userCategory] - optional category hint
 * @returns {Promise<object>} the structured analysis response
 */
export async function analyzeText(text, userCategory) {
  const res = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, userCategory }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  return res.json();
}

/**
 * Verifies an immigration consultant by name or RCIC number.
 * @param {string} query
 * @returns {Promise<object>} verdict object
 */
export async function verifyConsultant(query) {
  const res = await fetch(`${API_BASE_URL}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  return res.json();
}
