# Resume Analysis Module (Backend) — Documentation

This document focuses on **Resume Analysis** for the broader AI Interview System, plus an **extension that uses the same MySQL database** to deliver aptitude-quiz questions and persist scores.

---

## Overview

Candidates upload resume files (**PDF or DOCX**). The backend extracts text, runs the analyzer (currently a deterministic mock suitable for demos), persists the structured result plus raw text under `resume_analysis`, and exposes JSON APIs intended for SPA or mobile clients. A separate **quiz** mini-feature stores MCQs in `aptitude_quiz_questions` and writes graded attempts into `aptitude_quiz_submissions`, sharing the **`ai_interview_system`** schema.

High-level workflow:

1. Frontend uploads `multipart/form-data` to `POST /resume/analyze`.
2. Backend extracts text → analyzes → **`INSERT`** into **`resume_analysis`**.
3. Frontend lists or loads stored rows via `GET /resume/analyses` and `GET /resume/analyses/{analysis_id}`.
4. Frontend loads quiz items from `GET /quiz/questions`, posts answers to `POST /quiz/submit`, and optionally reads persisted scores via `GET /quiz/submissions/{submission_id}`.

---

## Tech stack

| Layer        | Choice                                      |
|-------------|---------------------------------------------|
| Framework   | **FastAPI**                                 |
| ORM/driver  | **SQLAlchemy 2.x** + **PyMySQL**            |
| DB          | **MySQL / MariaDB** (`ai_interview_system`) |
| File parse  | **PyMuPDF** (`fitz`), **python-docx**       |
| Config      | **python-dotenv** (`.env`)                  |

---

## Folder structure (relevant files)

```
SE Final/
├── ai-system.sql                 # Original base schema dump
├── Backend/
│   ├── main.py                   # FastAPI app, CORS, health
│   ├── requirements.txt
│   ├── .env                      # Local secrets — do not commit
│   ├── .env.example              # Template for DATABASE_URL / CORS / keys
│   ├── schema_extensions.sql     # Creates resume_analysis + quiz tables (+ FK)
│   ├── seed_quiz_demo.sql        # Optional MCQ inserts for testing
│   └── app/
│       ├── database.py           # SQLAlchemy engine / Session factory
│       ├── resume_routes/
│       │   └── resume.py         # Resume API
│       ├── resume_services/
│       │   ├── resume_parser.py
│       │   └── ai_resume_analyzer.py  # Stub AI output (swap for LLM later)
│       └── quiz_routes/
│           └── quiz.py           # Quiz APIs
└── Resume-Analysis-README.md   # This file
```

---

## Prerequisites

- Python **3.10+** (validated with imports on Python 3.14 in development).
- **MySQL** or **MariaDB** with database `ai_interview_system`.

---

## Installation

```powershell
cd "path\to\SE Final\Backend"
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` with valid DB credentials.

---

## Environment variables

Configure either a full URL **or** discrete fields (`DATABASE_URL` wins if present).

| Variable           | Meaning                                | Example |
|--------------------|----------------------------------------|---------|
| `DATABASE_URL`     | Full SQLAlchemy DB URL                  | `mysql+pymysql://root:secret@localhost:3306/ai_interview_system` |
| `MYSQL_USER`       | DB user                                | `root` |
| `MYSQL_PASSWORD`   | Password (leave empty when none)        | *(empty)* |
| `MYSQL_HOST`       | Host                                   | `localhost` |
| `MYSQL_PORT`       | Port                                   | `3306` |
| `MYSQL_DATABASE`   | Database name                           | `ai_interview_system` |
| `CORS_ORIGINS`     | Comma-separated allowed browser origins | `http://localhost:5173` |
| `OPENAI_API_KEY`   | Reserved for a future live LLM analyzer | _(optional)_ |

Never commit `.env`. A root `.gitignore` ignores `.env` for this project.

---

## Database setup

1. **Restore the base schema** (creates core tables such as `users`, `questions`, interviews, etc.):

   Import `ai-system.sql` via phpMyAdmin, MySQL Workbench, or CLI:

   ```bash
   mysql -u root -p ai_interview_system < ../ai-system.sql
   ```

2. **Apply module extensions**:

   ```bash
   mysql -u root -p ai_interview_system < schema_extensions.sql
   ```

   This creates **`resume_analysis`**, **`aptitude_quiz_questions`**, and **`aptitude_quiz_submissions`**.  
   The submissions table declares an **optional FK** `user_id → users(user_id)`. If you only need anonymous quizzes, omit `user_id` in submissions (leave `NULL`).

3. **Optional demo quiz rows**:

   ```bash
   mysql -u root -p ai_interview_system < seed_quiz_demo.sql
   ```

Verification:

```powershell
py -m app.test_db            # Prints connection success/failure (uses SQLAlchemy engine)
# or curl / Invoke-WebRequest GET http://127.0.0.1:8000/health once the API is running
```

---

## Run the backend

```powershell
cd Backend
.\.venv\Scripts\Activate.ps1
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Interactive docs: **`http://127.0.0.1:8000/docs`** (Swagger UI).

---

## Resume analysis API

### `POST /resume/analyze`

Upload a resume (**field name must be `resume`** per FastAPI declaration).

**Request**

- Headers: *(none mandatory)*
- Body: `multipart/form-data`
  - `resume`: PDF or DOCX file

Example with **curl**:

```bash
curl -X POST "http://127.0.0.1:8000/resume/analyze" \
  -F "resume=@C:/Users/me/sample.pdf"
```

**Success (`200`) example**

```json
{
  "success": true,
  "analysis_id": 42,
  "file_name": "sample.pdf",
  "ai_analysis": {
    "ATS Score": "85/100",
    "Strengths": ["Good project experience", "Strong communication skills", "Clean resume structure"],
    "Weaknesses": ["Missing GitHub portfolio", "Need more technical keywords"],
    "Missing Skills": ["Docker", "AWS", "CI/CD"],
    "Suggestions": ["Add GitHub profile", "Add more measurable achievements", "Improve ATS keywords"]
  }
}
```

**Errors**

| Code | Scenario |
|------|----------|
| `415` | Unsupported extension (allowed: `pdf`, `docx`) |
| `422` | Extracted text too short (possible corrupt/empty PDF) |
| `500` | DB insert fails—usually **missing `resume_analysis` table** after skipping `schema_extensions.sql` |

### `GET /resume/analyses`

Paginated summaries (defaults `limit=20`, `offset=0`). Responses include **`ai_analysis` JSON** parsed for list cards (`include_ai_preview=true`).

**Example**

```
GET http://127.0.0.1:8000/resume/analyses?limit=10&offset=0
```

### `GET /resume/analyses/{analysis_id}`

Returns one row including **`extracted_text`** and parsed **`ai_analysis`**.

```
GET http://127.0.0.1:8000/resume/analyses/42
```

---

## How resume data is stored

Table **`resume_analysis`**

| Column           | Purpose |
|------------------|---------|
| `analysis_id`    | Surrogate PK (returned after upload) |
| `file_name`      | Original filename |
| `extracted_text` | Joined OCR/DOC text |
| `ai_analysis`    | **UTF-8 JSON string** compatible with frontend `JSON.parse` |
| `created_at`     | Timestamp for sorting |

Fetched rows deserialize `ai_analysis` back into structured objects inside the endpoints.

---

## Aptitude quiz (same database)

### Tables

| Table | Role |
|-------|------|
| `aptitude_quiz_questions` | Stored MCQs, correct option, marks |
| `aptitude_quiz_submissions` | One row per attempt: `score_obtained`, `max_score`, `answers_json` |

### `GET /quiz/questions?limit=10`

Omits answers. Frontend receives `question_id`, `question_text`, `options` `{A,B,C,D}`, `marks`.

**Example excerpt**

```json
{
  "questions": [
    {
      "question_id": 1,
      "question_text": "...",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "marks": 1
    }
  ]
}
```

### `POST /quiz/submit`

**Request**

```json
{
  "answers": { "1": "B", "2": "C" },
  "user_id": 1
}
```

- `"user_id"` is optional; omit or set `null` for guests.
- Every key in `"answers"` must match a real `quiz_question_id`.

**Success**

```json
{
  "success": true,
  "submission_id": 99,
  "score_obtained": 4,
  "max_score": 5,
  "percentage": 80.0
}
```

Invalid question IDs yield **`400`** with `{ "missing_question_ids": [...] }`.

### `GET /quiz/submissions/{submission_id}`

Loads persisted marks for confirmations or dashboards.

---

## Error handling conventions

Structured JSON payloads use a `detail` object (often with `message` + extra fields).

| Endpoint family | Typical failure modes |
|-----------------|-----------------------|
| Resume upload   | Bad MIME/extension, OCR produced empty text |
| Persistence     | Connectivity, missing tables, FK violation on `quiz` `user_id` |
| Quiz submit     | Unknown question IDs, options other than **A/B/C/D** |

---

## Frontend integration guide

### Upload resume (`fetch`)

```typescript
async function analyzeResume(file: File) {
  const formData = new FormData();
  formData.append('resume', file); // MUST match backend field name
  const res = await fetch('http://127.0.0.1:8000/resume/analyze', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}
```

Use `analysis_id` from that response—or call `GET /resume/analyses` for history.

### CORS during local dev

`CORS_ORIGINS` defaults include `http://localhost:5173` (typical **Vite** port). Extend the list when you change host/port.

---

## Operational notes / improvements

| Topic | Recommendation |
|-------|----------------|
| Analyzer | Swap `analyze_resume_with_ai` for an OpenAI/Anthropic adapter using `OPENAI_API_KEY`; keep structured JSON identical for stable UI contracts. |
| Rate limits | Add middleware or nginx throttling prior to exposing publicly. |
| File size caps | Implement `FastAPI`/reverse-proxy limits (`client_max_body_size`). |
| PII | Optionally strip `extracted_text` from `GET /resume/analyses` list responses via a privacy flag once UI requirements stabilize. |

---

## System workflow (diagram)

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant API as FastAPI
  participant Parser as Parser + AI Stub
  participant DB as MySQL (ai_interview_system)

  FE->>API: POST /resume/analyze (multipart)
  API->>Parser: extract + analyze
  Parser-->>API: structured ai_analysis dict
  API->>DB: INSERT resume_analysis
  DB-->>API: analysis_id
  API-->>FE: JSON (analysis_id + ai_analysis)

  FE->>API: GET /resume/analyses or /resume/analyses/{id}
  API->>DB: SELECT resume_analysis
  DB-->>API: rows JSON
  API-->>FE: history / detail payload
```

Quiz flow parallels the same FE → API pattern with `GET /quiz/questions`, `POST /quiz/submit`, and optional `GET /quiz/submissions/{id}`, all persisted in the **same** database.

---

Maintainers: rerun `schema_extensions.sql` after restoring from older dumps lacking `resume_analysis`, and regenerate demo MCQs via `seed_quiz_demo.sql` if needed.
