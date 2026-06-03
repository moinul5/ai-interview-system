# 🎯 AI Interview System — Frontend

> A modern React-based frontend for AI-powered interview preparation, resume analysis, and career readiness.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Pages & Routes](#-pages--routes)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Client](#-api-client-apiclientjs)
- [Authentication](#-authentication)
- [Browser Requirements](#-browser-requirements)

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **Vite 6** | Build tool & dev server |
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP requests via `apiClient.js` |
| **Vanilla CSS** | Custom design system (no Tailwind) |
| **SpeechRecognition API** | Voice-to-text in interviews |
| **SpeechSynthesis API** | Robot avatar voice output |
| **MediaDevices API** | Camera & microphone access |

---

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── pages/                    # All page-level components
│   │   ├── Home.jsx              # 🏠 Landing page (public)
│   │   ├── Login.jsx             # 🔑 Login page
│   │   ├── Signup.jsx            # 📝 Registration page
│   │   ├── Dashboard.jsx         # 📊 User dashboard overview
│   │   ├── Resume.jsx            # 📄 Resume upload & AI analysis
│   │   ├── ResumeBuilder.jsx     # 🏗️ Build resume from form
│   │   ├── Profile.jsx           # 👤 User profile with ATS score
│   │   ├── Interview.jsx         # 🎙️ Interview hub (pick mode)
│   │   ├── InterviewText.jsx     # ✍️ Text MCQ interview
│   │   ├── InterviewVoice.jsx    # 🎤 Voice-based interview
│   │   ├── InterviewAI.jsx       # 🤖 AI-powered personalized interview
│   │   ├── InterviewVideo.jsx    # 🎥 Robot Video Viva
│   │   └── NotFound.jsx          # 🚫 404 page
│   ├── components/               # Reusable UI components
│   │   ├── Navbar.jsx            # Top navigation bar
│   │   ├── Sidebar.jsx           # Dashboard sidebar
│   │   ├── Footer.jsx            # Page footer
│   │   └── Loader.jsx            # Loading spinner
│   ├── layouts/                  # Page layout wrappers
│   │   ├── PublicLayout.jsx      # Layout for public pages
│   │   └── DashboardLayout.jsx   # Layout with sidebar for auth pages
│   ├── context/
│   │   └── AuthContext.jsx       # Global auth state (user, login, logout)
│   ├── services/                 # API service layer
│   │   ├── apiClient.js          # Axios instance with interceptors
│   │   ├── authService.js        # Login / register API calls
│   │   ├── resumeService.js      # Resume analysis API calls
│   │   ├── interviewService.js   # Interview API calls
│   │   └── userService.js        # User profile API calls
│   ├── routes/                   # Route guards
│   │   ├── ProtectedRoute.jsx    # Redirects to /login if not logged in
│   │   └── GuestRoute.jsx        # Redirects to /dashboard if already logged in
│   ├── App.jsx                   # Root component & route definitions
│   └── index.css                 # Global styles
├── .env                          # Environment variables
├── index.html
├── vite.config.js
└── package.json
```

---

## 🗺 Pages & Routes

| URL | Page | Access | Description |
|---|---|---|---|
| `/` | Home | 🌐 Public | Landing page with feature highlights |
| `/login` | Login | 🚪 Guest only | Email + password login |
| `/signup` | Signup | 🚪 Guest only | Registration with role selection |
| `/dashboard` | Dashboard | 🔒 Protected | Activity overview & quick links |
| `/resume` | Resume Analysis | 🔒 Protected | Upload PDF/DOCX for AI scoring |
| `/resume-builder` | Resume Builder | 🔒 Protected | Build a resume from a structured form |
| `/interview` | Interview Hub | 🔒 Protected | Choose an interview mode |
| `/interview/text` | Text MCQ | 🔒 Protected | Timed multiple-choice quiz |
| `/interview/voice` | Voice Interview | 🔒 Protected | Answer questions with your microphone |
| `/interview/ai` | AI Interview | 🔒 Protected | AI-generated personalized questions |
| `/interview/video` | Robot Video Viva | 🔒 Protected | Camera + mic + speech-to-text + AI eval |
| `/profile` | Profile | 🔒 Protected | View ATS score, strengths & skills |
| `*` | Not Found | 🌐 Public | 404 error page |

### Route Guards

| Guard | File | Behavior |
|---|---|---|
| `ProtectedRoute` | `routes/ProtectedRoute.jsx` | Redirects unauthenticated users → `/login` |
| `GuestRoute` | `routes/GuestRoute.jsx` | Redirects authenticated users → `/dashboard` |

---

## ✨ Key Features

### 📄 Resume Analysis
Upload a **PDF** or **DOCX** file and get an AI-powered analysis including:
- **ATS Score** — How well the resume matches industry standards
- **Strengths** — What the resume does well
- **Weaknesses** — Areas for improvement
- **Missing Skills** — Skills to consider adding
- **Suggestions** — Actionable recommendations

### 🏗️ Resume Builder
- Fill in a structured form (personal info, education, experience, skills)
- Live preview as you type
- Save the generated resume

### 🎙️ 4 Interview Modes

| Mode | Component | Input | How It Works |
|---|---|---|---|
| ✍️ **Text MCQ** | `InterviewText.jsx` | Mouse/keyboard | Timed multiple-choice quiz |
| 🎤 **Voice** | `InterviewVoice.jsx` | Microphone | Speak your answers, voice is transcribed |
| 🤖 **AI Interview** | `InterviewAI.jsx` | Keyboard | AI generates personalized questions in real-time |
| 🎥 **Robot Video Viva** | `InterviewVideo.jsx` | Camera + Mic | Full AV interview experience (see below) |

### 🎥 Robot Video Viva — Deep Dive
The most advanced interview mode featuring a simulated viva experience:

```
┌────────────────────────────────────────────────┐
│  🤖 Robot Avatar speaks question               │
│       ↓ (SpeechSynthesis API)                  │
│  📷 Camera captures user on video              │
│  🎤 Mic records user's spoken answer           │
│       ↓ (SpeechRecognition API)                │
│  📝 Live transcript generated                  │
│       ↓                                        │
│  🧠 Groq AI evaluates the answer               │
│       ↓                                        │
│  📊 Score & feedback displayed                  │
└────────────────────────────────────────────────┘
```

### 🔐 User Data Isolation
- Each API request includes an `X-User-Id` header
- Users can only see their own resume analyses and interview results
- Auth state is managed globally via `AuthContext`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- Backend server running at `http://localhost:8000` (see [backend README](../backend/README.md))

### Installation

```powershell
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173** 🚀

### Build for Production

```powershell
npm run build
npm run preview   # Preview the production build locally
```

---

## 🔧 Environment Variables

Create a `.env` file in the `frontend/` root (or modify the existing one):

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL for the backend API |

```env
VITE_API_BASE_URL=http://localhost:8000
```

> **Note:** All Vite environment variables must be prefixed with `VITE_` to be exposed to the client bundle.

---

## 🔌 API Client (`apiClient.js`)

The Axios instance in `services/apiClient.js` provides a centralized HTTP client with the following configuration:

| Feature | Details |
|---|---|
| **Base URL** | Loaded from `VITE_API_BASE_URL` env variable |
| **Timeout** | 60 seconds (accommodates AI processing time) |
| **Auth Header** | Auto-injects `X-User-Id` from `localStorage` on every request |
| **File Uploads** | Auto-removes `Content-Type` header for `FormData` payloads |

### Request Interceptor Flow

```
Every Request
    │
    ├── Read user from localStorage
    │       ↓
    ├── Attach X-User-Id header
    │       ↓
    ├── Is body FormData?
    │   ├── Yes → Remove Content-Type (let browser set multipart boundary)
    │   └── No  → Keep default Content-Type
    │       ↓
    └── Send request to backend
```

### Service Layer

| Service | File | Responsibilities |
|---|---|---|
| **Auth** | `authService.js` | `login()`, `register()` |
| **Resume** | `resumeService.js` | Upload & analyze resumes |
| **Interview** | `interviewService.js` | Fetch questions, submit answers |
| **User** | `userService.js` | Fetch/update user profile |

---

## 🔐 Authentication

Authentication uses a simple email + password flow with client-side state management:

| Aspect | Implementation |
|---|---|
| **State Management** | `AuthContext.jsx` (React Context API) |
| **Persistence** | `localStorage` |
| **Roles** | `candidate` / `interviewer` |
| **Route Protection** | `ProtectedRoute` & `GuestRoute` wrappers |

### Auth Flow

```
User Login
    │
    ├── POST /api/auth/login (email + password)
    │       ↓
    ├── Receive user object from backend
    │       ↓
    ├── Store user in localStorage
    │       ↓
    ├── Update AuthContext state
    │       ↓
    └── Redirect to /dashboard
```

---

## 🌐 Browser Requirements

| Feature | Chrome | Edge | Firefox | Safari |
|---|:---:|:---:|:---:|:---:|
| Core App | ✅ | ✅ | ✅ | ✅ |
| SpeechRecognition (voice-to-text) | ✅ | ✅ | ❌ | ❌ |
| SpeechSynthesis (robot voice) | ✅ | ✅ | ✅ | ✅ |
| Camera & Microphone | ✅ | ✅ | ✅ | ✅ |

> **⚠️ Recommended:** Use **Google Chrome** or **Microsoft Edge** for the full experience, especially for voice-based and video interview features.

> **🔒 HTTPS Required:** Camera and microphone access requires a secure context — either `https://` or `localhost`.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 5173 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |

---

## 🏗 Layout System

The app uses two layout wrappers to maintain consistent UI across page types:

| Layout | Used For | Components Included |
|---|---|---|
| `PublicLayout` | Home, Login, Signup | `Navbar` + `Footer` |
| `DashboardLayout` | All protected pages | `Navbar` + `Sidebar` + `Footer` |

---

<p align="center">
  Built with ❤️ using React + Vite
</p>
