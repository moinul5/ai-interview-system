import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.database import engine

try:
    from groq import Groq
except Exception:  # pragma: no cover - keeps server bootable if dependency is missing
    Groq = None

router = APIRouter(prefix="/api/interviews", tags=["AI Interviews"])


class CandidateProfile(BaseModel):
    desired_role: str = Field(..., min_length=1)
    experience_level: Literal["junior", "mid", "senior"] = "mid"
    current_skills: list[str] = []
    target_skills: list[str] = []
    industry: str | None = None
    interview_focus: str | None = None


class CreateInterviewRequest(BaseModel):
    candidate_profile: CandidateProfile
    question_count: int = Field(default=5, ge=3, le=10)
    user_id: int | None = None


class InterviewQuestion(BaseModel):
    id: str
    question: str
    competency: str
    ideal_answer_signals: list[str] = []


class CreateInterviewResponse(BaseModel):
    session_id: str
    questions: list[InterviewQuestion]
    source: str


class AnswerItem(BaseModel):
    question_id: str
    answer: str = ""


class SubmitInterviewRequest(BaseModel):
    answers: list[AnswerItem]
    interviewer_notes: str | None = None


_sessions: dict[str, dict[str, Any]] = {}


def _clean_json(text: str) -> str:
    """Extract JSON from a model response that may include markdown fences."""
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        text = fenced.group(1).strip()
    start = min([i for i in [text.find("{"), text.find("[")] if i != -1], default=0)
    end_obj = text.rfind("}")
    end_arr = text.rfind("]")
    end = max(end_obj, end_arr)
    if end >= start:
        return text[start : end + 1]
    return text


def _groq_client() -> Any | None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.startswith("your_") or Groq is None:
        return None
    return Groq(api_key=api_key)


def _profile_text(profile: CandidateProfile) -> str:
    return (
        f"Role: {profile.desired_role}\n"
        f"Experience: {profile.experience_level}\n"
        f"Current skills: {', '.join(profile.current_skills) or 'Not provided'}\n"
        f"Target skills: {', '.join(profile.target_skills) or 'Not provided'}\n"
        f"Industry: {profile.industry or 'General'}\n"
        f"Focus: {profile.interview_focus or 'General interview readiness'}"
    )


def _fallback_questions(profile: CandidateProfile, count: int) -> list[dict[str, Any]]:
    role = profile.desired_role.strip() or "the target role"
    skills = profile.target_skills or profile.current_skills or ["problem solving", "communication", "technical fundamentals"]
    templates = [
        (
            f"Tell me about a recent project that proves you are ready for a {role} role.",
            "Experience & impact",
            ["Clear project context", "Your personal contribution", "Measurable result or learning"],
        ),
        (
            f"Explain a difficult technical problem you solved using {skills[0]}.",
            skills[0],
            ["Problem breakdown", "Trade-offs considered", "Final solution and why it worked"],
        ),
        (
            f"How would you design and deliver a reliable solution for a real business requirement as a {role}?",
            "System thinking",
            ["Requirements clarification", "Architecture/components", "Testing, monitoring, and failure handling"],
        ),
        (
            "Describe a time you received critical feedback. How did you respond and improve?",
            "Growth mindset",
            ["Specific feedback", "Actions taken", "Observable improvement"],
        ),
        (
            f"What are your biggest gaps for becoming stronger in {role}, and what is your learning plan?",
            "Self-awareness",
            ["Honest gap analysis", "Prioritized plan", "Timeline and practice method"],
        ),
        (
            "Walk me through how you debug a production issue under pressure.",
            "Debugging",
            ["Triage steps", "Root-cause analysis", "Communication and prevention"],
        ),
        (
            "How do you balance speed, code quality, and maintainability?",
            "Engineering judgment",
            ["Practical examples", "Trade-offs", "Team/process awareness"],
        ),
        (
            f"Teach me one concept from {skills[-1]} as if I am a junior teammate.",
            skills[-1],
            ["Simple explanation", "Example or analogy", "Checks for understanding"],
        ),
        (
            "Tell me about a time you worked with others to solve a conflict or unblock a project.",
            "Collaboration",
            ["Situation and stakeholders", "Communication approach", "Outcome"],
        ),
        (
            f"Why should a team hire you for a {role} position right now?",
            "Role fit",
            ["Relevant strengths", "Evidence from experience", "Clear motivation"],
        ),
    ]
    return [
        {"id": f"q{i + 1}", "question": q, "competency": c, "ideal_answer_signals": s}
        for i, (q, c, s) in enumerate(templates[:count])
    ]


def _generate_questions_with_groq(profile: CandidateProfile, count: int) -> list[dict[str, Any]] | None:
    client = _groq_client()
    if not client:
        return None

    prompt = f"""
Create {count} personalized interview questions for this candidate profile:
{_profile_text(profile)}

Return only valid JSON as an array. Each item must have:
- id: q1, q2, etc.
- question: one open-ended interview question
- competency: short skill/category
- ideal_answer_signals: 3 concise bullet signals of a strong answer
Do not include markdown.
""".strip()

    try:
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            messages=[
                {"role": "system", "content": "You are an expert technical interviewer. Return strict JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1800,
        )
        content = completion.choices[0].message.content or "[]"
        data = json.loads(_clean_json(content))
        if not isinstance(data, list):
            return None
        questions = []
        for i, item in enumerate(data[:count], start=1):
            questions.append(
                {
                    "id": str(item.get("id") or f"q{i}"),
                    "question": str(item.get("question") or "").strip(),
                    "competency": str(item.get("competency") or "General").strip(),
                    "ideal_answer_signals": [str(x) for x in item.get("ideal_answer_signals", [])][:4],
                }
            )
        questions = [q for q in questions if q["question"]]
        return questions if len(questions) >= 3 else None
    except Exception:
        return None


def _fallback_evaluation(profile: CandidateProfile, questions: list[dict[str, Any]], answers: list[AnswerItem]) -> dict[str, Any]:
    answer_map = {a.question_id: a.answer.strip() for a in answers}
    lengths = [len(answer_map.get(q["id"], "")) for q in questions]
    answered = sum(1 for length in lengths if length > 0)
    avg_len = sum(lengths) / max(len(lengths), 1)
    score = min(95, int((answered / max(len(questions), 1)) * 45 + min(avg_len / 350, 1) * 35 + 10))

    target_skills = profile.target_skills or profile.current_skills or ["Technical fundamentals", "Communication"]
    gaps = []
    if answered < len(questions):
        gaps.append("Some questions were left unanswered; complete every answer for a stronger interview result.")
    if avg_len < 120:
        gaps.append("Answers are too short. Add context, action, result, and specific examples.")
    gaps.append("Practice structuring answers with the STAR method and measurable outcomes.")

    return {
        "score": score,
        "summary": f"You answered {answered} of {len(questions)} questions for the {profile.desired_role} role. The evaluation is based on completeness, specificity, and interview structure.",
        "strengths": [
            "You completed an interview flow tailored to your target role.",
            "Your selected skills and goals give a clear direction for practice.",
        ],
        "gaps": gaps[:4],
        "skill_gaps": [
            {"skill": skill, "priority": min(5, i + 3), "reason": f"Keep practicing {skill} with project-based examples and mock interview answers."}
            for i, skill in enumerate(target_skills[:4])
        ],
        "next_steps": [
            "Rewrite weak answers using Situation, Task, Action, Result.",
            "Prepare 2-3 project stories with metrics and trade-offs.",
            "Run another mock interview focused on the highest-priority skill gap.",
        ],
    }


def _courses_for(profile: CandidateProfile, skill_gaps: list[dict[str, Any]]) -> list[dict[str, Any]]:
    skills = [sg.get("skill") for sg in skill_gaps if sg.get("skill")] or profile.target_skills or [profile.desired_role]
    courses = []
    for skill in skills[:4]:
        query = str(skill).replace(" ", "+")
        courses.append(
            {
                "title": f"{skill} Interview Practice Roadmap",
                "provider": "Free resources",
                "url": f"https://www.youtube.com/results?search_query={query}+interview+preparation",
                "description": f"Free videos and practice material to improve {skill} for interviews.",
                "relevance": f"Targets your {skill} gap",
                "difficulty": "intermediate",
                "estimated_duration_hours": 6,
            }
        )
    return courses


def _evaluate_with_groq(profile: CandidateProfile, questions: list[dict[str, Any]], answers: list[AnswerItem]) -> dict[str, Any] | None:
    client = _groq_client()
    if not client:
        return None

    answer_map = {a.question_id: a.answer for a in answers}
    qa_text = "\n\n".join(
        f"Question: {q['question']}\nAnswer: {answer_map.get(q['id'], '')}"
        for q in questions
    )
    prompt = f"""
Evaluate this mock interview for the profile below.
{_profile_text(profile)}

Interview Q&A:
{qa_text}

Return only valid JSON with this shape:
{{
  "score": number from 0 to 100,
  "summary": "short paragraph",
  "strengths": ["..."],
  "gaps": ["..."],
  "skill_gaps": [{{"skill":"...", "priority": 1-5, "reason":"..."}}],
  "next_steps": ["..."]
}}
""".strip()

    try:
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            messages=[
                {"role": "system", "content": "You are a constructive interview evaluator. Return strict JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=1800,
        )
        content = completion.choices[0].message.content or "{}"
        data = json.loads(_clean_json(content))
        if not isinstance(data, dict):
            return None
        data["score"] = max(0, min(100, int(data.get("score", 0))))
        data.setdefault("summary", "Interview evaluation completed.")
        data.setdefault("strengths", [])
        data.setdefault("gaps", [])
        data.setdefault("skill_gaps", [])
        data.setdefault("next_steps", [])
        return data
    except Exception:
        return None


def _db_save_session(
    session_id: str,
    payload: CreateInterviewRequest,
    questions: list[dict[str, Any]],
    source: str,
) -> None:
    """Persist generated interview session so it survives server restart."""
    profile = payload.candidate_profile
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO ai_interview_sessions
                  (session_id, user_id, desired_role, experience_level,
                   current_skills, target_skills, industry, interview_focus,
                   question_count, questions_json, source)
                VALUES
                  (:session_id, :user_id, :desired_role, :experience_level,
                   :current_skills, :target_skills, :industry, :interview_focus,
                   :question_count, :questions_json, :source)
                """
            ),
            {
                "session_id": session_id,
                "user_id": payload.user_id,
                "desired_role": profile.desired_role,
                "experience_level": profile.experience_level,
                "current_skills": json.dumps(profile.current_skills),
                "target_skills": json.dumps(profile.target_skills),
                "industry": profile.industry,
                "interview_focus": profile.interview_focus,
                "question_count": payload.question_count,
                "questions_json": json.dumps(questions),
                "source": source,
            },
        )


def _db_load_session(session_id: str) -> dict[str, Any] | None:
    """Load interview session from DB when it is not present in memory."""
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT session_id, desired_role, experience_level, current_skills,
                       target_skills, industry, interview_focus, questions_json, source, created_at
                FROM ai_interview_sessions
                WHERE session_id = :session_id
                """
            ),
            {"session_id": session_id},
        ).mappings().first()
    if not row:
        return None
    try:
        current_skills = json.loads(row["current_skills"] or "[]")
    except Exception:
        current_skills = []
    try:
        target_skills = json.loads(row["target_skills"] or "[]")
    except Exception:
        target_skills = []
    try:
        questions = json.loads(row["questions_json"] or "[]")
    except Exception:
        questions = []
    return {
        "profile": {
            "desired_role": row["desired_role"],
            "experience_level": row["experience_level"],
            "current_skills": current_skills,
            "target_skills": target_skills,
            "industry": row["industry"],
            "interview_focus": row["interview_focus"],
        },
        "questions": questions,
        "source": row["source"],
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }


def _db_save_evaluation(
    session_id: str,
    evaluation: dict[str, Any],
    courses: list[dict[str, Any]],
    source: str,
) -> None:
    """Persist evaluation result for history/reporting."""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO ai_interview_evaluations
                  (session_id, score, summary, strengths_json, gaps_json,
                   skill_gaps_json, next_steps_json, courses_json, source)
                VALUES
                  (:session_id, :score, :summary, :strengths_json, :gaps_json,
                   :skill_gaps_json, :next_steps_json, :courses_json, :source)
                """
            ),
            {
                "session_id": session_id,
                "score": int(evaluation.get("score", 0)),
                "summary": evaluation.get("summary"),
                "strengths_json": json.dumps(evaluation.get("strengths", [])),
                "gaps_json": json.dumps(evaluation.get("gaps", [])),
                "skill_gaps_json": json.dumps(evaluation.get("skill_gaps", [])),
                "next_steps_json": json.dumps(evaluation.get("next_steps", [])),
                "courses_json": json.dumps(courses),
                "source": source,
            },
        )


@router.post("", response_model=CreateInterviewResponse)
def create_interview(payload: CreateInterviewRequest, request: Request) -> CreateInterviewResponse:
    # Read user_id from X-User-Id header (sent by frontend apiClient)
    header_user_id = request.headers.get("X-User-Id")
    if header_user_id and payload.user_id is None:
        try:
            payload.user_id = int(header_user_id)
        except (ValueError, TypeError):
            pass

    questions = _generate_questions_with_groq(payload.candidate_profile, payload.question_count)
    source = "groq" if questions else "fallback"
    if questions is None:
        questions = _fallback_questions(payload.candidate_profile, payload.question_count)

    session_id = str(uuid4())
    _sessions[session_id] = {
        "profile": payload.candidate_profile.model_dump(),
        "questions": questions,
        "source": source,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        _db_save_session(session_id, payload, questions, source)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Interview session generated but database save failed. Import the latest schema_extensions.sql or ai_interview_system.sql.",
                "error": str(e),
            },
        )
    return CreateInterviewResponse(session_id=session_id, questions=questions, source=source)


@router.post("/{session_id}/submit")
def submit_interview(session_id: str, payload: SubmitInterviewRequest) -> dict[str, Any]:
    session = _sessions.get(session_id)
    if not session:
        try:
            session = _db_load_session(session_id)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail={"message": "Failed to load interview session from database", "error": str(e)},
            )
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found. Please start a new interview.")

    profile = CandidateProfile(**session["profile"])
    questions = session["questions"]
    evaluation = _evaluate_with_groq(profile, questions, payload.answers)
    source = "groq" if evaluation else "fallback"
    if evaluation is None:
        evaluation = _fallback_evaluation(profile, questions, payload.answers)

    courses = _courses_for(profile, evaluation.get("skill_gaps", []))
    try:
        _db_save_evaluation(session_id, evaluation, courses, source)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Evaluation completed but database save failed. Import the latest schema_extensions.sql or ai_interview_system.sql.",
                "error": str(e),
            },
        )

    return {
        "session_id": session_id,
        "evaluation": evaluation,
        "recommended_courses": courses,
        "source": source,
    }
