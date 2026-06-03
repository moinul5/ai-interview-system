import random
from typing import Optional

from fastapi import APIRouter, File, Form, Query, UploadFile
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/voice-interview", tags=["Voice Interview"])
voice_submit_router = APIRouter(prefix="/interview", tags=["Voice Interview Submit"])


class VoiceInterviewStartRequest(BaseModel):
    role: str = Field(..., example="Frontend Developer")
    level: str = Field(..., example="Beginner")
    question_count: int = Field(default=5, ge=1, le=10, example=3)

    @field_validator("level")
    @classmethod
    def validate_level(cls, value: str):
        allowed_levels = ["Beginner", "Intermediate", "Advanced"]

        if value not in allowed_levels:
            raise ValueError("Level must be Beginner, Intermediate, or Advanced")

        return value


class VoiceInterviewEvaluateRequest(BaseModel):
    role: str = Field(..., example="Frontend Developer")
    level: str = Field(..., example="Intermediate")
    question: str = Field(..., example="Explain React state.")
    transcript: str = Field(
        ...,
        example="React state is used to store component data and update the UI."
    )

    @field_validator("level")
    @classmethod
    def validate_level(cls, value: str):
        allowed_levels = ["Beginner", "Intermediate", "Advanced"]

        if value not in allowed_levels:
            raise ValueError("Level must be Beginner, Intermediate, or Advanced")

        return value


VOICE_QUESTIONS = [
    {
        "question_id": 1,
        "question_text": "Explain the difference between SQL and NoSQL databases.",
        "category": "DBMS",
        "difficulty": "medium",
    },
    {
        "question_id": 2,
        "question_text": "What is normalization in relational databases?",
        "category": "DBMS",
        "difficulty": "easy",
    },
    {
        "question_id": 3,
        "question_text": "What is the difference between a process and a thread?",
        "category": "Operating Systems",
        "difficulty": "medium",
    },
    {
        "question_id": 4,
        "question_text": "Explain what REST API is and how it works.",
        "category": "Web Development",
        "difficulty": "easy",
    },
    {
        "question_id": 5,
        "question_text": "What is Big O notation and why is it important?",
        "category": "Algorithms",
        "difficulty": "medium",
    },
    {
        "question_id": 6,
        "question_text": "Explain the difference between stack and queue.",
        "category": "Data Structures",
        "difficulty": "easy",
    },
    {
        "question_id": 7,
        "question_text": "What is recursion and where is it useful?",
        "category": "Programming",
        "difficulty": "easy",
    },
    {
        "question_id": 8,
        "question_text": "Explain the concept of object-oriented programming.",
        "category": "Programming",
        "difficulty": "medium",
    },
    {
        "question_id": 9,
        "question_text": "What is an IP address and why is it used?",
        "category": "Networking",
        "difficulty": "easy",
    },
    {
        "question_id": 10,
        "question_text": "Explain the difference between TCP and UDP.",
        "category": "Networking",
        "difficulty": "medium",
    },
]


@router.get("/")
async def voice_interview_home():
    return {
        "message": "Voice Interview Route Working"
    }


@voice_submit_router.get("/questions/voice")
async def get_voice_questions(
    category: Optional[str] = Query(default=None),
    difficulty: Optional[str] = Query(default=None),
    limit: int = Query(default=5, ge=1, le=10),
):
    filtered_questions = VOICE_QUESTIONS

    if category:
        filtered_questions = [
            question for question in filtered_questions
            if question["category"].lower() == category.lower()
        ]

    if difficulty:
        filtered_questions = [
            question for question in filtered_questions
            if question["difficulty"].lower() == difficulty.lower()
        ]

    if not filtered_questions:
        filtered_questions = VOICE_QUESTIONS

    selected_questions = random.sample(
        filtered_questions,
        k=min(limit, len(filtered_questions))
    )

    return {
        "success": True,
        "questions": selected_questions
    }


@router.post("/start")
async def start_voice_interview(request: VoiceInterviewStartRequest):
    role_lower = request.role.lower()

    if "frontend" in role_lower or "react" in role_lower:
        category = "Web Development"
    elif "backend" in role_lower or "api" in role_lower or "python" in role_lower:
        category = "Programming"
    else:
        category = None

    questions = VOICE_QUESTIONS
    if category:
        questions = [
            question for question in questions
            if question["category"] == category
        ]

    selected_questions = random.sample(
        questions,
        k=min(request.question_count, len(questions))
    )

    return {
        "success": True,
        "interview_type": "voice",
        "role": request.role,
        "level": request.level,
        "question_count": len(selected_questions),
        "questions": [
            {
                "id": question["question_id"],
                "question": question["question_text"],
                "type": "voice",
                "category": question["category"],
                "difficulty": question["difficulty"],
            }
            for question in selected_questions
        ],
    }


def evaluate_transcript(transcript: str):
    words = transcript.strip().split()
    word_count = len(words)

    if word_count == 0:
        score = 0
        feedback = "No voice transcript was provided."
        improvement = "Speak clearly or provide a transcript before submitting."
    elif word_count < 10:
        score = 40
        feedback = "The answer is too short for a voice interview response."
        improvement = "Add more explanation with definition, example, and use case."
    elif word_count < 30:
        score = 70
        feedback = "Good voice answer, but it can be more detailed."
        improvement = "Add a real example and explain the concept step by step."
    else:
        score = 90
        feedback = "Strong voice answer with good explanation."
        improvement = "Improve further by adding technical keywords and measurable examples."

    confidence_level = round(min(0.95, max(0.55, word_count / 40)), 2)

    return score, feedback, improvement, word_count, confidence_level


@router.post("/evaluate")
async def evaluate_voice_answer(request: VoiceInterviewEvaluateRequest):
    score, feedback, improvement, word_count, confidence_level = evaluate_transcript(
        request.transcript
    )

    return {
        "success": True,
        "interview_type": "voice",
        "role": request.role,
        "level": request.level,
        "question": request.question,
        "transcript": request.transcript,
        "word_count": word_count,
        "score": score,
        "feedback": feedback,
        "feedback_text": feedback,
        "improvement": improvement,
        "confidence_level": confidence_level,
    }


@voice_submit_router.post("/submit/voice")
async def submit_voice_interview(
    interview_id: Optional[str] = Form(default=None),
    question_id: Optional[str] = Form(default=None),
    answer_text: str = Form(default=""),
    transcript: str = Form(default=""),
    role: str = Form(default="Voice Interview"),
    level: str = Form(default="Intermediate"),
    question: str = Form(default=""),
    category: str = Form(default=""),
    difficulty: str = Form(default=""),
    audio_file: Optional[UploadFile] = File(default=None),
    audio: Optional[UploadFile] = File(default=None),
):
    final_transcript = transcript.strip() or answer_text.strip()
    score, feedback, improvement, word_count, confidence_level = evaluate_transcript(
        final_transcript
    )

    uploaded_audio = audio_file or audio
    audio_filename = uploaded_audio.filename if uploaded_audio else None

    return {
        "success": True,
        "answer_id": question_id or "voice-answer-1",
        "interview_id": interview_id,
        "question_id": question_id,
        "interview_type": "voice",
        "role": role,
        "level": level,
        "category": category,
        "difficulty": difficulty,
        "question": question,
        "answer_text": final_transcript,
        "transcript": final_transcript,
        "audio_filename": audio_filename,
        "word_count": word_count,
        "score": score,
        "feedback_text": feedback,
        "feedback": feedback,
        "improvement": improvement,
        "confidence_level": confidence_level,
        "message": "Voice interview answer evaluated successfully.",
    }