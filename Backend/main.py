import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.database import engine
from app.auth.router import router as auth_router
from app.quiz_routes.quiz import router as quiz_router
from app.resume_routes.resume import router as resume_router

load_dotenv()

app = FastAPI(title="AI Interview System — Resume & Quiz API", version="1.0.0")

_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
)
allow_origins = [o.strip() for o in _origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(quiz_router)


@app.get("/")
def home() -> dict[str, str]:
    return {"message": "AI Resume Analysis Backend Running"}


@app.get("/health")
def health() -> JSONResponse:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "unreachable", "detail": str(e)},
        )
    return JSONResponse(
        status_code=200,
        content={"status": "ok", "database": "reachable"},
    )
