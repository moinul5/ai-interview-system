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

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create a new account | No |
| POST | `/auth/login` | Login with email & password | No |

### Resume
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/resume/analyze` | Upload PDF/DOCX for AI analysis | No |
| GET | `/resume/history` | Get past analysis results | No |
| POST | `/resume/build` | Save a resume built via the Resume Builder form | No |
| GET | `/resume/build/{resume_id}` | Fetch a previously built resume by ID | No |

### Quiz
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/quiz/questions` | Get quiz questions | No |
| POST | `/quiz/submit` | Submit quiz answers | No |

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
| `/profile` | Profile | 🔒 Must be logged in |

---

## 🎯 Interview — Backend Contract

> **For the backend team:** Both interview pages (Text MCQ + Voice) are fully built on the frontend.
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