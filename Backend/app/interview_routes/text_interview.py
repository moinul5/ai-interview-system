import random

from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/text-interview", tags=["Text Interview"])


class TextInterviewStartRequest(BaseModel):
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


class TextInterviewEvaluateRequest(BaseModel):
    role: str = Field(..., example="Frontend Developer")
    level: str = Field(..., example="Intermediate")
    question: str = Field(..., example="What is React state and why is it used?")
    answer: str = Field(
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


@router.get("/")
async def text_interview_home():
    return {
        "message": "Text Interview Route Working"
    }


@router.post("/start")
async def start_text_interview(request: TextInterviewStartRequest):
    frontend_questions = [
        "What is the difference between HTML, CSS, and JavaScript?",
        "What is React state and why is it used?",
        "How does responsive design work?",
        "What is the difference between props and state in React?",
        "What is an API and how does a frontend application use it?",
        "What is event handling in JavaScript?",
        "What is the purpose of useEffect in React?",
        "How do you optimize a website for better performance?",
        "What is the difference between localStorage and sessionStorage?",
        "How do you handle form validation in a frontend application?"
    ]

    backend_questions = [
        "What is a REST API?",
        "What is the difference between GET and POST requests?",
        "What is database normalization?",
        "What is authentication and authorization?",
        "How does password hashing improve security?",
        "What is middleware in backend development?",
        "What is the purpose of environment variables?",
        "How do you handle errors in an API?",
        "What is the difference between SQL and NoSQL databases?",
        "How do you design a secure login system?"
    ]

    fullstack_questions = [
        "What is the difference between frontend and backend development?",
        "How does a frontend application communicate with a backend API?",
        "What is CRUD operation?",
        "How do you connect a React frontend with a FastAPI backend?",
        "What is CORS and why is it important?",
        "How do you manage user authentication in a full stack application?",
        "What is the role of a database in a full stack project?",
        "How do you deploy a full stack web application?",
        "How do you handle form submission from frontend to backend?",
        "How do you debug full stack application issues?"
    ]

    data_analyst_questions = [
        "What is data cleaning and why is it important?",
        "What is the difference between structured and unstructured data?",
        "What is SQL used for in data analysis?",
        "What is data visualization?",
        "What is the difference between mean, median, and mode?",
        "How do you handle missing values in a dataset?",
        "What is Excel used for in data analysis?",
        "What is the purpose of a dashboard?",
        "What is the difference between correlation and causation?",
        "How do you explain data insights to non-technical people?"
    ]

    software_engineer_questions = [
        "What is software engineering?",
        "What is the software development life cycle?",
        "What is object-oriented programming?",
        "What is the difference between a bug and an error?",
        "What is version control and why is Git used?",
        "What is code testing?",
        "What is the difference between functional and non-functional requirements?",
        "What is debugging?",
        "What is clean code?",
        "How do you work with a team on a software project?"
    ]

    role_lower = request.role.lower()

    if "frontend" in role_lower or "react" in role_lower:
        question_bank = frontend_questions
    elif "backend" in role_lower or "api" in role_lower:
        question_bank = backend_questions
    elif "full stack" in role_lower or "fullstack" in role_lower:
        question_bank = fullstack_questions
    elif "data analyst" in role_lower or "data" in role_lower:
        question_bank = data_analyst_questions
    elif "software engineer" in role_lower or "software" in role_lower:
        question_bank = software_engineer_questions
    else:
        question_bank = software_engineer_questions

    selected_questions = random.sample(
        question_bank,
        k=min(request.question_count, len(question_bank))
    )

    questions = []
    for index, question in enumerate(selected_questions):
        questions.append(
            {
                "id": index + 1,
                "question": question,
                "type": "text"
            }
        )

    return {
        "success": True,
        "interview_type": "text",
        "role": request.role,
        "level": request.level,
        "question_count": len(questions),
        "questions": questions
    }


@router.post("/evaluate")
async def evaluate_text_answer(request: TextInterviewEvaluateRequest):
    answer_words = request.answer.strip().split()
    answer_length = len(answer_words)

    if answer_length == 0:
        score = 0
        feedback = "No answer was provided."
        improvement = "Write a clear answer related to the question."
    elif answer_length < 10:
        score = 4
        feedback = "The answer is too short and needs more explanation."
        improvement = "Add definition, example, and practical use case."
    elif answer_length < 30:
        score = 7
        feedback = "Good answer, but it can be more detailed."
        improvement = "Explain the concept with a real example."
    else:
        score = 9
        feedback = "Strong answer with good explanation."
        improvement = "You can improve further by adding technical keywords and examples."

    return {
        "success": True,
        "interview_type": "text",
        "role": request.role,
        "level": request.level,
        "question": request.question,
        "answer": request.answer,
        "score": score,
        "feedback": feedback,
        "improvement": improvement
    }