# 🚀 AI Interview System — Backend

FastAPI backend powering resume analysis, AI-driven mock interviews, aptitude quizzes, and user authentication for the AI Interview System.

---

## 📐 Architecture

| Component | Technology |
|-----------|------------|
| **Framework** | FastAPI (Python) |
| **Port** | `8000` |
| **Database** | MySQL via XAMPP (phpMyAdmin) |
| **ORM** | SQLAlchemy |
| **AI Engine** | Groq AI — Llama 3.1 (resume analysis & interview evaluation) |
| **Password Hashing** | bcrypt |
| **API Docs** | Swagger UI auto-generated at `/docs` |

```
Frontend (React/Vite)
    │
    ▼
FastAPI :8000  ──►  Groq AI (Llama 3.1)
    │
    ▼
MySQL (XAMPP)
```

---

## ⚡ Quick Start

```powershell
cd Backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # then edit with your values
uvicorn main:app --reload
```

| Resource | URL |
|----------|-----|
| 🌐 Server | `http://localhost:8000` |
| 📖 Swagger Docs | `http://localhost:8000/docs` |
| 📄 OpenAPI JSON | `http://localhost:8000/openapi.json` |

---

## 🔑 Environment Variables (`.env`)

Copy `.env.example` → `.env` and configure:

```env
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=ai_interview_system
GROQ_API_KEY=your_groq_key_here
JWT_SECRET_KEY=your_secret
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://localhost:5174
```

| Variable | Purpose |
|----------|---------|
| `MYSQL_*` | MySQL connection parameters |
| `GROQ_API_KEY` | API key for Groq AI (Llama 3.1) |
| `JWT_SECRET_KEY` | Secret used for JWT token signing |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry duration (default: 1440 = 24h) |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |

---

## 🌐 CORS Configuration

Configured in `main.py` via the **`CORS_ORIGINS`** environment variable.

- Origins must match **exactly** (scheme + host + port).
- `allow_credentials=True` is enabled — avoid using `*`; list explicit URLs.
- After changing `.env`, **restart uvicorn** for changes to take effect.

```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

---

## 📡 API Endpoints

### 🔐 Auth — `/auth` &nbsp; `app/auth/router.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user with name, email, password, and role |
| `POST` | `/auth/login` | Login with email + password; returns user object |

#### `POST /auth/register`

```json
// Request Body
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePass123",
  "role": "candidate"
}
```

#### `POST /auth/login`

```json
// Request Body
{
  "email": "jane@example.com",
  "password": "securePass123"
}
```

---

### 📄 Resume — `/resume` &nbsp; `app/resume_routes/resume.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/resume/analyze` | Upload a PDF/DOCX resume for AI analysis |
| `GET` | `/resume/analyses` | List all analyses for the logged-in user |
| `GET` | `/resume/analyses/{id}` | Get a specific analysis by ID |
| `DELETE` | `/resume/analyses/{id}` | Delete a specific analysis by ID |

#### `POST /resume/analyze`

- **Content-Type:** `multipart/form-data`
- **Form field name:** **`resume`** (required)
- User is identified via the `X-User-Id` header (injected automatically by the frontend `apiClient.js`)

```bash
curl -X POST "http://localhost:8000/resume/analyze" \
  -H "X-User-Id: 5" \
  -F "resume=@./my_resume.pdf"
```

**Success — `200`**

```json
{
  "success": true,
  "analysis_id": 42,
  "file_name": "my_resume.pdf",
  "ai_analysis": {
    "ATS Score": "85/100",
    "Strengths": ["Good project experience", "Strong communication skills"],
    "Weaknesses": ["Missing GitHub portfolio"],
    "Missing Skills": ["Docker", "AWS", "CI/CD"],
    "Suggestions": ["Add GitHub profile", "Add measurable achievements"]
  }
}
```

#### `GET /resume/analyses`

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `limit` | int | `20` | Page size (`1`–`100`) |
| `offset` | int | `0` | Rows to skip |
| `include_ai_preview` | bool | `true` | Include parsed `ai_analysis` in each item |

Results are filtered by the `X-User-Id` header — users only see their own analyses.

#### `GET /resume/analyses/{id}` · `DELETE /resume/analyses/{id}`

Access is restricted to the owning user (verified via `X-User-Id` header).

---

### 🤖 AI Interview — `/api/interviews` &nbsp; `app/interview_routes/interview.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/interviews` | Create a new AI interview session |
| `POST` | `/api/interviews/{session_id}/submit` | Submit answers for AI evaluation |

#### `POST /api/interviews`

Creates an interview session with AI-generated (or fallback) questions. Saved to the `ai_interview_sessions` table.

```json
// Request Body
{
  "candidate_profile": {
    "name": "Jane Doe",
    "skills": ["Python", "React", "SQL"],
    "experience_level": "mid"
  },
  "question_count": 5
}
```

#### `POST /api/interviews/{session_id}/submit`

Submits candidate answers for Groq AI evaluation. Results are saved to the `ai_interview_evaluations` table.

```json
// Request Body
{
  "answers": [
    { "question_id": 1, "answer": "My approach would be..." },
    { "question_id": 2, "answer": "I have experience with..." }
  ]
}
```

**Response includes:**

| Field | Description |
|-------|-------------|
| `score` | Overall interview score |
| `strengths` | Candidate's demonstrated strengths |
| `gaps` | Areas where answers were lacking |
| `skill_gaps` | Specific skills needing improvement |
| `next_steps` | Recommended actions for the candidate |
| `recommended_courses` | Suggested learning resources |

---

### 📝 Quiz — `/quiz` &nbsp; `app/quiz_routes/quiz.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/quiz/questions` | Fetch quiz questions (correct answers excluded) |
| `POST` | `/quiz/submit` | Submit answers for auto-grading |
| `GET` | `/quiz/submissions/{id}` | Retrieve a specific submission result |

#### `GET /quiz/questions`

| Query Param | Type | Default | Constraints |
|-------------|------|---------|-------------|
| `limit` | int | `10` | `1`–`50` |

> ⚠️ Correct answers are **never** included in the response.

```json
{
  "questions": [
    {
      "question_id": 1,
      "question_text": "What does REST stand for?",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "marks": 1
    }
  ]
}
```

#### `POST /quiz/submit`

```json
// Request Body
{
  "answers": { "1": "B", "2": "C", "3": "A" },
  "user_id": 5
}
```

**Success — `200`**

```json
{
  "success": true,
  "submission_id": 99,
  "score_obtained": 2,
  "max_score": 3,
  "percentage": 66.67
}
```

Auto-graded and saved to the `aptitude_quiz_submissions` table.

#### `GET /quiz/submissions/{id}`

```json
{
  "submission_id": 99,
  "user_id": 5,
  "score_obtained": 2,
  "max_score": 3,
  "percentage": 66.67,
  "created_at": "2026-05-10T15:00:00"
}
```

---

### 💚 Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Basic server status check |
| `GET` | `/health` | Database connectivity check |

```json
// GET /health — Success (200)
{ "status": "ok", "database": "reachable" }

// GET /health — Failure (503)
{ "status": "unhealthy", "database": "unreachable", "detail": "..." }
```

---

## 🔒 User Data Isolation

The frontend's `apiClient.js` automatically injects the **`X-User-Id`** header into every request. The backend uses this header to:

| Action | Behavior |
|--------|----------|
| 📤 Upload resume | Tags the new analysis with the user's ID |
| 📋 List analyses | Filters results to show only the user's own data |
| 🔍 View analysis | Returns the record only if owned by the user |
| 🗑️ Delete analysis | Deletes the record only if owned by the user |

This ensures **complete data isolation** between users — each user can only access their own resume analyses.

---

## 📂 File Upload Rules

| Rule | Detail |
|------|--------|
| **Accepted formats** | `.pdf`, `.docx` only |
| **Form field name** | `resume` (must match exactly) |
| **Content-Type** | `multipart/form-data` — do **not** set manually; the browser/client sets it with the boundary |
| **Text validation** | Extracted text must be ≥ 20 characters after stripping whitespace |
| **Max size** | Not enforced in app code — depends on uvicorn/Starlette defaults and any reverse proxy config |

---

## ❌ Error Response Formats

### Auth Errors — `401`

```json
{ "detail": "Invalid credentials" }
```

### Validation Errors — `422`

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "answers"],
      "msg": "Field required",
      "input": null
    }
  ]
}
```

### Business / Server Errors — `400` / `404` / `500`

```json
{
  "detail": {
    "message": "Some question IDs are invalid",
    "missing_question_ids": [7, 8]
  }
}
```

---

## 🗄️ Database Schema (16 Tables)

```
┌──────────────────────────┐    ┌──────────────────────────┐
│  Core                    │    │  AI Features             │
├──────────────────────────┤    ├──────────────────────────┤
│  users                   │    │  resume_analysis         │
│  candidates              │    │  ai_interview_sessions   │
│  interviewers            │    │  ai_interview_evaluations│
│  candidate_skills        │    │  ai_feedback             │
│  skills                  │    │  aptitude_quiz_questions  │
│  job_positions           │    │  aptitude_quiz_submissions│
├──────────────────────────┤    └──────────────────────────┘
│  Interview Flow          │
├──────────────────────────┤
│  interviews              │
│  interview_questions     │
│  questions               │
│  answers                 │
└──────────────────────────┘
```

**Full table list:** `users` · `candidates` · `interviewers` · `candidate_skills` · `skills` · `job_positions` · `interviews` · `interview_questions` · `questions` · `answers` · `ai_feedback` · `resume_analysis` · `aptitude_quiz_questions` · `aptitude_quiz_submissions` · `ai_interview_sessions` · `ai_interview_evaluations`

---

## 📁 Project Structure

```
Backend/
├── main.py                          # FastAPI app entry point, CORS, router registration
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment variable template
├── app/
│   ├── auth/
│   │   └── router.py                # Auth endpoints (register, login)
│   ├── resume_routes/
│   │   └── resume.py                # Resume CRUD + AI analysis endpoints
│   ├── resume_services/
│   │   └── ai_resume_analyzer.py    # Groq AI integration for resume analysis
│   ├── interview_routes/
│   │   └── interview.py             # AI interview session & evaluation endpoints
│   ├── quiz_routes/
│   │   └── quiz.py                  # Quiz questions, submission & grading
│   ├── models/                      # SQLAlchemy ORM models
│   ├── schemas/                     # Pydantic request/response schemas
│   └── database.py                  # DB engine & session configuration
```

---

## 📖 Related Resources

- **Frontend README:** `../Frontend/README.md`
- **Resume Analysis Module:** `../Resume-Analysis-README.md`
- **Swagger UI (live):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

> Built with ❤️ using FastAPI, Groq AI, and MySQL
