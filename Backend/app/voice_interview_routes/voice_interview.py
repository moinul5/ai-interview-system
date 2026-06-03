"""
voice_interview.py
------------------
Backend APIs for the Voice Interview System.

Endpoints provided:
  GET  /voice-interview/                      – Test / health-check
  POST /voice-interview/start                 – AI-generated voice questions (Groq)
  POST /voice-interview/evaluate              – Evaluate a transcript against a question

  GET  /interview/questions/voice             – Frontend-compatible: fetch from DB
  POST /interview/submit/voice                – Frontend-compatible: accept FormData, evaluate, persist

DB Tables used:
  - questions        (question_id, question_text, category, difficulty, expected_answer)
  - voice_answers    (va_id, question_id, answer_text, audio_path, submitted_at)
  - voice_ai_feedback(vf_id, va_id, score, feedback_text, improvement, confidence_level)
"""

import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.database import engine

# ── Groq client (same pattern as interview.py) ──────────────────────────────

try:
    from groq import Groq
except Exception:
    Groq = None


def _groq_client() -> Any | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key.startswith("your_") or Groq is None:
        return None
    return Groq(api_key=api_key)


def _clean_json(raw: str) -> str:
    """Extract JSON from a model response that may include markdown fences."""
    raw = raw.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", raw, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        raw = fenced.group(1).strip()
    start = min([i for i in [raw.find("{"), raw.find("[")] if i != -1], default=0)
    end = max(raw.rfind("}"), raw.rfind("]"))
    if end >= start:
        return raw[start : end + 1]
    return raw


# ── Upload directory ─────────────────────────────────────────────────────────

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "audio"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ── Pydantic models ─────────────────────────────────────────────────────────

class VoiceStartRequest(BaseModel):
    category: str | None = None
    difficulty: str | None = None
    count: int = Field(default=5, ge=1, le=10)


class VoiceEvaluateRequest(BaseModel):
    question: str
    expected_answer: str | None = None
    transcript: str


# ── Router ───────────────────────────────────────────────────────────────────

router = APIRouter(tags=["Voice Interview"])


# ─────────────────────────────────────────────────────────────────────────────
# 1) GET /voice-interview/   — test / health-check
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/voice-interview/")
def voice_interview_test():
    return {
        "status": "ok",
        "message": "Voice Interview API is running",
        "groq_available": _groq_client() is not None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2) POST /voice-interview/start   — AI-generated voice questions
# ─────────────────────────────────────────────────────────────────────────────

_FALLBACK_VOICE_QUESTIONS: list[dict[str, Any]] = [
    {"question_id": "vq1", "question_text": "Explain the difference between SQL and NoSQL databases.", "category": "DBMS", "difficulty": "medium"},
    {"question_id": "vq2", "question_text": "What is normalization and why is it used?", "category": "DBMS", "difficulty": "easy"},
    {"question_id": "vq3", "question_text": "What is the difference between a process and a thread?", "category": "Operating Systems", "difficulty": "medium"},
    {"question_id": "vq4", "question_text": "Explain what a REST API is and how it works.", "category": "Web Development", "difficulty": "easy"},
    {"question_id": "vq5", "question_text": "What is Big O notation and why does it matter?", "category": "Algorithms", "difficulty": "medium"},
    {"question_id": "vq6", "question_text": "Describe the concept of polymorphism in OOP.", "category": "Programming", "difficulty": "medium"},
    {"question_id": "vq7", "question_text": "What is a binary search tree and what are its properties?", "category": "Data Structures", "difficulty": "medium"},
    {"question_id": "vq8", "question_text": "Explain the purpose of an operating system scheduler.", "category": "Operating Systems", "difficulty": "hard"},
    {"question_id": "vq9", "question_text": "What is dynamic programming? Give an example.", "category": "Algorithms", "difficulty": "hard"},
    {"question_id": "vq10", "question_text": "Explain the ACID properties in database systems.", "category": "DBMS", "difficulty": "hard"},
]


@router.post("/voice-interview/start")
def voice_interview_start(payload: VoiceStartRequest):
    """Generate voice interview questions using AI or fallback."""
    questions = _generate_voice_questions_with_groq(
        payload.category, payload.difficulty, payload.count
    )
    source = "groq"

    if questions is None:
        # Filter fallback by category/difficulty
        pool = _FALLBACK_VOICE_QUESTIONS
        if payload.category:
            pool = [q for q in pool if q["category"].lower() == payload.category.lower()]
        if payload.difficulty:
            pool = [q for q in pool if q["difficulty"].lower() == payload.difficulty.lower()]
        if not pool:
            pool = _FALLBACK_VOICE_QUESTIONS
        questions = pool[: payload.count]
        source = "fallback"

    return {"questions": questions, "source": source, "count": len(questions)}


def _generate_voice_questions_with_groq(
    category: str | None, difficulty: str | None, count: int
) -> list[dict[str, Any]] | None:
    client = _groq_client()
    if not client:
        return None

    cat_text = f"Category: {category}" if category else "Category: General/mixed"
    diff_text = f"Difficulty: {difficulty}" if difficulty else "Difficulty: mixed"

    prompt = f"""
Generate {count} voice interview questions for a technical interview.
{cat_text}
{diff_text}

Return only valid JSON as an array. Each item must have:
- question_id: vq1, vq2, etc.
- question_text: one open-ended interview question suitable for spoken answers
- category: short category name
- difficulty: easy, medium, or hard
Do not include markdown fences.
""".strip()

    try:
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            messages=[
                {"role": "system", "content": "You are a technical interview question generator. Return strict JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1500,
        )
        content = completion.choices[0].message.content or "[]"
        data = json.loads(_clean_json(content))
        if not isinstance(data, list) or len(data) < 1:
            return None
        questions = []
        for i, item in enumerate(data[:count], start=1):
            questions.append({
                "question_id": str(item.get("question_id") or f"vq{i}"),
                "question_text": str(item.get("question_text") or "").strip(),
                "category": str(item.get("category") or category or "General").strip(),
                "difficulty": str(item.get("difficulty") or difficulty or "medium").strip(),
            })
        questions = [q for q in questions if q["question_text"]]
        return questions if questions else None
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 3) POST /voice-interview/evaluate   — evaluate a single transcript
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/voice-interview/evaluate")
def voice_interview_evaluate(payload: VoiceEvaluateRequest):
    """Evaluate a spoken transcript against a question."""
    result = _evaluate_transcript_with_groq(
        payload.question, payload.transcript, payload.expected_answer
    )
    source = "groq"

    if result is None:
        result = _fallback_evaluate(payload.question, payload.transcript, payload.expected_answer)
        source = "fallback"

    result["source"] = source
    return result


def _evaluate_transcript_with_groq(
    question: str, transcript: str, expected_answer: str | None
) -> dict[str, Any] | None:
    client = _groq_client()
    if not client:
        return None

    expected_text = f"\nExpected answer for reference: {expected_answer}" if expected_answer else ""

    prompt = f"""
Evaluate the following spoken interview answer.

Question: {question}
{expected_text}

Candidate's spoken transcript:
\"\"\"{transcript}\"\"\"

Return only valid JSON with this exact shape:
{{
  "score": <number from 0.0 to 100.0>,
  "feedback_text": "<constructive feedback paragraph>",
  "improvement": "<specific improvement suggestions>",
  "confidence_level": <number from 0.0 to 1.0 representing how confident you are in the evaluation>
}}
""".strip()

    try:
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            messages=[
                {"role": "system", "content": "You are an expert interview evaluator. Evaluate spoken answers fairly. Return strict JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        content = completion.choices[0].message.content or "{}"
        data = json.loads(_clean_json(content))
        if not isinstance(data, dict):
            return None
        return {
            "score": round(max(0, min(100, float(data.get("score", 0)))), 1),
            "feedback_text": str(data.get("feedback_text", "Evaluation completed.")),
            "improvement": str(data.get("improvement", "Keep practicing.")),
            "confidence_level": round(max(0, min(1, float(data.get("confidence_level", 0.5)))), 2),
        }
    except Exception:
        return None


def _fallback_evaluate(
    question: str, transcript: str, expected_answer: str | None
) -> dict[str, Any]:
    """Heuristic-based fallback when Groq is unavailable."""
    transcript = transcript.strip()
    length = len(transcript)

    if not transcript:
        return {
            "score": 0.0,
            "feedback_text": "No answer was recorded. Please try speaking clearly into the microphone.",
            "improvement": "Make sure your microphone is working and speak your answer clearly.",
            "confidence_level": 0.95,
        }

    # Simple heuristic scoring
    word_count = len(transcript.split())
    score = 0.0

    # Length score (up to 40 points)
    if word_count >= 50:
        score += 40
    elif word_count >= 30:
        score += 30
    elif word_count >= 15:
        score += 20
    else:
        score += 10

    # Keyword overlap with expected answer (up to 35 points)
    if expected_answer:
        expected_words = set(expected_answer.lower().split())
        transcript_words = set(transcript.lower().split())
        # Remove common stop words
        stop = {"the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for", "of", "and", "or", "it", "this", "that", "with", "as", "by"}
        expected_keywords = expected_words - stop
        transcript_keywords = transcript_words - stop
        if expected_keywords:
            overlap = len(expected_keywords & transcript_keywords) / len(expected_keywords)
            score += overlap * 35
        else:
            score += 15
    else:
        score += 15  # No expected answer to compare against

    # Coherence bonus (up to 15 points) — longer sentences suggest structure
    sentences = [s.strip() for s in re.split(r'[.!?]', transcript) if s.strip()]
    if len(sentences) >= 3:
        score += 15
    elif len(sentences) >= 2:
        score += 10
    else:
        score += 5

    # Baseline bonus (10 points for attempting)
    score += 10

    score = round(min(95, max(5, score)), 1)

    # Generate feedback
    if score >= 75:
        feedback = "Good answer! You covered the key concepts clearly. Your response was well-structured and showed solid understanding."
        improvement = "Try to include more specific examples or real-world scenarios to strengthen your answer further."
    elif score >= 50:
        feedback = "Decent attempt. You touched on relevant concepts but could be more specific and structured in your response."
        improvement = "Structure your answer using the STAR method (Situation, Task, Action, Result). Add concrete examples and technical details."
    elif score >= 25:
        feedback = "Your answer was brief and missed several key points. Try to elaborate more on the core concepts."
        improvement = "Review the topic thoroughly. Practice explaining concepts out loud. Aim for at least 3-4 complete sentences."
    else:
        feedback = "Your answer needs significant improvement. The response was too short or didn't address the question."
        improvement = "Study the topic in depth and practice speaking about it. Record yourself and listen back to identify gaps."

    confidence = round(0.5 + min(0.4, word_count / 200), 2)

    return {
        "score": score,
        "feedback_text": feedback,
        "improvement": improvement,
        "confidence_level": confidence,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4) GET /interview/questions/voice   — Frontend-compatible endpoint
#    Used by InterviewVoice.jsx line 68
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/interview/questions/voice")
def get_voice_questions(
    category: str | None = Query(None),
    difficulty: str | None = Query(None),
    limit: int = Query(5, ge=1, le=20),
):
    """Fetch voice interview questions from the questions table."""
    conditions = []
    params: dict[str, Any] = {"lim": limit}

    if category:
        conditions.append("q.category = :category")
        params["category"] = category
    if difficulty:
        conditions.append("q.difficulty = :difficulty")
        params["difficulty"] = difficulty

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    query = f"""
        SELECT q.question_id, q.question_text, q.category, q.difficulty
        FROM questions q
        {where}
        ORDER BY RAND()
        LIMIT :lim
    """

    try:
        with engine.connect() as conn:
            rows = conn.execute(text(query), params).mappings().all()

        questions = [
            {
                "question_id": row["question_id"],
                "question_text": row["question_text"],
                "category": row["category"],
                "difficulty": row["difficulty"],
            }
            for row in rows
        ]

        if not questions:
            # If DB has no questions, return fallback
            pool = _FALLBACK_VOICE_QUESTIONS
            if category:
                pool = [q for q in pool if q["category"].lower() == category.lower()] or pool
            if difficulty:
                pool = [q for q in pool if q["difficulty"].lower() == difficulty.lower()] or pool
            questions = pool[:limit]

        return {"questions": questions}

    except Exception:
        # DB unreachable — return fallback
        pool = _FALLBACK_VOICE_QUESTIONS
        if category:
            pool = [q for q in pool if q["category"].lower() == category.lower()] or pool
        if difficulty:
            pool = [q for q in pool if q["difficulty"].lower() == difficulty.lower()] or pool
        return {"questions": pool[:limit]}


# ─────────────────────────────────────────────────────────────────────────────
# 5) POST /interview/submit/voice   — Frontend-compatible endpoint
#    Used by InterviewVoice.jsx line 162
#    Accepts multipart/form-data: question_id, answer_text, audio_file?
#    Returns: { answer_id, score, feedback_text, confidence_level }
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/interview/submit/voice")
async def submit_voice_answer(
    question_id: int = Form(...),
    answer_text: str = Form(""),
    audio_file: UploadFile | None = File(None),
):
    """Accept a voice answer, evaluate it with AI, persist to DB."""

    # ── 1. Look up the question for context ──────────────────────────────────
    question_text = ""
    expected_answer = None
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT question_text, expected_answer FROM questions WHERE question_id = :qid"),
                {"qid": question_id},
            ).mappings().first()
        if row:
            question_text = row["question_text"]
            expected_answer = row["expected_answer"]
    except Exception:
        pass  # Proceed with evaluation even if DB lookup fails

    # ── 2. Save audio file (if provided) ─────────────────────────────────────
    audio_path = None
    if audio_file and audio_file.filename:
        ext = Path(audio_file.filename).suffix or ".webm"
        filename = f"voice_{question_id}_{uuid.uuid4().hex[:8]}{ext}"
        save_path = UPLOAD_DIR / filename
        try:
            content = await audio_file.read()
            save_path.write_bytes(content)
            audio_path = str(save_path.relative_to(Path(__file__).resolve().parent.parent.parent))
        except Exception:
            audio_path = None

    # ── 3. Evaluate the transcript ───────────────────────────────────────────
    transcript = answer_text.strip()

    evaluation = _evaluate_transcript_with_groq(
        question_text or f"Question ID {question_id}",
        transcript,
        expected_answer,
    )
    if evaluation is None:
        evaluation = _fallback_evaluate(
            question_text or f"Question ID {question_id}",
            transcript,
            expected_answer,
        )

    # ── 4. Persist to database ───────────────────────────────────────────────
    answer_id = None
    try:
        with engine.begin() as conn:
            # Insert voice answer
            result = conn.execute(
                text("""
                    INSERT INTO voice_answers (question_id, answer_text, audio_path)
                    VALUES (:question_id, :answer_text, :audio_path)
                """),
                {
                    "question_id": question_id,
                    "answer_text": transcript,
                    "audio_path": audio_path,
                },
            )
            va_id = result.lastrowid

            # Insert AI feedback
            conn.execute(
                text("""
                    INSERT INTO voice_ai_feedback (va_id, score, feedback_text, improvement, confidence_level)
                    VALUES (:va_id, :score, :feedback_text, :improvement, :confidence_level)
                """),
                {
                    "va_id": va_id,
                    "score": evaluation["score"],
                    "feedback_text": evaluation["feedback_text"],
                    "improvement": evaluation.get("improvement", ""),
                    "confidence_level": evaluation["confidence_level"],
                },
            )
            answer_id = va_id
    except Exception:
        # Evaluation still works even if DB save fails
        pass

    # ── 5. Return response matching frontend expectation ─────────────────────
    return {
        "answer_id": answer_id,
        "score": evaluation["score"],
        "feedback_text": evaluation["feedback_text"],
        "improvement": evaluation.get("improvement", ""),
        "confidence_level": evaluation["confidence_level"],
    }
