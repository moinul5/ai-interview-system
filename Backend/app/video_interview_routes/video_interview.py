"""
video_interview.py
------------------
Video Interview Analysis API routes.

Endpoints:
  POST /api/video/start-session       — Validate AI interview session exists
  POST /api/video/upload-analysis     — Receive MediaPipe metrics + transcript, compute scores, save to DB
  POST /api/video/generate-feedback   — Call Groq AI for natural language feedback, update DB record
  GET  /api/video/report/{session_id} — Return full saved analysis report

Design notes:
  - No OpenCV; all video analysis is done in the browser via MediaPipe.
  - Filler word detection and WPM are computed here from the submitted transcript.
  - Groq AI is used for qualitative feedback generation (strengths/weaknesses).
  - Falls back gracefully if Groq is unavailable.
"""

import json
import logging
import os
import re
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.database import engine

try:
    from groq import Groq
except Exception:
    Groq = None

router = APIRouter(prefix="/api/video", tags=["Video Interview Analysis"])

# ─── Filler words to detect ──────────────────────────────────────────────────
FILLER_WORDS = ["um", "uh", "like", "basically", "actually"]

# ─── Groq helpers (reuse pattern from interview.py) ──────────────────────────

def _groq_client():
    # Support both env var names used across the project
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GROQ_API_KEY")
    if not api_key or api_key.startswith("your_") or Groq is None:
        logger.warning("[VideoInterview] Groq API key not found — will use rule-based fallback.")
        return None
    return Groq(api_key=api_key)


def _clean_json(raw: str) -> str:
    raw = raw.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", raw, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        raw = fenced.group(1).strip()
    start = min([i for i in [raw.find("{"), raw.find("[")] if i != -1], default=0)
    end = max(raw.rfind("}"), raw.rfind("]"))
    return raw[start: end + 1] if end >= start else raw


# ─── Speech analysis helpers ─────────────────────────────────────────────────

def _count_filler_words(transcript: str) -> dict:
    """Count each filler word in transcript (case-insensitive, whole-word)."""
    transcript_lower = transcript.lower()
    counts = {}
    total = 0
    for word in FILLER_WORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        c = len(re.findall(pattern, transcript_lower))
        counts[word] = c
        total += c
    return {"total": total, "breakdown": counts}


def _calculate_wpm(transcript: str, duration_seconds: float) -> int:
    """Words per minute from transcript and interview duration."""
    if duration_seconds <= 0:
        return 0
    words = len(transcript.split())
    minutes = duration_seconds / 60
    return int(round(words / minutes)) if minutes > 0 else 0


def _speech_clarity_score(filler_count: int, wpm: int) -> float:
    """
    Score 0-100 based on:
    - Fewer filler words → higher score
    - WPM in ideal range (110-160) → higher score
    """
    # Filler word penalty: each filler reduces score by 3, floor at 0
    filler_penalty = min(filler_count * 3, 60)
    filler_component = 100 - filler_penalty  # 0-100

    # WPM score: ideal range 110-160
    if wpm <= 0:
        wpm_component = 30
    elif 110 <= wpm <= 160:
        wpm_component = 100
    elif wpm < 110:
        wpm_component = max(30, 100 - (110 - wpm) * 1.5)
    else:  # > 160
        wpm_component = max(30, 100 - (wpm - 160) * 1.5)

    return round((filler_component * 0.6 + wpm_component * 0.4), 2)


def _filler_word_score(filler_count: int) -> float:
    """Score 0-100 where 0 fillers = 100, 20+ fillers = 0."""
    return max(0, round(100 - filler_count * 5, 2))


def _compute_answer_content_score(answer_evaluations: list) -> float:
    """
    Average score across all AI-evaluated answers (0-100).
    Returns 0 if no evaluations are available.
    """
    if not answer_evaluations:
        return 0.0
    scores = [e.get("score", 0) for e in answer_evaluations if isinstance(e, dict)]
    if not scores:
        return 0.0
    return round(sum(scores) / len(scores), 2)


def _compute_confidence_score(
    eye_contact: float,
    head_stability: float,
    face_visibility: float,
    speech_clarity: float,
    filler_score: float,
    answer_content_score: float | None = None,
) -> float:
    """
    Weighted confidence score:
      Eye Contact          25%
      Head Stability       15%
      Face Visibility      10%
      Speech Clarity       15%
      Filler Score         10%
      Answer Content Score 25%  ← AI-evaluated answer quality
    
    When answer_content_score is None (no AI evaluation yet), weights fall
    back to the original non-content distribution (normalized).
    """
    if answer_content_score is not None:
        score = (
            eye_contact           * 0.25 +
            head_stability        * 0.15 +
            face_visibility       * 0.10 +
            speech_clarity        * 0.15 +
            filler_score          * 0.10 +
            answer_content_score  * 0.25
        )
    else:
        # Original weights (no answer content available)
        score = (
            eye_contact    * 0.30 +
            head_stability * 0.20 +
            face_visibility * 0.15 +
            speech_clarity * 0.20 +
            filler_score   * 0.15
        )
    return round(min(100, max(0, score)), 2)


def _compute_communication_score(speech_clarity: float, filler_score: float, wpm: int) -> float:
    """Communication = blend of clarity + filler + WPM quality."""
    wpm_quality = 100 if 110 <= wpm <= 160 else max(30, 100 - abs(wpm - 135) * 1.2)
    return round(
        speech_clarity * 0.45 + filler_score * 0.35 + wpm_quality * 0.20,
        2,
    )


def _compute_transparency_score(
    eye_contact: float,
    communication: float,
    head_stability: float,
    confidence: float,
) -> float:
    return round(
        eye_contact * 0.25 + communication * 0.25 + head_stability * 0.25 + confidence * 0.25,
        2,
    )


# ─── Groq AI Feedback Generator ──────────────────────────────────────────────

def _generate_ai_feedback(
    transcript: str,
    questions: list,
    eye_contact: float,
    face_visibility: float,
    head_stability: float,
    communication: float,
    confidence: float,
    overall_score: float,
    filler_count: int,
    wpm: int,
) -> dict | None:
    client = _groq_client()
    if not client:
        return None

    # ── Pre-parse actual answers from transcript ──────────────────────────────
    # We do this BEFORE calling the AI so the AI cannot invent answers.
    actual_qa = _parse_qa_from_transcript(transcript, questions)

    # Check if there are no valid answers at all
    valid_answers_count = sum(
        1 for item in actual_qa
        if item["answer"] != "(No answer recorded)" and not _is_gibberish_or_empty(item["answer"])
    )

    if valid_answers_count == 0:
        return {
            "summary": "No spoken responses were captured during this video interview session. Please ensure your microphone is enabled and you speak clearly.",
            "strengths": ["None (no valid answers provided)."],
            "weaknesses": ["All questions were left unanswered, skipped, or answered with invalid/empty responses."],
            "communication_feedback": ["Estimated WPM: 0. Filler words: 0. No verbal communication was recorded."],
            "body_language_feedback": [
                f"Eye contact score: {eye_contact:.0f}/100.",
                f"Posture/head stability score: {head_stability:.0f}/100."
            ],
            "improvement_suggestions": [
                "Position yourself clearly in front of the camera.",
                "Speak clearly into the microphone to record your answers.",
            ],
            "overall_video_score": 0,
            "transparency_breakdown": {
                "eye_contact": round(eye_contact),
                "communication": 0,
                "posture": round(head_stability),
                "confidence": 0,
            },
            "answer_evaluations": [
                {
                    "question": item["question"],
                    "answer": "(No answer recorded)",
                    "score": 0,
                    "feedback": "No answer was provided for this question."
                }
                for item in actual_qa
            ]
        }

    # Build the explicit Q&A block for the prompt (clearly marks unanswered questions)
    qa_block_lines = []
    for i, item in enumerate(actual_qa):
        ans_text = item["answer"]
        has_answer = ans_text and ans_text != "(No answer recorded)" and len(ans_text.strip()) > 5
        qa_block_lines.append(
            f"Question {i+1}: {item['question']}\n"
            f"Candidate's Answer: {'\"' + ans_text + '\"' if has_answer else '<<NO ANSWER RECORDED - candidate did not speak>>'}"
        )
    qa_block = "\n\n".join(qa_block_lines)

    prompt = f"""You are an expert interview coach evaluating a candidate's video interview performance.

IMPORTANT RULES YOU MUST FOLLOW:
1. You MUST evaluate ONLY what the candidate actually said. Do NOT invent, assume, or paraphrase any answer content.
2. If a question shows "<<NO ANSWER RECORDED>>", the candidate gave NO answer. Set score to 0 and state they did not answer.
3. Use the EXACT answer text provided. Do not add, expand, or improve upon what was said.
4. Compare answers to technical questions strictly against industry standards. If the answers are incorrect, gibberish, irrelevant, or just empty words, you MUST grade them as 0.
5. If most or all answers are incorrect or gibberish, the overall_video_score must be low (below 40), regardless of delivery metrics.

--- ACTUAL CANDIDATE Q&A (from speech transcript) ---
{qa_block}

--- VIDEO DELIVERY METRICS ---
- Eye Contact Score: {eye_contact}/100
- Face Visibility Score: {face_visibility}/100
- Head Stability Score: {head_stability}/100
- Communication Score: {communication}/100
- Filler Words Detected: {filler_count}
- Words Per Minute: {wpm}

Based ONLY on the actual answers above and the delivery metrics, generate a coaching report in this exact JSON format:
{{
  "summary": "A comprehensive but honest summary of the interview. Mention if the candidate failed to answer any questions or gave incorrect/gibberish answers.",
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "communication_feedback": ["...", "..."],
  "body_language_feedback": ["...", "..."],
  "improvement_suggestions": ["...", "...", "..."],
  "overall_video_score": <number 0-100>,
  "transparency_breakdown": {{
    "eye_contact": <number>,
    "communication": <number>,
    "posture": <number>,
    "confidence": <number>
  }},
  "answer_evaluations": [
    {{
      "question": "The exact question text",
      "answer": "The EXACT text the candidate said (or empty string if nothing was said)",
      "score": <0 if no answer/incorrect, 1-100 based on actual answer quality>,
      "feedback": "Specific feedback. If no answer was given, say exactly: 'No answer was provided for this question.'"
    }}
  ]
}}

Return strict JSON only. Never hallucinate or fabricate answer content. Grade strictly and realistically.
""".strip()

    try:
        model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        logger.info("[VideoInterview] Calling Groq model: %s", model)
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a strict technical interview evaluator. You NEVER invent or fabricate answers. You evaluate ONLY what the candidate actually said, grading strictly based on correctness and content quality. Return strict JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=2500,
        )
        content = completion.choices[0].message.content or "{}"
        logger.info("[VideoInterview] Groq raw response length: %d chars", len(content))
        data = json.loads(_clean_json(content))
        if not isinstance(data, dict):
            logger.warning("[VideoInterview] Groq returned non-dict JSON: %s", type(data))
            return None

        # Normalize all expected keys
        data.setdefault("strengths", [])
        data.setdefault("weaknesses", [])
        data.setdefault("communication_feedback", [])
        data.setdefault("body_language_feedback", [])
        data.setdefault("improvement_suggestions", [])
        data.setdefault("summary", "Interview video analysis completed successfully.")
        data.setdefault("answer_evaluations", [])
        data["overall_video_score"] = max(0, min(100, int(data.get("overall_video_score", overall_score))))
        data.setdefault("transparency_breakdown", {
            "eye_contact": eye_contact,
            "communication": communication,
            "posture": head_stability,
            "confidence": confidence,
        })

        # ── Post-process: enforce honesty — override any hallucinated answers ──
        # Use our pre-parsed actual_qa as the ground truth.
        ai_evals = data.get("answer_evaluations", [])
        enforced_evals = []
        for i, actual in enumerate(actual_qa):
            real_answer = actual["answer"]
            has_real_answer = (
                real_answer
                and real_answer != "(No answer recorded)"
                and len(real_answer.strip()) > 5
            )
            # Try to match with AI's evaluation for this question index
            ai_eval = ai_evals[i] if i < len(ai_evals) else {}

            if has_real_answer:
                # Use AI's score and feedback, but ENFORCE the real answer text
                enforced_evals.append({
                    "question": actual["question"],
                    "answer": real_answer,  # always use the real transcript, not AI's version
                    "score": max(0, min(100, int(ai_eval.get("score", actual["score"])))),
                    "feedback": ai_eval.get("feedback", actual["feedback"]),
                })
            else:
                # No real answer → force score=0, no hallucination allowed
                enforced_evals.append({
                    "question": actual["question"],
                    "answer": "(No answer recorded)",
                    "score": 0,
                    "feedback": "No answer was provided for this question. The candidate did not speak during this question.",
                })
        data["answer_evaluations"] = enforced_evals

        logger.info("[VideoInterview] Groq AI feedback generated successfully.")
        return data
    except Exception as e:
        logger.error("[VideoInterview] Groq AI feedback failed: %s", str(e), exc_info=True)
        return None




def _is_gibberish_or_empty(answer: str) -> bool:
    if not answer:
        return True
    val = answer.strip().lower()
    if len(val) < 8:
        return True
    if val in ["i don't know", "i do not know", "idk", "wrong answer", "no idea", "none", "n/a", "na", "wrong", "skip", "pass"]:
        return True
    # check if it's just repeated characters without spaces (e.g. asdfasdfasdfasdf)
    if " " not in val and len(val) > 15:
        return True
    return False


def _parse_qa_from_transcript(transcript: str, questions: list) -> list:
    """
    Parse actual answers from the transcript.
    
    Frontend builds transcript as:
      Q1: <question text>
      Answer: <answer text>
      
      Q2: <question text>
      Answer: <answer text>
    """
    evals = []
    if not questions or not transcript:
        for q in questions:
            q_text = q.get("question", "") if isinstance(q, dict) else q
            evals.append({"question": q_text, "answer": "(No answer recorded)", "score": 0,
                          "feedback": "No speech transcript was captured for this question."})
        return evals

    transcript_clean = transcript.strip()

    for i, q in enumerate(questions):
        q_text = q.get("question", "") if isinstance(q, dict) else q
        ans = ""

        # Pattern 1: "Q{n}: ...\nAnswer: <ans>" (until next Q block or end)
        next_q = i + 2
        p1 = re.search(
            rf"Q{i+1}\s*:.*?\nAnswer\s*:\s*(.*?)(?=\n\s*\nQ{next_q}\s*:|$)",
            transcript_clean, re.DOTALL | re.IGNORECASE,
        )
        if p1:
            ans = p1.group(1).strip()

        # Pattern 2: looser – any line after "Answer:" up to next "Q{n}:" heading
        if not ans:
            p2 = re.search(
                rf"Q{i+1}\b.*?Answer\s*:\s*(.+?)(?=Q{next_q}\b|$)",
                transcript_clean, re.DOTALL | re.IGNORECASE,
            )
            if p2:
                ans = p2.group(1).strip()

        # Pattern 3: split on "Q{n}:" boundaries, then extract "Answer:" part
        if not ans:
            seg_pattern = rf"Q{i+1}\s*:(.*?)(?=Q{next_q}\s*:|$)"
            seg_match = re.search(seg_pattern, transcript_clean, re.DOTALL | re.IGNORECASE)
            if seg_match:
                seg = seg_match.group(1)
                ans_match = re.search(r"Answer\s*:\s*(.+)", seg, re.DOTALL | re.IGNORECASE)
                if ans_match:
                    ans = ans_match.group(1).strip()

        # Determine score and feedback based on actual answer length and validity
        if not ans or _is_gibberish_or_empty(ans):
            score = 0
            feedback = "No valid answer was captured or the response was too short/irrelevant. Please address the question directly."
        elif len(ans) > 100:
            score = 70   # base score; AI will refine this
            feedback = "Answer captured. AI will evaluate content quality."
        elif len(ans) > 20:
            score = 50
            feedback = "Answer is brief. AI will evaluate content quality."
        else:
            score = 30
            feedback = "Answer is very short. AI will evaluate content quality."

        evals.append({
            "question": q_text,
            "answer": ans if ans else "(No answer recorded)",
            "score": score,
            "feedback": feedback,
        })

    return evals




def _fallback_ai_feedback(
    eye_contact: float,
    face_visibility: float,
    head_stability: float,
    communication: float,
    confidence: float,
    overall_score: float,
    filler_count: int,
    wpm: int,
    transcript: str = "",
    questions: list = None,
) -> dict:
    """Rule-based fallback feedback when Groq is unavailable."""
    answer_evals = _parse_qa_from_transcript(transcript, questions or [])
    valid_count = sum(
        1 for e in answer_evals
        if e["answer"] != "(No answer recorded)" and not _is_gibberish_or_empty(e["answer"])
    )

    if valid_count == 0:
        return {
            "summary": "Local analysis: No valid spoken responses were captured during this interview.",
            "strengths": [],
            "weaknesses": ["No answers were recorded. Please ensure your microphone is allowed and active."],
            "communication_feedback": ["No speech recorded."],
            "body_language_feedback": [
                f"Eye contact score: {eye_contact:.0f}/100.",
                f"Head stability score: {head_stability:.0f}/100."
            ],
            "improvement_suggestions": ["Ensure your camera and microphone are working correctly and speak your answers clearly."],
            "overall_video_score": 0,
            "transparency_breakdown": {
                "eye_contact": round(eye_contact),
                "communication": 0,
                "posture": round(head_stability),
                "confidence": 0,
            },
            "answer_evaluations": [
                {
                    "question": e["question"],
                    "answer": "(No answer recorded)",
                    "score": 0,
                    "feedback": "No answer was provided."
                }
                for e in answer_evals
            ]
        }

    strengths = []
    weaknesses = []
    suggestions = []

    if eye_contact >= 70:
        strengths.append(f"Strong eye contact maintained ({eye_contact:.0f}% of the time) — projects confidence and engagement.")
    else:
        weaknesses.append(f"Eye contact was low ({eye_contact:.0f}%) — practice looking directly at the camera lens while speaking.")
        suggestions.append("Place a small sticky note near your camera to remind yourself to look at it.")

    if face_visibility >= 80:
        strengths.append(f"Face was clearly visible throughout ({face_visibility:.0f}%) — good camera positioning and lighting.")
    else:
        weaknesses.append(f"Face was not always visible ({face_visibility:.0f}%) — ensure good lighting and camera angle.")
        suggestions.append("Position your camera at eye level and ensure your face is well-lit from the front.")

    if head_stability >= 70:
        strengths.append(f"Head movement was controlled and stable ({head_stability:.0f}%) — shows composure.")
    else:
        weaknesses.append(f"Excessive head movement detected ({head_stability:.0f}%) — try to sit still and relax your body.")
        suggestions.append("Sit in a comfortable chair with back support to reduce nervous movement.")

    if filler_count <= 5:
        strengths.append(f"Minimal filler words ({filler_count} detected) — clear and articulate communication.")
    else:
        weaknesses.append(f"{filler_count} filler words detected (um, uh, like, etc.) — slows down and weakens your message.")
        suggestions.append("Pause briefly and take a breath instead of using filler words. Silence is acceptable.")

    if 110 <= wpm <= 160:
        strengths.append(f"Speaking pace is ideal ({wpm} WPM) — easy to follow and understand.")
    elif wpm > 160:
        weaknesses.append(f"Speaking too fast ({wpm} WPM) — may be hard to follow. Aim for 110-160 WPM.")
        suggestions.append("Slow down by pausing at commas and periods in your mental script.")
    elif wpm > 0:
        weaknesses.append(f"Speaking pace is slow ({wpm} WPM) — try to maintain 110-150 WPM for clarity.")
        suggestions.append("Practice your answers aloud to build a natural, confident speaking rhythm.")

    if communication >= 70:
        strengths.append("Communication was clear and structured overall.")
    else:
        suggestions.append("Structure your answers using Situation → Task → Action → Result (STAR method).")

    # Generate answer evaluations
    answer_evals = _parse_qa_from_transcript(transcript, questions or [])
    answered_count = sum(1 for e in answer_evals if e["answer"] != "(No answer recorded)")
    total_count = len(questions) if questions else 0

    summary = f"Interview completed using local rule-based analysis. You attempted {answered_count} of {total_count} questions. "
    if eye_contact < 70 or head_stability < 70 or filler_count > 5:
        summary += "Focus on maintaining direct eye contact with the camera and minimizing filler words to present yourself more confidently."
    else:
        summary += "You demonstrated solid non-verbal presentation and clear communication pace."

    return {
        "summary": summary,
        "strengths": strengths[:5],
        "weaknesses": weaknesses[:5],
        "communication_feedback": [
            f"Words per minute: {wpm} (ideal: 110-160).",
            f"Filler words detected: {filler_count} — work to reduce these.",
            "Use deliberate pauses for emphasis rather than filler words.",
        ],
        "body_language_feedback": [
            f"Eye contact score: {eye_contact:.0f}/100.",
            f"Head stability score: {head_stability:.0f}/100.",
            "Maintain a natural, relaxed posture throughout the interview.",
        ],
        "improvement_suggestions": suggestions[:5],
        "overall_video_score": int(overall_score),
        "transparency_breakdown": {
            "eye_contact": round(eye_contact),
            "communication": round(communication),
            "posture": round(head_stability),
            "confidence": round(confidence),
        },
        "answer_evaluations": answer_evals,
    }


# ─── DB Helpers ──────────────────────────────────────────────────────────────

def _session_exists(session_id: str) -> bool:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT session_id FROM ai_interview_sessions WHERE session_id = :sid"),
            {"sid": session_id},
        ).first()
    return row is not None


def _get_session_questions(session_id: str) -> list:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT questions_json FROM ai_interview_sessions WHERE session_id = :sid"),
            {"sid": session_id},
        ).first()
    if not row:
        return []
    try:
        return json.loads(row[0] or "[]")
    except Exception:
        return []


def _analysis_exists(session_id: str) -> int | None:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT analysis_id FROM video_interview_analysis WHERE session_id = :sid"),
            {"sid": session_id},
        ).first()
    return row[0] if row else None


def _save_analysis(
    session_id: str,
    user_id: int,
    eye_contact: float,
    face_visibility: float,
    head_stability: float,
    speech_clarity: float,
    communication: float,
    filler_count: int,
    wpm: int,
    confidence: float,
    overall_score: float,
    transcript: str,
    transparency: float,
    source: str,
) -> int:
    with engine.begin() as conn:
        result = conn.execute(
            text("""
                INSERT INTO video_interview_analysis
                  (session_id, user_id,
                   eye_contact_score, face_visibility_score, head_stability_score,
                   speech_clarity_score, communication_score,
                   filler_words_count, words_per_minute,
                   confidence_score, overall_video_score,
                   transcript, transparency_score, analysis_source)
                VALUES
                  (:session_id, :user_id,
                   :eye_contact, :face_visibility, :head_stability,
                   :speech_clarity, :communication,
                   :filler_count, :wpm,
                   :confidence, :overall_score,
                   :transcript, :transparency, :source)
            """),
            {
                "session_id": session_id, "user_id": user_id,
                "eye_contact": eye_contact, "face_visibility": face_visibility,
                "head_stability": head_stability,
                "speech_clarity": speech_clarity, "communication": communication,
                "filler_count": filler_count, "wpm": wpm,
                "confidence": confidence, "overall_score": overall_score,
                "transcript": transcript, "transparency": transparency, "source": source,
            },
        )
        return result.lastrowid


def _update_feedback(
    session_id: str,
    strengths: list,
    weaknesses: list,
    suggestions: list,
    overall_score: float,
    source: str,
    summary: str = "",
    answer_evaluations: list = None,
    confidence_score: float | None = None,
) -> None:
    if answer_evaluations is None:
        answer_evaluations = []
    # Build the UPDATE query — optionally patch confidence_score when provided
    extra_set = ", confidence_score = :confidence_score" if confidence_score is not None else ""
    with engine.begin() as conn:
        params = {
            "strengths": json.dumps(strengths),
            "weaknesses": json.dumps(weaknesses),
            "suggestions": json.dumps(suggestions),
            "overall_score": overall_score,
            "source": source,
            "summary": summary,
            "answer_evaluations": json.dumps(answer_evaluations),
            "session_id": session_id,
        }
        if confidence_score is not None:
            params["confidence_score"] = confidence_score
        conn.execute(
            text(f"""
                UPDATE video_interview_analysis
                SET strengths_json = :strengths,
                    weaknesses_json = :weaknesses,
                    improvement_suggestions_json = :suggestions,
                    overall_video_score = :overall_score,
                    analysis_source = :source,
                    summary = :summary,
                    answer_evaluations_json = :answer_evaluations
                    {extra_set}
                WHERE session_id = :session_id
            """),
            params,
        )


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    session_id: str
    user_id: int


class UploadAnalysisRequest(BaseModel):
    session_id: str
    user_id: int
    # MediaPipe raw metrics from browser (0-100 scale)
    eye_contact_score: float = Field(default=0, ge=0, le=100)
    face_visibility_score: float = Field(default=0, ge=0, le=100)
    head_stability_score: float = Field(default=0, ge=0, le=100)
    # Transcript (combined from all questions)
    transcript: str = ""
    # Interview duration in seconds
    duration_seconds: float = Field(default=0, ge=0)


class GenerateFeedbackRequest(BaseModel):
    session_id: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/start-session")
def start_session(payload: StartSessionRequest):
    """Validate that the AI interview session exists before starting video capture."""
    if not _session_exists(payload.session_id):
        raise HTTPException(
            status_code=404,
            detail="Interview session not found. Please start an AI interview first.",
        )
    questions = _get_session_questions(payload.session_id)
    return {
        "status": "ready",
        "session_id": payload.session_id,
        "question_count": len(questions),
        "message": "Session validated. Video interview can begin.",
    }


@router.post("/upload-analysis")
def upload_analysis(payload: UploadAnalysisRequest, request: Request):
    """
    Receive MediaPipe metrics + transcript from the browser.
    Computes all derived scores and saves to DB.
    """
    # Read user_id from header if not provided
    user_id = payload.user_id
    if not user_id:
        hdr = request.headers.get("X-User-Id")
        try:
            user_id = int(hdr) if hdr else None
        except (ValueError, TypeError):
            user_id = None

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required.")

    if not _session_exists(payload.session_id):
        raise HTTPException(status_code=404, detail="Interview session not found.")

    # Compute speech metrics from transcript
    transcript = payload.transcript.strip()
    if not transcript or _is_gibberish_or_empty(transcript):
        filler_count = 0
        wpm = 0
        speech_clarity = 0.0
        filler_score = 0.0
        communication = 0.0
        confidence = 0.0
        overall_score = 0.0
        transparency = 0.0
    else:
        filler_data = _count_filler_words(transcript)
        filler_count = filler_data["total"]
        wpm = _calculate_wpm(transcript, payload.duration_seconds)

        # Compute derived scores
        speech_clarity  = _speech_clarity_score(filler_count, wpm)
        filler_score    = _filler_word_score(filler_count)
        communication   = _compute_communication_score(speech_clarity, filler_score, wpm)
        confidence      = _compute_confidence_score(
            payload.eye_contact_score,
            payload.head_stability_score,
            payload.face_visibility_score,
            speech_clarity,
            filler_score,
        )
        overall_score   = round((confidence * 0.6 + speech_clarity * 0.4), 2)
        transparency    = _compute_transparency_score(
            payload.eye_contact_score, communication,
            payload.head_stability_score, confidence,
        )

    # Delete any previous analysis for this session (allow re-submission)
    try:
        with engine.begin() as conn:
            conn.execute(
                text("DELETE FROM video_interview_analysis WHERE session_id = :sid"),
                {"sid": payload.session_id},
            )
    except Exception:
        pass

    analysis_id = _save_analysis(
        session_id=payload.session_id,
        user_id=user_id,
        eye_contact=payload.eye_contact_score,
        face_visibility=payload.face_visibility_score,
        head_stability=payload.head_stability_score,
        speech_clarity=speech_clarity,
        communication=communication,
        filler_count=filler_count,
        wpm=wpm,
        confidence=confidence,
        overall_score=overall_score,
        transcript=transcript,
        transparency=transparency,
        source="mediapipe",
    )

    return {
        "status": "saved",
        "analysis_id": analysis_id,
        "scores": {
            "eye_contact_score": payload.eye_contact_score,
            "face_visibility_score": payload.face_visibility_score,
            "head_stability_score": payload.head_stability_score,
            "speech_clarity_score": speech_clarity,
            "communication_score": communication,
            "filler_words_count": filler_count,
            "words_per_minute": wpm,
            "confidence_score": confidence,
            "overall_video_score": overall_score,
            "transparency_score": transparency,
        },
        "filler_breakdown": filler_data["breakdown"],
    }


@router.post("/generate-feedback")
def generate_feedback(payload: GenerateFeedbackRequest):
    """
    Retrieve the saved analysis, call Groq AI for qualitative feedback,
    and update the DB record with strengths/weaknesses/suggestions.
    """
    analysis_id = _analysis_exists(payload.session_id)
    if not analysis_id:
        raise HTTPException(
            status_code=404,
            detail="No analysis found for this session. Call /upload-analysis first.",
        )

    # Load the saved analysis row
    with engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT eye_contact_score, face_visibility_score, head_stability_score,
                       speech_clarity_score, communication_score,
                       filler_words_count, words_per_minute,
                       confidence_score, overall_video_score, transcript
                FROM video_interview_analysis
                WHERE session_id = :sid
            """),
            {"sid": payload.session_id},
        ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    questions = _get_session_questions(payload.session_id)

    # Try Groq AI feedback
    ai_result = _generate_ai_feedback(
        transcript=row["transcript"] or "",
        questions=questions,
        eye_contact=float(row["eye_contact_score"]),
        face_visibility=float(row["face_visibility_score"]),
        head_stability=float(row["head_stability_score"]),
        communication=float(row["communication_score"]),
        confidence=float(row["confidence_score"]),
        overall_score=float(row["overall_video_score"]),
        filler_count=int(row["filler_words_count"]),
        wpm=int(row["words_per_minute"]),
    )

    used_ai = ai_result is not None
    if not ai_result:
        ai_result = _fallback_ai_feedback(
            eye_contact=float(row["eye_contact_score"]),
            face_visibility=float(row["face_visibility_score"]),
            head_stability=float(row["head_stability_score"]),
            communication=float(row["communication_score"]),
            confidence=float(row["confidence_score"]),
            overall_score=float(row["overall_video_score"]),
            filler_count=int(row["filler_words_count"]),
            wpm=int(row["words_per_minute"]),
            transcript=row["transcript"] or "",
            questions=questions,
        )

    # ── Recompute confidence_score including answer content quality ────────────
    answer_evaluations = ai_result.get("answer_evaluations", [])
    answer_content_score = _compute_answer_content_score(answer_evaluations)
    
    # Count how many answers are actually valid (not skipped or gibberish)
    valid_answers_count = sum(
        1 for e in answer_evaluations
        if e.get("answer") and e.get("answer") != "(No answer recorded)" and not _is_gibberish_or_empty(e.get("answer"))
    )

    updated_confidence = _compute_confidence_score(
        eye_contact=float(row["eye_contact_score"]),
        head_stability=float(row["head_stability_score"]),
        face_visibility=float(row["face_visibility_score"]),
        speech_clarity=float(row["speech_clarity_score"]),
        filler_score=max(0, 100 - int(row["filler_words_count"]) * 5),
        answer_content_score=answer_content_score,
    )
    updated_overall = round((updated_confidence * 0.6 + float(row["speech_clarity_score"]) * 0.4), 2)
    
    ai_overall = ai_result.get("overall_video_score", None)
    
    if ai_overall is not None:
        # Trust the AI score. However, if there are no valid answers, overall score must be 0.
        if valid_answers_count == 0:
            final_overall = 0.0
        elif answer_content_score < 35:
            # Enforce that poor content limits the maximum score to below 40
            final_overall = min(float(ai_overall), 39.0)
        else:
            final_overall = float(ai_overall)
    else:
        # Fallback when AI score is missing
        if valid_answers_count == 0:
            final_overall = 0.0
        elif answer_content_score < 35:
            final_overall = min(updated_overall, 39.0)
        else:
            final_overall = updated_overall

    logger.info(
        "[VideoInterview] Scores updated — answer_content=%.1f, confidence=%.1f→%.1f, overall=%.1f",
        answer_content_score, float(row["confidence_score"]), updated_confidence, final_overall,
    )

    # Attach updated scores to ai_result so they're returned in the response
    ai_result["answer_content_score"] = answer_content_score
    ai_result["updated_confidence_score"] = updated_confidence
    ai_result["overall_video_score"] = final_overall

    source = "hybrid" if used_ai else "mediapipe"
    _update_feedback(
        session_id=payload.session_id,
        strengths=ai_result.get("strengths", []),
        weaknesses=ai_result.get("weaknesses", []),
        suggestions=ai_result.get("improvement_suggestions", []),
        overall_score=final_overall,
        source=source,
        summary=ai_result.get("summary", ""),
        answer_evaluations=answer_evaluations,
        confidence_score=updated_confidence,
    )

    return {
        "status": "feedback_generated",
        "session_id": payload.session_id,
        "source": source,
        "feedback": ai_result,
    }


@router.get("/report/{session_id}")
def get_report(session_id: str):
    """Return the full video interview analysis report for a session."""
    with engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT
                  v.analysis_id, v.session_id, v.user_id,
                  v.eye_contact_score, v.face_visibility_score, v.head_stability_score,
                  v.speech_clarity_score, v.communication_score,
                  v.filler_words_count, v.words_per_minute,
                  v.confidence_score, v.overall_video_score,
                  v.transcript,
                  v.strengths_json, v.weaknesses_json, v.improvement_suggestions_json,
                  v.summary, v.answer_evaluations_json,
                  v.transparency_score, v.analysis_source,
                  v.created_at,
                  s.desired_role, s.experience_level
                FROM video_interview_analysis v
                JOIN ai_interview_sessions s ON s.session_id = v.session_id
                WHERE v.session_id = :sid
            """),
            {"sid": session_id},
        ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="No video analysis report found for this session.")

    def _parse_json(val):
        if not val:
            return []
        try:
            return json.loads(val)
        except Exception:
            return []

    return {
        "analysis_id": row["analysis_id"],
        "session_id": row["session_id"],
        "user_id": row["user_id"],
        "desired_role": row["desired_role"],
        "experience_level": row["experience_level"],
        "scores": {
            "eye_contact_score": float(row["eye_contact_score"]),
            "face_visibility_score": float(row["face_visibility_score"]),
            "head_stability_score": float(row["head_stability_score"]),
            "speech_clarity_score": float(row["speech_clarity_score"]),
            "communication_score": float(row["communication_score"]),
            "filler_words_count": int(row["filler_words_count"]),
            "words_per_minute": int(row["words_per_minute"]),
            "confidence_score": float(row["confidence_score"]),
            "overall_video_score": float(row["overall_video_score"]),
            "transparency_score": float(row["transparency_score"]),
        },
        "transcript": row["transcript"] or "",
        "summary": row["summary"] or "",
        "answer_evaluations": _parse_json(row["answer_evaluations_json"]),
        "feedback": {
            "strengths": _parse_json(row["strengths_json"]),
            "weaknesses": _parse_json(row["weaknesses_json"]),
            "improvement_suggestions": _parse_json(row["improvement_suggestions_json"]),
        },
        "analysis_source": row["analysis_source"],
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }
