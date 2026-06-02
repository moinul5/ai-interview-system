from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import bindparam, text

from app.database import engine

router = APIRouter(prefix="/interview", tags=["Interview MCQ"])


class MCQSubmitRequest(BaseModel):
    answers_json: dict[str | int, str | None] = Field(default_factory=dict)
    user_id: int | None = None


@router.post("/submit/mcq")
def submit_mcq_interview(body: MCQSubmitRequest) -> dict[str, Any]:
    if not body.answers_json:
        raise HTTPException(
            status_code=400,
            detail={"message": "answers_json must not be empty"},
        )

    normalized_answers: dict[int, str | None] = {}

    for question_id, selected_option in body.answers_json.items():
        try:
            qid = int(question_id)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=422,
                detail={"message": f"Invalid question id: {question_id}"},
            )

        if selected_option is None:
            normalized_answers[qid] = None
            continue

        option = str(selected_option).strip().upper()
        if option not in ("A", "B", "C", "D"):
            raise HTTPException(
                status_code=422,
                detail={
                    "message": f"Option for question {qid} must be A, B, C, or D",
                    "received": selected_option,
                },
            )

        normalized_answers[qid] = option

    question_ids = sorted(normalized_answers.keys())

    stmt = text(
        """
        SELECT quiz_question_id, question_text,
               option_a, option_b, option_c, option_d,
               correct_option, marks
        FROM aptitude_quiz_questions
        WHERE quiz_question_id IN :ids
        """
    ).bindparams(bindparam("ids", expanding=True))

    try:
        with engine.begin() as conn:
            rows = conn.execute(stmt, {"ids": question_ids}).mappings().all()

            if len(rows) != len(question_ids):
                found_ids = {int(row["quiz_question_id"]) for row in rows}
                missing_ids = set(question_ids) - found_ids
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Some question IDs are invalid",
                        "missing_question_ids": sorted(missing_ids),
                    },
                )

            score_obtained = 0
            max_score = 0
            results = []

            for row in rows:
                qid = int(row["quiz_question_id"])
                correct_option = str(row["correct_option"]).upper()
                selected = normalized_answers.get(qid)
                marks = int(row["marks"] or 1)
                is_correct = selected == correct_option

                max_score += marks
                if is_correct:
                    score_obtained += marks

                results.append(
                    {
                        "quiz_question_id": qid,
                        "question_text": row["question_text"],
                        "option_a": row["option_a"],
                        "option_b": row["option_b"],
                        "option_c": row["option_c"],
                        "option_d": row["option_d"],
                        "correct_option": correct_option,
                        "selected": selected,
                        "is_correct": is_correct,
                        "marks": marks,
                    }
                )

            answers_json = json.dumps(
                {str(k): v for k, v in normalized_answers.items()}
            )

            conn.execute(
                text(
                    """
                    INSERT INTO aptitude_quiz_submissions
                      (user_id, score_obtained, max_score, answers_json)
                    VALUES (:user_id, :score_obtained, :max_score, :answers_json)
                    """
                ),
                {
                    "user_id": body.user_id,
                    "score_obtained": score_obtained,
                    "max_score": max_score,
                    "answers_json": answers_json,
                },
            )

            submission_id = int(
                conn.execute(text("SELECT LAST_INSERT_ID()")).scalar_one()
            )

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to submit MCQ interview answers",
                "error": str(error),
            },
        )

    percentage = round((100.0 * score_obtained / max_score), 2) if max_score else 0.0

    return {
        "success": True,
        "submission_id": submission_id,
        "score_obtained": score_obtained,
        "max_score": max_score,
        "percentage": percentage,
        "results": results,
    }