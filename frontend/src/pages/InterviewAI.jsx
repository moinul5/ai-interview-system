/**
 * InterviewAI.jsx
 * ---------------
 * AI-powered open-ended interview session.
 *
 * Flow:
 *   1. Setup  → user fills candidate profile (role, level, skills)
 *   2. Session → AI-generated questions shown one by one, user types answers
 *   3. Result  → score, strengths, gaps, skill gaps, course recommendations
 *
 * API Endpoints (from ignore-random-master backend):
 *   POST /api/interviews
 *        Body: { candidate_profile, question_count }
 *        → { session_id, questions: [{id, question, competency, ideal_answer_signals}], source }
 *
 *   POST /api/interviews/{session_id}/submit
 *        Body: { answers: [{question_id, answer}], interviewer_notes? }
 *        → { session_id, evaluation: { score, summary, strengths, gaps, skill_gaps, next_steps },
 *            recommended_courses: [{title, provider, url, description, relevance, difficulty, estimated_duration_hours}] }
 *
 * Base URL: http://127.0.0.1:8000 (same FastAPI server, different prefix)
 *
 * Route: /interview/ai
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Config ───────────────────────────────────────────────────────────────────
const AI_BASE_URL = "http://127.0.0.1:8000";

const EXPERIENCE_LEVELS = [
  { value: "junior",  label: "Junior (0–2 years)" },
  { value: "mid",     label: "Mid-Level (2–5 years)" },
  { value: "senior",  label: "Senior (5+ years)" },
];

const COMMON_ROLES = [
  "Backend Engineer", "Frontend Engineer", "Full Stack Developer",
  "Data Scientist", "Machine Learning Engineer", "DevOps Engineer",
  "Mobile Developer", "AI Engineer", "Software Engineer",
];

const COMMON_SKILLS = [
  "Python", "JavaScript", "React", "FastAPI", "Node.js", "SQL", "MySQL",
  "MongoDB", "Docker", "Git", "REST API", "System Design", "Data Structures",
  "Algorithms", "Machine Learning", "Deep Learning", "TypeScript", "Java",
];

// ─── Skill tag input component ─────────────────────────────────────────────
const SkillInput = ({ value, onChange, placeholder }) => {
  const [input, setInput] = useState("");

  const add = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const remove = (skill) => onChange(value.filter(s => s !== skill));

  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      add(input);
    }
    if (e.key === "Backspace" && !input && value.length) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="ai-skill-input">
      <div className="ai-skill-tags">
        {value.map(s => (
          <span key={s} className="ai-skill-tag">
            {s}
            <button type="button" onClick={() => remove(s)} className="ai-skill-tag__remove">×</button>
          </span>
        ))}
        <input
          className="ai-skill-tags__input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={value.length === 0 ? placeholder : "Add more..."}
        />
      </div>
      {/* Quick-add suggestions */}
      <div className="ai-skill-suggestions">
        {COMMON_SKILLS.filter(s => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase())).slice(0, 6).map(s => (
          <button key={s} type="button" className="ai-skill-suggestion" onClick={() => add(s)}>{s}</button>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const InterviewAI = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase]       = useState("setup");   // setup | session | submitting | result
  const [profile, setProfile]   = useState({
    desired_role: "",
    experience_level: "mid",
    current_skills: [],
    target_skills: [],
    industry: "",
    interview_focus: "",
  });
  const [questionCount, setQuestionCount] = useState(5);
  const [sessionId, setSessionId]         = useState(null);
  const [questions, setQuestions]         = useState([]);
  const [answers, setAnswers]             = useState({});   // { question_id: answer_text }
  const [current, setCurrent]             = useState(0);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [result, setResult]               = useState(null);
  const [source, setSource]               = useState("");
  const topRef = useRef(null);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth" });

  // ── Create interview session ───────────────────────────────────────────────
  const startSession = async () => {
    if (!profile.desired_role.trim()) {
      setError("Please enter your desired role.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${AI_BASE_URL}/api/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_profile: profile,
          question_count: questionCount,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setSessionId(data.session_id);
      setQuestions(data.questions);
      setSource(data.source);
      setAnswers({});
      setCurrent(0);
      setPhase("session");
    } catch (e) {
      setError(`Could not connect to AI backend: ${e.message}. Make sure the AI server is running on port 8000.`);
    } finally {
      setLoading(false);
      scrollTop();
    }
  };

  // ── Submit all answers ─────────────────────────────────────────────────────
  const submitAnswers = async () => {
    setPhase("submitting");

    const answersPayload = questions.map(q => ({
      question_id: q.id,
      answer: answers[q.id] || "",
    }));

    try {
      const res = await fetch(`${AI_BASE_URL}/api/interviews/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersPayload }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setPhase("result");
    } catch (e) {
      setError(`Evaluation failed: ${e.message}`);
      setPhase("session");
    } finally {
      scrollTop();
    }
  };

  const updateProfile = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const q = questions[current];
  const answeredCount = Object.values(answers).filter(a => a?.trim()).length;
  const progress = questions.length ? (answeredCount / questions.length) * 100 : 0;

  // ── SETUP PHASE ────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="page ai-page" ref={topRef}>
        <button className="iv-back-btn" onClick={() => navigate("/interview")}>← Back to Interview Hub</button>

        <div className="ai-setup-layout">
          {/* Left: form */}
          <div className="ai-setup-card">
            <div className="ai-setup-card__header">
              <span className="ai-setup-card__icon">🤖</span>
              <div>
                <h1 className="ai-setup-card__title">AI Interview</h1>
                <p className="ai-setup-card__sub">Tell us about yourself — AI will generate a personalized interview</p>
              </div>
            </div>

            {error && <div className="alert alert--error">{error}</div>}

            <div className="ai-form">
              {/* Role */}
              <div className="form-group">
                <label className="form-label">Desired Role <span style={{color:"var(--color-danger)"}}>*</span></label>
                <div className="ai-role-suggestions">
                  {COMMON_ROLES.map(r => (
                    <button key={r} type="button"
                      className={`ai-role-chip${profile.desired_role === r ? " ai-role-chip--active" : ""}`}
                      onClick={() => updateProfile("desired_role", r)}
                    >{r}</button>
                  ))}
                </div>
                <input
                  type="text" className="form-input" style={{ marginTop: "0.5rem" }}
                  placeholder="Or type a custom role..."
                  value={profile.desired_role}
                  onChange={e => updateProfile("desired_role", e.target.value)}
                />
              </div>

              {/* Experience */}
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <div className="ai-level-btns">
                  {EXPERIENCE_LEVELS.map(l => (
                    <button key={l.value} type="button"
                      className={`ai-level-btn${profile.experience_level === l.value ? " ai-level-btn--active" : ""}`}
                      onClick={() => updateProfile("experience_level", l.value)}
                    >{l.label}</button>
                  ))}
                </div>
              </div>

              {/* Current skills */}
              <div className="form-group">
                <label className="form-label">Your Current Skills</label>
                <p className="ai-field-hint">Skills you already have. Press Enter or comma to add.</p>
                <SkillInput
                  value={profile.current_skills}
                  onChange={val => updateProfile("current_skills", val)}
                  placeholder="e.g. Python, React, SQL..."
                />
              </div>

              {/* Target skills */}
              <div className="form-group">
                <label className="form-label">Skills You Want to Improve</label>
                <p className="ai-field-hint">What do you want to get better at? AI will focus questions here.</p>
                <SkillInput
                  value={profile.target_skills}
                  onChange={val => updateProfile("target_skills", val)}
                  placeholder="e.g. System Design, FastAPI..."
                />
              </div>

              {/* Industry & Focus */}
              <div className="ai-two-col">
                <div className="form-group">
                  <label className="form-label">Industry (optional)</label>
                  <input type="text" className="form-input"
                    placeholder="e.g. SaaS, Finance, Healthcare"
                    value={profile.industry}
                    onChange={e => updateProfile("industry", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Interview Focus (optional)</label>
                  <input type="text" className="form-input"
                    placeholder="e.g. backend, algorithms, leadership"
                    value={profile.interview_focus}
                    onChange={e => updateProfile("interview_focus", e.target.value)}
                  />
                </div>
              </div>

              {/* Question count */}
              <div className="form-group">
                <label className="form-label">Number of Questions: <strong>{questionCount}</strong></label>
                <input type="range" min={3} max={10} value={questionCount}
                  onChange={e => setQuestionCount(parseInt(e.target.value))}
                  className="ai-range"
                />
                <div className="ai-range-labels"><span>3 (quick)</span><span>10 (thorough)</span></div>
              </div>

              <button className="btn btn--primary btn--full btn--lg" onClick={startSession} disabled={loading}>
                {loading
                  ? <><span className="auth-spinner" /> Generating Interview...</>
                  : "🤖 Generate My Interview →"}
              </button>
            </div>
          </div>

          {/* Right: info panel */}
          <div className="ai-info-panel">
            <h3 className="ai-info-panel__title">What happens next?</h3>
            <div className="ai-info-steps">
              {[
                { icon: "🧠", title: "AI Reads Your Profile", desc: "We analyze your role, skills, and goals to tailor questions specifically for you." },
                { icon: "❓", title: "Personalized Questions", desc: `${questionCount} open-ended questions based on your desired role and target skills.` },
                { icon: "✍️", title: "You Answer in Text", desc: "Type your answers. Take your time — quality matters more than speed." },
                { icon: "📊", title: "AI Evaluates", desc: "Get a score, strengths, gaps, and a list of courses to fill skill gaps." },
              ].map((s, i) => (
                <div key={i} className="ai-info-step">
                  <span className="ai-info-step__icon">{s.icon}</span>
                  <div>
                    <p className="ai-info-step__title">{s.title}</p>
                    <p className="ai-info-step__desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {source === "fallback" && (
              <div className="ai-fallback-note">
                ⚠️ Running without OpenAI key — using built-in question templates.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── SUBMITTING PHASE ───────────────────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div className="page ai-page">
        <div className="ai-submitting">
          <div className="ai-submitting__spinner">🤖</div>
          <h2>Evaluating your answers...</h2>
          <p>AI is analyzing your responses, identifying skill gaps, and preparing course recommendations.</p>
          <div className="ai-submitting__dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  // ── SESSION PHASE ──────────────────────────────────────────────────────────
  if (phase === "session") {
    if (!q) return null;

    return (
      <div className="page ai-page ai-session-page" ref={topRef}>
        {/* Progress bar */}
        <div className="iv-progress-bar">
          <div className="iv-progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        {source === "fallback" && (
          <div className="iv-mock-banner">⚠ Using built-in question templates (no OpenAI key set)</div>
        )}

        {/* Header */}
        <div className="ai-session-header">
          <div>
            <p className="ai-session-header__role">🎯 {profile.desired_role} · {profile.experience_level}</p>
            <p className="ai-session-header__progress">{answeredCount} of {questions.length} answered</p>
          </div>
          <div className="ai-q-dots">
            {questions.map((qu, i) => (
              <button key={i}
                className={`iv-q-dot${i === current ? " iv-q-dot--active" : ""}${answers[qu.id]?.trim() ? " iv-q-dot--answered" : ""}`}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
        </div>

        {/* Question card */}
        <div className="ai-question-card">
          <div className="ai-question-card__meta">
            <span className="iv-tag">Q{current + 1} / {questions.length}</span>
            <span className="iv-tag ai-competency-tag">🎯 {q.competency}</span>
          </div>
          <p className="ai-question-card__text">{q.question}</p>

          {/* Ideal answer signals (hints) */}
          {q.ideal_answer_signals?.length > 0 && (
            <details className="ai-signals">
              <summary>💡 What a good answer should cover</summary>
              <ul className="ai-signals__list">
                {q.ideal_answer_signals.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </details>
          )}
        </div>

        {/* Answer textarea */}
        <div className="ai-answer-wrap">
          <label className="form-label">Your Answer</label>
          <textarea
            className="form-input form-textarea ai-answer-textarea"
            placeholder="Type your answer here. Be specific and use examples where possible..."
            value={answers[q.id] || ""}
            onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
            rows={6}
          />
          <div className="ai-answer-meta">
            <span className="ai-char-count">{(answers[q.id] || "").length} characters</span>
            {(answers[q.id] || "").length < 50 && (
              <span className="ai-answer-hint">Tip: Longer, detailed answers score better</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="ai-session-nav">
          <button className="btn btn--outline" onClick={() => { setCurrent(c => c - 1); scrollTop(); }} disabled={current === 0}>← Prev</button>

          {current < questions.length - 1 ? (
            <button className="btn btn--primary" onClick={() => { setCurrent(c => c + 1); scrollTop(); }}>
              Next →
            </button>
          ) : (
            <button
              className="btn btn--primary"
              onClick={submitAnswers}
              disabled={answeredCount === 0}
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
            >
              Submit for AI Evaluation ✓
            </button>
          )}
        </div>

        {error && <div className="alert alert--error" style={{ marginTop: "1rem" }}>{error}</div>}
      </div>
    );
  }

  // ── RESULT PHASE ───────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const { evaluation, recommended_courses } = result;
    const score = evaluation?.score || 0;
    const grade = score >= 80 ? { label: "Excellent! 🎉", color: "#22c55e" }
                : score >= 60 ? { label: "Good Job! 👍",  color: "#4f46e5" }
                : score >= 40 ? { label: "Keep Practicing 📚", color: "#f97316" }
                :               { label: "Needs Work 💪",  color: "#ef4444" };

    return (
      <div className="page ai-page ai-result-page" ref={topRef}>

        {/* Score header */}
        <div className="iv-result-header">
          <div className="iv-result-score-ring">
            <svg viewBox="0 0 120 120" width="140" height="140">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none"
                stroke={grade.color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${score * 3.27} 327`}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="iv-result-score-ring__label">
              <span className="iv-result-score-ring__pct" style={{ color: grade.color }}>{score}</span>
              <span className="iv-result-score-ring__raw">/ 100</span>
            </div>
          </div>
          <div>
            <h1 className="iv-result-grade" style={{ color: grade.color }}>{grade.label}</h1>
            <p className="iv-result-sub">{profile.desired_role} · {profile.experience_level}</p>
            {result.source === "fallback" && <p className="iv-mock-note">⚠ Evaluated with built-in logic (no OpenAI key)</p>}
          </div>
        </div>

        {/* Summary */}
        {evaluation.summary && (
          <div className="ai-result-section">
            <h2 className="section-title">📝 Summary</h2>
            <p className="ai-result-summary">{evaluation.summary}</p>
          </div>
        )}

        {/* Strengths & Gaps */}
        <div className="ai-sg-grid">
          {evaluation.strengths?.length > 0 && (
            <div className="ai-sg-card ai-sg-card--strength">
              <h3 className="ai-sg-card__title">✅ Strengths</h3>
              <ul className="ai-sg-list">
                {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {evaluation.gaps?.length > 0 && (
            <div className="ai-sg-card ai-sg-card--gap">
              <h3 className="ai-sg-card__title">⚠️ Areas to Improve</h3>
              <ul className="ai-sg-list">
                {evaluation.gaps.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Skill Gaps */}
        {evaluation.skill_gaps?.length > 0 && (
          <div className="ai-result-section">
            <h2 className="section-title">🎯 Skill Gaps</h2>
            <div className="ai-skill-gaps">
              {evaluation.skill_gaps.map((sg, i) => (
                <div key={i} className="ai-skill-gap-card">
                  <div className="ai-skill-gap-card__header">
                    <span className="ai-skill-gap-card__name">{sg.skill}</span>
                    <div className="ai-priority-dots">
                      {[1,2,3,4,5].map(n => (
                        <span key={n} className={`ai-priority-dot${n <= sg.priority ? " ai-priority-dot--filled" : ""}`} />
                      ))}
                      <span className="ai-priority-label">Priority</span>
                    </div>
                  </div>
                  <p className="ai-skill-gap-card__reason">{sg.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {evaluation.next_steps?.length > 0 && (
          <div className="ai-result-section">
            <h2 className="section-title">🚀 Next Steps</h2>
            <ol className="ai-next-steps">
              {evaluation.next_steps.map((step, i) => (
                <li key={i} className="ai-next-step">
                  <span className="ai-next-step__num">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Course Recommendations */}
        {recommended_courses?.length > 0 && (
          <div className="ai-result-section">
            <h2 className="section-title">📚 Recommended Courses</h2>
            <div className="ai-courses-grid">
              {recommended_courses.map((course, i) => (
                <div key={i} className="ai-course-card">
                  <div className="ai-course-card__header">
                    <div>
                      <p className="ai-course-card__title">{course.title}</p>
                      <p className="ai-course-card__provider">{course.provider}</p>
                    </div>
                    {course.difficulty && (
                      <span className={`iv-tag iv-tag--${course.difficulty === "beginner" ? "easy" : course.difficulty === "intermediate" ? "medium" : "hard"}`}>
                        {course.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="ai-course-card__desc">{course.description}</p>
                  <div className="ai-course-card__footer">
                    {course.estimated_duration_hours && (
                      <span className="ai-course-card__duration">⏱ ~{course.estimated_duration_hours}h</span>
                    )}
                    {course.relevance && (
                      <span className="ai-course-card__relevance">🎯 {course.relevance}</span>
                    )}
                    {course.url && (
                      <a href={course.url} target="_blank" rel="noreferrer" className="btn btn--sm btn--outline" style={{ marginLeft: "auto" }}>
                        View Course →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="iv-result-actions">
          <button className="btn btn--outline" onClick={() => { setPhase("setup"); setResult(null); setSessionId(null); }}>Try Again</button>
          <button className="btn btn--primary" onClick={() => navigate("/interview")}>← Back to Hub</button>
        </div>
      </div>
    );
  }

  return null;
};

export default InterviewAI;
