# 🤖 AI Interview System

A full-stack web application that helps candidates prepare for job interviews using AI-powered mock interviews and resume analysis.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the App](#running-the-app)
- [API Endpoints](#api-endpoints)
- [Resume Builder — Backend Contract](#-resume-builder--backend-contract)
- [Pages & Routes](#pages--routes)
- [Default Accounts](#default-accounts)
- [Common Errors & Fixes](#common-errors--fixes)

---

## Overview

The AI Interview System is a team SE project that allows:
- **Candidates** to sign up, upload their resume for AI analysis, and practice mock interview questions
- **Interviewers** to manage interviews and review candidates
- **Admins** to oversee the entire system

Authentication is simple password-based (no JWT tokens required).

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Sign Up / Sign In | Simple email + password authentication |
| 📄 Resume Analysis | Upload PDF/DOCX → AI gives ATS score, strengths, weaknesses, suggestions |
| 🏗️ Resume Builder | Fill in a form → get a formatted resume with live preview → save to backend |
| 🎯 Aptitude Quiz | Multiple-choice quiz with scoring |
| 👤 Profile Page | View your account info and role |
| 📊 Dashboard | Overview of your activity |
| 🛡️ Route Protection | Dashboard & profile are only accessible when logged in |

---

## 🛠️ Tech Stack

### Backend
| Tool | Purpose |
|------|---------|
| **FastAPI** | Python web framework |
| **SQLAlchemy** | ORM for database queries |
| **PyMySQL** | MySQL database driver |
| **bcrypt** | Password hashing |
| **Groq AI** | AI for resume analysis |
| **PyMuPDF / python-docx** | Extract text from PDF / DOCX files |
| **Uvicorn** | ASGI server to run FastAPI |

### Frontend
| Tool | Purpose |
|------|---------|
| **React** | UI framework |
| **Vite** | Build tool / dev server |
| **React Router** | Client-side routing |
| **Axios** | HTTP requests to backend |

### Database
| Tool | Purpose |
|------|---------|
| **MySQL (XAMPP)** | Relational database |
| **phpMyAdmin** | GUI to manage the DB |

---

## 📁 Project Structure

```
ai-interview-system/
│
├── Backend/                        # FastAPI backend
│   ├── app/
│   │   ├── auth/
│   │   │   ├── models.py           # SQLAlchemy User model
│   │   │   ├── schemas.py          # Pydantic request/response schemas
│   │   │   ├── router.py           # /auth/register and /auth/login endpoints
│   │   │   ├── security.py         # bcrypt password hashing
│   │   │   └── dependencies.py     # DB session dependency
│   │   ├── resume_routes/          # Resume upload & AI analysis
│   │   ├── quiz_routes/            # Aptitude quiz endpoints
│   │   └── database.py             # SQLAlchemy engine & session setup
│   ├── main.py                     # App entry point, CORS config
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Your local environment variables (DO NOT COMMIT)
│   └── .env.example                # Template for .env
│
├── frontend/                       # React frontend
│   ├── src/
│   │   ├── pages/                  # Login, Signup, Dashboard, Resume, Profile
│   │   ├── components/             # Reusable UI components
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state (user, login, logout)
│   │   ├── services/
│   │   │   ├── apiClient.js        # Axios instance (base URL config)
│   │   │   └── authService.js      # login/register API calls
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.jsx  # Redirects to /login if not logged in
│   │   │   └── GuestRoute.jsx      # Redirects to /dashboard if already logged in
│   │   └── App.jsx                 # Route definitions
│   └── package.json
│
├── ai_interview_system.sql         # Full database dump — import this into XAMPP
└── README.md
```

---

## 🗄️ Database Setup (XAMPP)

> Do this **first** before running the backend.

1. **Start XAMPP** → Start **Apache** and **MySQL**
2. Open **phpMyAdmin** → `http://localhost/phpmyadmin`
3. Click **New** → Create a database named: `ai_interview_system`
4. Select the database → click **Import** tab
5. Choose the file: `ai_interview_system.sql`
6. Click **Go** → all tables will be created with sample data

### Users Table Structure
```sql
users (
  user_id       INT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'candidate', 'interviewer') NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## ⚙️ Backend Setup

### Step 1 — Navigate to Backend folder
```powershell
cd "d:\SE project(Team)\ai-interview-system\Backend"
```

### Step 2 — Activate the virtual environment
```powershell
.\venv\Scripts\activate
```
> You should see `(venv)` appear at the start of your terminal line.
> 
> If venv doesn't exist yet, create it first:
> ```powershell
> python -m venv venv
> .\venv\Scripts\activate
> pip install -r requirements.txt
> ```

### Step 3 — Create your `.env` file
Copy the example and fill in your values:
```powershell
copy .env.example .env
```

Open `.env` and set:
```env
MYSQL_USER=root
MYSQL_PASSWORD=          # leave empty if no XAMPP MySQL password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=ai_interview_system

GROQ_API_KEY=your_groq_api_key_here   # for AI resume analysis
```

> Get a free Groq API key at: https://console.groq.com

### Step 4 — Run the backend
```powershell
uvicorn main:app --reload
```

✅ Backend will be live at: **http://127.0.0.1:8000**  
📖 Interactive API docs: **http://127.0.0.1:8000/docs**

---

## 🖥️ Frontend Setup

### Step 1 — Navigate to frontend folder
```powershell
cd "d:\SE project(Team)\ai-interview-system\frontend"
```

### Step 2 — Install dependencies (first time only)
```powershell
npm install
```

### Step 3 — Run the frontend
```powershell
npm run dev
```

✅ Frontend will be live at: **http://localhost:5173**

---

## 🚀 Running the App (Quick Start)

Open **two separate terminals**:

**Terminal 1 — Backend:**
```powershell
cd "d:\SE project(Team)\ai-interview-system\Backend"
.\venv\Scripts\activate
uvicorn main:app --reload
```

**Terminal 2 — Frontend:**
```powershell
cd "d:\SE project(Team)\ai-interview-system\frontend"
npm run dev
```

Then open your browser at: **http://localhost:5173**

> ⚠️ Make sure **XAMPP MySQL** is running before starting the backend!

---

## 📡 API Endpoints — Complete Reference

> ✅ Every endpoint below is called by the frontend. The backend must implement **all of them** exactly as documented for zero frontend changes.

### Auth
| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| POST | `/auth/register` | `{ name, email, password }` | `{ user_id, name, email, role }` |
| POST | `/auth/login` | `{ email, password }` | `{ user_id, name, email, role }` |

### Resume Analysis
| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| POST | `/resume/analyze` | `FormData { resume: File }` | `{ analysis_id, file_name, ai_analysis: {...} }` |
| GET | `/resume/analyses` | — | `[{ analysis_id, file_name, created_at, ai_analysis }]` |
| GET | `/resume/analyses/{id}` | — | `{ analysis_id, file_name, extracted_text, ai_analysis }` |
| DELETE | `/resume/analyses/{id}` | — | `{ message: "Deleted" }` |

### Resume Builder
| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| POST | `/resume/build` | JSON resume payload (see contract section below) | `{ resume_id, message, download_url? }` |
| GET | `/resume/build/{resume_id}` | — | Full resume JSON |

### User / Profile
| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| GET | `/users/me` | — | `{ user_id, name, email, role, created_at }` |
| PUT | `/users/me` | `{ name?, email? }` | Updated user object |
| POST | `/users/me/change-password` | `{ current_password, new_password }` | `{ message: "Password updated" }` |

### Interview — Text MCQ
| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| GET | `/interview/questions/mcq` | `?category=&difficulty=&limit=10` | `{ questions: [{quiz_question_id, question_text, option_a/b/c/d, marks, category, difficulty}] }` |
| POST | `/interview/submit/mcq` | `{ answers_json: { "1": "A", "2": "C" } }` | `{ submission_id, score_obtained, max_score, results: [{quiz_question_id, question_text, correct_option, selected, is_correct, option_a/b/c/d}] }` |

### Interview — Voice
| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| GET | `/interview/questions/voice` | `?category=&difficulty=&limit=5` | `{ questions: [{question_id, question_text, category, difficulty}] }` |
| POST | `/interview/submit/voice` | `FormData { question_id, answer_text?, audio_file? }` | `{ answer_id, score, feedback_text, confidence_level }` |

### Interview — AI (ignore-random-master backend, port 8000)
| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| POST | `/api/interviews` | `{ candidate_profile, question_count }` | `{ session_id, questions: [{id, question, competency, ideal_answer_signals}], source }` |
| POST | `/api/interviews/{session_id}/submit` | `{ answers: [{question_id, answer}] }` | `{ session_id, evaluation: {...}, recommended_courses: [...] }` |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Check if backend is running |
| GET | `/health` | Check DB connection status |



---

## 🏗️ Resume Builder — Backend Contract

> **For the backend team:** The frontend Resume Builder page is fully built.
> It hits the endpoint below. You need to implement this endpoint.

### Endpoint
```
POST /resume/build
Content-Type: application/json
```

### Request Body (JSON payload sent by frontend)
```json
{
  "personal": {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+880 1X XX XX XX XX",
    "location": "Dhaka, Bangladesh",
    "linkedin": "linkedin.com/in/jane-doe",
    "portfolio": "github.com/janedoe"
  },
  "summary": "Enthusiastic CS student passionate about AI and full-stack development...",
  "education": [
    {
      "institution": "United International University",
      "degree": "Bachelor of Science",
      "field": "Computer Science & Engineering",
      "gpa": "3.75",
      "start": "2023-01",
      "end": "2026-12"
    }
  ],
  "experience": [
    {
      "company": "TechCorp Ltd.",
      "role": "Software Engineer Intern",
      "start": "2025-06",
      "end": "",
      "current": true,
      "description": "Developed REST APIs using FastAPI. Worked on React dashboard."
    }
  ],
  "skills": ["Python", "React", "FastAPI", "MySQL", "Git"],
  "projects": [
    {
      "title": "AI Interview System",
      "description": "Built a full-stack interview prep system with AI resume analysis.",
      "link": "https://github.com/user/ai-interview"
    }
  ],
  "certifications": [
    {
      "name": "AWS Cloud Practitioner",
      "issuer": "Amazon Web Services",
      "date": "2024-11"
    }
  ]
}
```

### Expected Response (200 OK)
```json
{
  "resume_id": 42,
  "message": "Resume saved successfully!",
  "download_url": "http://localhost:8000/resume/download/42"  
}
```
> `download_url` is optional. If provided, the frontend will automatically open it in a new tab so the user can download their resume as PDF.
> If you don't implement PDF generation yet, just return `resume_id` and `message`.

### Suggested DB Table
```sql
CREATE TABLE built_resumes (
  resume_id    INT PRIMARY KEY AUTO_INCREMENT,
  user_id      INT DEFAULT NULL,          -- optional FK to users.user_id
  resume_json  LONGTEXT NOT NULL,         -- store the full JSON payload
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
```

### Notes for backend team
- All fields except `personal.full_name` and `personal.email` are optional
- `skills` is sent as an **array of strings** (already split by comma on frontend)
- `education`, `experience`, `projects`, `certifications` are arrays — can be empty
- Dates use `YYYY-MM` format (month picker)
- `experience[].current = true` means the person still works there (no end date)
- Frontend file: `frontend/src/pages/ResumeBuilder.jsx` — look at the `handleSubmit` function for exact payload shape

---

## 🗺️ Pages & Routes

| URL | Page | Access |
|-----|------|--------|
| `/` | Home | Public (redirects to /dashboard if logged in) |
| `/login` | Login | Public (redirects to /dashboard if logged in) |
| `/signup` | Sign Up | Public (redirects to /dashboard if logged in) |
| `/dashboard` | Dashboard | 🔒 Must be logged in |
| `/resume` | Resume Analysis | 🔒 Must be logged in |
| `/resume-builder` | Resume Builder | 🔒 Must be logged in |
| `/interview` | Interview Hub | 🔒 Must be logged in |
| `/interview/text` | Text MCQ Interview | 🔒 Must be logged in |
| `/interview/voice` | Voice Interview | 🔒 Must be logged in |
| `/interview/ai` | AI Interview (Personalized) | 🔒 Must be logged in |
| `/profile` | Profile | 🔒 Must be logged in |

---

## 🎯 Interview — Backend Contract

> **For the backend team:** All interview pages are fully built on the frontend.
> They gracefully fall back to mock data if the backend is not ready.

---

## 🤖 AI Interview — Backend Contract (ignore-random-master)

> This uses a **separate FastAPI server** from the `ignore-random-master` folder.
> Run it on port 8000 separately. Frontend calls it directly via `http://127.0.0.1:8000`.

### How to run the AI backend
```powershell
cd "d:\SE project(Team)\ignore-random-master\backend"
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 0️⃣ Set OpenAI key (optional but recommended)
```env
# ignore-random-master/backend/.env
OPENAI_API_KEY=your_openai_key_here
```
> Without OpenAI key, the backend uses built-in fallback question templates. Still works!

### 1️⃣ Create AI Interview Session
```
POST /api/interviews
Content-Type: application/json
```
Request:
```json
{
  "candidate_profile": {
    "desired_role": "Backend Engineer",
    "experience_level": "mid",
    "current_skills": ["Python", "SQL"],
    "target_skills": ["FastAPI", "System Design"],
    "industry": "SaaS",
    "interview_focus": "backend"
  },
  "question_count": 5
}
```
Response:
```json
{
  "session_id": "uuid-here",
  "questions": [
    {
      "id": "q1",
      "question": "How do you approach designing scalable REST APIs?",
      "competency": "System Design",
      "ideal_answer_signals": ["Mentions versioning", "Talks about rate limiting", "Discusses caching"]
    }
  ],
  "source": "openai"
}
```

### 2️⃣ Submit Answers & Get Evaluation
```
POST /api/interviews/{session_id}/submit
Content-Type: application/json
```
Request:
```json
{
  "answers": [
    { "question_id": "q1", "answer": "I use RESTful conventions with versioning..." }
  ]
}
```
Response:
```json
{
  "session_id": "uuid-here",
  "evaluation": {
    "score": 78,
    "summary": "Strong fundamentals with room to improve on system design depth.",
    "strengths": ["Clear communication", "Good knowledge of REST"],
    "gaps": ["System Design", "Scalability concepts"],
    "skill_gaps": [
      { "skill": "System Design", "reason": "Lacked depth on distributed systems", "priority": 5 }
    ],
    "next_steps": ["Study CAP theorem", "Practice system design on Excalidraw"]
  },
  "recommended_courses": [
    {
      "title": "System Design Interview Fundamentals",
      "provider": "Educative",
      "url": "https://...",
      "description": "...",
      "relevance": "Directly addresses your system design gap",
      "difficulty": "intermediate",
      "estimated_duration_hours": 25
    }
  ]
}
```

### Notes for AI backend team
- Frontend file: `frontend/src/pages/InterviewAI.jsx`
- The frontend calls `http://127.0.0.1:8000` directly (not through the main FastAPI server)
- `candidate_profile.experience_level` must be `junior`, `mid`, or `senior`
- `question_count` is between 3 and 10
- The `session_id` from step 1 is stored in React state and used for step 2
- Frontend will open course URLs in a new tab if `url` is provided in `recommended_courses`

### ⚠️ DB Persistence — Action Required

The `ignore-random-master` backend stores sessions **in-memory only** (Python dict). If the server restarts, all sessions are lost.

**Two new tables have been added to `ai_interview_system.sql`** to persist AI interview data:

#### `ai_interview_sessions`
| Column | Type | Description |
|--------|------|-------------|
| `session_id` | VARCHAR(36) PK | UUID from AI backend |
| `user_id` | INT (FK → users) | Optional — NULL for guest |
| `desired_role` | VARCHAR(150) | e.g. "Backend Engineer" |
| `experience_level` | ENUM junior/mid/senior | |
| `current_skills` | TEXT | JSON array |
| `target_skills` | TEXT | JSON array |
| `industry` | VARCHAR(100) | Optional |
| `interview_focus` | VARCHAR(100) | Optional |
| `question_count` | INT | 3–10 |
| `questions_json` | LONGTEXT | Full questions array as JSON |
| `source` | VARCHAR(20) | `openai` or `fallback` |

#### `ai_interview_evaluations`
| Column | Type | Description |
|--------|------|-------------|
| `eval_id` | INT PK AUTO_INCREMENT | |
| `session_id` | VARCHAR(36) FK | Links to ai_interview_sessions |
| `score` | INT | 0–100 |
| `summary` | TEXT | AI summary paragraph |
| `strengths_json` | TEXT | JSON array of strings |
| `gaps_json` | TEXT | JSON array of strings |
| `skill_gaps_json` | LONGTEXT | JSON array of {skill, reason, priority} |
| `next_steps_json` | TEXT | JSON array of strings |
| `courses_json` | LONGTEXT | JSON array of course objects |
| `source` | VARCHAR(20) | `openai` or `fallback` |

**What the backend team needs to do:**
1. After `POST /api/interviews` → save to `ai_interview_sessions`
2. After `POST /api/interviews/{session_id}/submit` → save to `ai_interview_evaluations`
3. Both tables are already in `ai_interview_system.sql` — just re-import in phpMyAdmin

---

> They gracefully fall back to mock data if the backend is not ready.

---

### 1️⃣ Text MCQ Interview

**Fetch questions:**
```
GET /interview/questions/mcq?category=DBMS&difficulty=medium&limit=10
```
Response:
```json
{
  "questions": [
    {
      "quiz_question_id": 1,
      "question_text": "What does SQL stand for?",
      "option_a": "Structured Query Language",
      "option_b": "Simple Query Logic",
      "option_c": "Sequential Query Layer",
      "option_d": "Standard Question Library",
      "marks": 1,
      "category": "DBMS",
      "difficulty": "easy"
    }
  ]
}
```
> DB Table: `aptitude_quiz_questions` (quiz_question_id, question_text, option_a/b/c/d, correct_option, marks)

**Submit answers:**
```
POST /interview/submit/mcq
Content-Type: application/json
```
Request body:
```json
{
  "answers_json": {
    "1": "A",
    "2": "C",
    "3": "B"
  }
}
```
Response:
```json
{
  "submission_id": 5,
  "score_obtained": 8,
  "max_score": 10,
  "results": [
    {
      "quiz_question_id": 1,
      "question_text": "What does SQL stand for?",
      "correct_option": "A",
      "selected": "A",
      "is_correct": true,
      "option_a": "Structured Query Language",
      "option_b": "Simple Query Logic",
      "option_c": "Sequential Query Layer",
      "option_d": "Standard Question Library"
    }
  ]
}
```
> DB Table: `aptitude_quiz_submissions` (submission_id, user_id, score_obtained, max_score, answers_json)

---

### 2️⃣ Voice-Based Interview

**Fetch questions:**
```
GET /interview/questions/voice?category=DBMS&difficulty=medium&limit=5
```
Response:
```json
{
  "questions": [
    {
      "question_id": 1,
      "question_text": "Explain the difference between SQL and NoSQL databases.",
      "category": "DBMS",
      "difficulty": "medium"
    }
  ]
}
```
> DB Table: `questions` (question_id, question_text, category, difficulty, expected_answer)

**Submit a voice answer (per question):**
```
POST /interview/submit/voice
Content-Type: multipart/form-data
```
Form fields:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question_id` | int | Yes | ID from `questions` table |
| `answer_text` | string | No | Live transcript from browser speech-to-text |
| `audio_file` | file (.webm) | No | Audio recording blob |

Response:
```json
{
  "answer_id": 12,
  "score": 78.5,
  "feedback_text": "Good explanation. Try to mention CAP theorem for NoSQL.",
  "confidence_level": 0.85
}
```
> DB Tables: `answers` (answer_id, iq_id, answer_text, audio_path), `ai_feedback` (feedback_id, answer_id, score, feedback_text, confidence_level)

**Notes for backend team:**
- `audio_path` in `answers` table should store the saved audio file path
- Use Groq or Gemini AI to compare `answer_text` against `expected_answer` and generate `feedback_text` + `score`
- Frontend file: `frontend/src/pages/InterviewText.jsx` and `InterviewVoice.jsx`

---

## 👤 Default Accounts (Seed Data)

These accounts are already in the database after importing the SQL file:

| Name | Email | Password | Role |
|------|-------|----------|------|
| Jbk | `jbk@gmail.com` | `252525` | candidate |
| Rahim HR | `rahim@gmail.com` | `hashed_password_2` | interviewer |
| Admin User | `admin@gmail.com` | `hashed_password_3` | admin |

> ⚠️ Only the first account (`jbk`) has a usable plain-text password. The other two have placeholder hashes — create new accounts via the Signup page for testing.

---

## 🐛 Common Errors & Fixes

### ❌ `Unknown column 'users.full_name'`
**Cause:** SQLAlchemy model column name doesn't match the actual database.  
**Fix:** The model uses `name` and `password_hash` — make sure you imported `ai_interview_system.sql` (not `ai-system.sql`).

---

### ❌ `ValueError: password cannot be longer than 72 bytes`
**Cause:** Incompatibility between `passlib` and newer `bcrypt` versions.  
**Fix:** `security.py` now uses `bcrypt` directly instead of `passlib`. Make sure you're using the latest code.

---

### ❌ `(1054, "Unknown column ...")` — any column
**Cause:** The Python model doesn't match the actual MySQL table.  
**Fix:** Check `Backend/app/auth/models.py` — columns must exactly match your `users` table in phpMyAdmin.

---

### ❌ Backend crashes on startup (import error)
**Cause:** Missing Python packages.  
**Fix:**
```powershell
.\venv\Scripts\activate
pip install -r requirements.txt
pip install bcrypt
```

---

### ❌ Frontend shows "Network Error" or can't reach backend
**Cause:** Backend isn't running or XAMPP MySQL is stopped.  
**Fix:**
1. Check XAMPP → MySQL is green (running)
2. Check backend terminal — uvicorn should show `Application startup complete`
3. Visit `http://127.0.0.1:8000/health` in browser to confirm

---

### ❌ `.\venv\Scripts\activate` not recognized
**Cause:** Wrong directory — venv is inside the `Backend` folder, not root.  
**Fix:**
```powershell
cd "d:\SE project(Team)\ai-interview-system\Backend"
.\venv\Scripts\activate
```

---

## 👥 Team

SE Project Team — United International University