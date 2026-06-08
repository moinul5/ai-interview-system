"""
admin_routes/analytics.py
--------------------------
Admin analytics/dashboard endpoints.
All endpoints require the 'admin' role.
"""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.auth.dependencies import require_admin
from app.database import engine

router = APIRouter(prefix="/admin/analytics", tags=["Admin - Analytics"])


def _serialize_row(row: dict) -> dict:
    out = dict(row)
    for key, val in out.items():
        if isinstance(val, datetime):
            out[key] = val.isoformat()
    return out


@router.get("")
def dashboard_summary(admin: dict = Depends(require_admin)):
    """Dashboard summary stats: users by role, interviews by status, completion rate, jobs, recent interviews."""
    with engine.connect() as conn:
        # Users by role
        user_counts = conn.execute(
            text("SELECT role, COUNT(*) AS count FROM users GROUP BY role")
        ).mappings().all()
        users_by_role = {r["role"]: int(r["count"]) for r in user_counts}
        total_users = sum(users_by_role.values())

        # Interviews by status
        interview_counts = conn.execute(
            text("SELECT status, COUNT(*) AS count FROM interviews GROUP BY status")
        ).mappings().all()
        interviews_by_status = {r["status"]: int(r["count"]) for r in interview_counts}
        total_interviews = sum(interviews_by_status.values())

        # Completion rate
        completed = interviews_by_status.get("completed", 0)
        completion_rate = round(
            (completed / total_interviews * 100) if total_interviews > 0 else 0, 2
        )

        # Job positions
        job_counts = conn.execute(
            text(
                "SELECT status, COUNT(*) AS count FROM job_positions GROUP BY status"
            )
        ).mappings().all()
        jobs_by_status = {r["status"]: int(r["count"]) for r in job_counts}
        total_jobs = sum(jobs_by_status.values())

        # Recent 5 interviews
        recent = conn.execute(
            text(
                """
                SELECT iv.interview_id, iv.status, iv.interview_type,
                       iv.created_at,
                       u_c.name AS candidate_name,
                       u_i.name AS interviewer_name,
                       jp.title AS position_title
                FROM interviews iv
                LEFT JOIN candidates c ON c.candidate_id = iv.candidate_id
                LEFT JOIN users u_c ON u_c.user_id = c.user_id
                LEFT JOIN interviewers i ON i.interviewer_id = iv.interviewer_id
                LEFT JOIN users u_i ON u_i.user_id = i.user_id
                LEFT JOIN job_positions jp ON jp.position_id = iv.position_id
                ORDER BY iv.created_at DESC
                LIMIT 5
                """
            )
        ).mappings().all()

    return {
        "total_users": total_users,
        "users_by_role": users_by_role,
        "total_interviews": total_interviews,
        "interviews_by_status": interviews_by_status,
        "completion_rate": completion_rate,
        "total_job_positions": total_jobs,
        "jobs_by_status": jobs_by_status,
        "recent_interviews": [_serialize_row(r) for r in recent],
    }


@router.get("/interviewers")
def interviewer_performance(admin: dict = Depends(require_admin)):
    """Interviewer performance: total interviews, completed, avg score, pending requests."""
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT i.interviewer_id,
                       u.name,
                       u.email,
                       COUNT(iv.interview_id) AS total_interviews,
                       SUM(CASE WHEN iv.status = 'completed' THEN 1 ELSE 0 END) AS completed,
                       ROUND(AVG(iv.total_score), 2) AS avg_score,
                       SUM(CASE WHEN iv.status IN ('pending', 'time_selected') THEN 1 ELSE 0 END) AS pending_requests
                FROM interviewers i
                JOIN users u ON u.user_id = i.user_id
                LEFT JOIN interviews iv ON iv.interviewer_id = i.interviewer_id
                GROUP BY i.interviewer_id, u.name, u.email
                ORDER BY total_interviews DESC
                """
            )
        ).mappings().all()

    return [
        {
            "interviewer_id": r["interviewer_id"],
            "name": r["name"],
            "email": r["email"],
            "total_interviews": int(r["total_interviews"]),
            "completed": int(r["completed"]),
            "avg_score": float(r["avg_score"]) if r["avg_score"] is not None else None,
            "pending_requests": int(r["pending_requests"]),
        }
        for r in rows
    ]
