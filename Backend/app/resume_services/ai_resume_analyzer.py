"""
ai_resume_analyzer.py
---------------------
Uses Groq AI (llama3-8b-8192) to analyze resume text and return structured feedback.

The API key is loaded from the GROQ_API_KEY environment variable,
stored in Backend/.env which is gitignored — never committed.

IMPORTANT: groq is imported LAZILY (inside the function)
so a missing package never crashes the backend on startup.
"""

from __future__ import annotations

import json
import os
import re

from pathlib import Path

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

_MODEL_NAME = "llama-3.1-8b-instant"

# ── Prompt template ──────────────────────────────────────────────────────────
_PROMPT_TEMPLATE = """
You are an expert ATS (Applicant Tracking System) resume analyzer and career coach.

Analyze the following resume text and return a JSON object with EXACTLY these keys:
{{
  "ATS Score": "<number>/100",
  "Strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "Weaknesses": ["<weakness 1>", "<weakness 2>"],
  "Missing Skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "Suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}}

Rules:
- ATS Score should reflect how well this resume would pass automated ATS filters (number only, e.g. "78/100").
- Strengths: list 3-5 concrete positives found in the resume.
- Weaknesses: list 2-4 areas that need improvement.
- Missing Skills: list 3-6 technical or soft skills absent but commonly expected for this type of profile.
- Suggestions: list 3-5 specific, actionable improvements.
- Return ONLY valid JSON. Do NOT include markdown code fences or any text outside the JSON object.

Resume Text:
---
{resume_text}
---
""".strip()


# ── Main function ─────────────────────────────────────────────────────────────
async def analyze_resume_with_ai(resume_text: str) -> dict:
    """
    Sends resume text to Groq and returns structured JSON feedback.
    Gracefully falls back if the package is missing or the API call fails.
    """

    # ── 1. Load .env and read API key fresh on every call ────────────────────
    _env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(dotenv_path=_env_path, override=True)
    api_key = os.getenv("GROQ_API_KEY", "").strip()


    # ── 2. Check API key ──────────────────────────────────────────────────────
    if not api_key:
        return _fallback("GROQ_API_KEY is not set in Backend/.env")

    # ── 3. Lazy import — expose the real error ────────────────────────────────
    try:
        from groq import Groq  # noqa: PLC0415
        print(f"[DEBUG] groq import: SUCCESS")
    except Exception as import_err:
        print(f"[DEBUG] groq import FAILED: {type(import_err).__name__}: {import_err}")
        return _fallback(
            f"groq import error ({type(import_err).__name__}): {import_err}"
        )

    # ── 3. Call Groq ──────────────────────────────────────────────────────────
    try:
        client = Groq(api_key=api_key)
        prompt = _PROMPT_TEMPLATE.format(resume_text=resume_text[:12000])

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert ATS resume analyzer. Always respond with valid JSON only.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            model=_MODEL_NAME,
            temperature=0.3,
            max_tokens=1024,
        )

        raw = chat_completion.choices[0].message.content.strip()

        # Strip markdown fences the model sometimes wraps JSON in
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```\s*$",       "", raw, flags=re.MULTILINE)
        raw = raw.strip()

        parsed = json.loads(raw)

        return {
            "ATS Score":      parsed.get("ATS Score",      "N/A"),
            "Strengths":      _as_list(parsed.get("Strengths",      [])),
            "Weaknesses":     _as_list(parsed.get("Weaknesses",     [])),
            "Missing Skills": _as_list(parsed.get("Missing Skills", [])),
            "Suggestions":    _as_list(parsed.get("Suggestions",    [])),
        }

    except json.JSONDecodeError as exc:
        return _fallback(f"Groq returned non-JSON: {exc}")
    except Exception as exc:
        return _fallback(f"Groq API error: {exc}")


# ── Helpers ───────────────────────────────────────────────────────────────────
def _as_list(value) -> list:
    if isinstance(value, list):
        return [str(v) for v in value]
    if isinstance(value, str):
        return [value]
    return []


def _fallback(reason: str) -> dict:
    """Safe placeholder — backend never returns 500 just because AI failed."""
    return {
        "ATS Score":      "N/A",
        "Strengths":      [f"[AI unavailable] {reason}"],
        "Weaknesses":     ["Could not perform real analysis."],
        "Missing Skills": [],
        "Suggestions":    ["Ensure GROQ_API_KEY is set in Backend/.env and groq package is installed."],
    }