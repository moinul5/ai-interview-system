/**
 * InterviewText.jsx
 * -----------------
 * Text MCQ interview session page.
 *
 * DB Tables used:
 *   - aptitude_quiz_questions  (question_text, option_a/b/c/d, correct_option, marks)
 *   - aptitude_quiz_submissions (submission_id, score_obtained, max_score, answers_json)
 *
 * API Endpoints (backend team to implement):
 *   GET  /interview/questions/mcq?category=&difficulty=&limit=10
 *        → { questions: [ { quiz_question_id, question_text, option_a, option_b, option_c, option_d, marks } ] }
 *   POST /interview/submit/mcq
 *        → { submission_id, score_obtained, max_score, results: [{quiz_question_id, correct_option, selected, is_correct}] }
 *
 * Route: /interview/text
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";

const TIMER_SECONDS = 30; // per question

// Mock questions for when backend is not ready
const MOCK_QUESTIONS = [
  {
    quiz_question_id: 1,
    question_text: "What does SQL stand for?",
    option_a: "Structured Query Language",
    option_b: "Simple Query Logic",
    option_c: "Sequential Query Layer",
    option_d: "Standard Question Library",
    marks: 1,
  },
  {
    quiz_question_id: 2,
    question_text: "Which of the following is a NoSQL database?",
    option_a: "MySQL",
    option_b: "PostgreSQL",
    option_c: "MongoDB",
    option_d: "Oracle",
    marks: 1,
  },
  {
    quiz_question_id: 3,
    question_text: "What is normalization in databases?",
    option_a: "Increasing data redundancy",
    option_b: "Organizing data to reduce redundancy",
    option_c: "Combining all tables into one",
    option_d: "Encrypting database columns",
    marks: 1,
  },
  {
    quiz_question_id: 4,
    question_text: "Which HTTP method is used to create a new resource?",
    option_a: "GET",
    option_b: "DELETE",
    option_c: "PUT",
    option_d: "POST",
    marks: 1,
  },
  {
    quiz_question_id: 5,
    question_text: "In React, what hook is used for side effects?",
    option_a: "useState",
    option_b: "useEffect",
    option_c: "useContext",
    option_d: "useRef",
    marks: 1,
  },
];

const OPTIONS = ["A", "B", "C", "D"];
const OPTION_KEYS = ["option_a", "option_b", "option_c", "option_d"];

const InterviewText = () => {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────────
  const [phase, setPhase]           = useState("config");   // config | session | result
  const [config, setConfig]         = useState({ category: "", difficulty: "", limit: 5 });
  const [questions, setQuestions]   = useState([]);
  const [current, setCurrent]       = useState(0);
  const [selected, setSelected]     = useState({});         // { quiz_question_id: "A"|"B"|"C"|"D" }
  const [timeLeft, setTimeLeft]     = useState(TIMER_SECONDS);
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [usingMock, setUsingMock]   = useState(false);
  const timerRef = useRef(null);

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "session") return;
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleNext(true); return TIMER_SECONDS; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [current, phase]);

  // ── Load questions ────────────────────────────────────────────────────────────
  const startSession = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (config.category)   params.append("category",   config.category);
      if (config.difficulty) params.append("difficulty", config.difficulty);
      params.append("limit", config.limit);

      const res = await apiClient.get(`/interview/questions/mcq?${params}`);
      setQuestions(res.data.questions || res.data);
      setUsingMock(false);
    } catch {
      // Backend not ready — use mock data
      setQuestions(MOCK_QUESTIONS.slice(0, config.limit));
      setUsingMock(true);
    } finally {
      setLoading(false);
      setCurrent(0);
      setSelected({});
      setResult(null);
      setPhase("session");
    }
  };

  // ── Answer selection ─────────────────────────────────────────────────────────
  const selectOption = (qid, opt) => {
    setSelected(prev => ({ ...prev, [qid]: opt }));
  };

  // ── Navigate questions ────────────────────────────────────────────────────────
  const handleNext = (auto = false) => {
    clearInterval(timerRef.current);
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      submitAnswers();
    }
  };

  const handlePrev = () => {
    clearInterval(timerRef.current);
    if (current > 0) setCurrent(c => c - 1);
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const submitAnswers = async () => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    setPhase("result");

    const answersJson = {};
    questions.forEach(q => {
      answersJson[q.quiz_question_id] = selected[q.quiz_question_id] || null;
    });

    const payload = {
      answers_json: answersJson,
    };

    try {
      const res = await apiClient.post("/interview/submit/mcq", payload);
      setResult(res.data);
    } catch {
      // Calculate locally if backend not ready
      let score = 0;
      const results = questions.map(q => {
        const correct = q.correct_option || "A"; // fallback for mock
        const userAns = selected[q.quiz_question_id] || null;
        const isCorrect = userAns === correct;
        if (isCorrect) score += (q.marks || 1);
        return { quiz_question_id: q.quiz_question_id, question_text: q.question_text, correct_option: correct, selected: userAns, is_correct: isCorrect, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d };
      });
      setResult({
        score_obtained: score,
        max_score: questions.reduce((s, q) => s + (q.marks || 1), 0),
        results,
        mock: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render: Config Phase ──────────────────────────────────────────────────────
  if (phase === "config") {
    return (
      <div className="page iv-config-page">
        <button className="iv-back-btn" onClick={() => navigate("/interview")}>← Back to Interview Hub</button>
        <div className="iv-config-card">
          <div className="iv-config-card__icon">📝</div>
          <h1 className="iv-config-card__title">Text MCQ Interview</h1>
          <p className="iv-config-card__sub">Configure your session then click Start.</p>

          <div className="iv-config-fields">
            <div className="form-group">
              <label className="form-label">Category (optional)</label>
              <select className="form-input" value={config.category} onChange={e => setConfig(c => ({ ...c, category: e.target.value }))}>
                <option value="">All Categories</option>
                <option value="DBMS">DBMS</option>
                <option value="Programming">Programming</option>
                <option value="Web Development">Web Development</option>
                <option value="Data Structures">Data Structures</option>
                <option value="Algorithms">Algorithms</option>
                <option value="Operating Systems">Operating Systems</option>
                <option value="Networking">Networking</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-input" value={config.difficulty} onChange={e => setConfig(c => ({ ...c, difficulty: e.target.value }))}>
                <option value="">Any Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Questions</label>
              <select className="form-input" value={config.limit} onChange={e => setConfig(c => ({ ...c, limit: parseInt(e.target.value) }))}>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>
          </div>

          <div className="iv-config-info">
            <span>⏱ {TIMER_SECONDS}s per question</span>
            <span>✅ Auto-graded</span>
            <span>📊 Instant results</span>
          </div>

          <button className="btn btn--primary btn--full btn--lg" onClick={startSession} disabled={loading}>
            {loading ? <span className="auth-spinner" /> : "Start Interview →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Session Phase ─────────────────────────────────────────────────────
  if (phase === "session") {
    const q = questions[current];
    if (!q) return null;
    const progress = ((current + 1) / questions.length) * 100;
    const timerPct = (timeLeft / TIMER_SECONDS) * 100;
    const timerColor = timeLeft > 15 ? "#22c55e" : timeLeft > 7 ? "#f97316" : "#ef4444";

    return (
      <div className="page iv-session-page">
        {usingMock && (
          <div className="iv-mock-banner">⚠ Backend not connected — showing sample questions. Answers are not saved.</div>
        )}

        {/* Progress bar */}
        <div className="iv-progress-bar">
          <div className="iv-progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Header row */}
        <div className="iv-session-header">
          <span className="iv-q-counter">Question {current + 1} / {questions.length}</span>
          {/* Timer ring */}
          <div className="iv-timer" style={{ "--timer-color": timerColor }}>
            <svg viewBox="0 0 40 40" className="iv-timer__svg">
              <circle cx="20" cy="20" r="17" className="iv-timer__bg" />
              <circle cx="20" cy="20" r="17" className="iv-timer__fill"
                strokeDasharray={`${timerPct * 1.069} 107`}
                stroke={timerColor}
              />
            </svg>
            <span className="iv-timer__label" style={{ color: timerColor }}>{timeLeft}</span>
          </div>
        </div>

        {/* Question card */}
        <div className="iv-question-card">
          <div className="iv-question-card__meta">
            {q.category && <span className="iv-tag">{q.category}</span>}
            {q.difficulty && <span className={`iv-tag iv-tag--${q.difficulty}`}>{q.difficulty}</span>}
            <span className="iv-tag iv-tag--marks">{q.marks || 1} mark{q.marks !== 1 ? "s" : ""}</span>
          </div>
          <p className="iv-question-card__text">{q.question_text}</p>

          {/* Options */}
          <div className="iv-options">
            {OPTIONS.map((opt, i) => {
              const text = q[OPTION_KEYS[i]];
              if (!text) return null;
              const isSelected = selected[q.quiz_question_id] === opt;
              return (
                <button
                  key={opt}
                  className={`iv-option${isSelected ? " iv-option--selected" : ""}`}
                  onClick={() => selectOption(q.quiz_question_id, opt)}
                >
                  <span className="iv-option__letter">{opt}</span>
                  <span className="iv-option__text">{text}</span>
                  {isSelected && <span className="iv-option__check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="iv-session-nav">
          <button className="btn btn--outline" onClick={handlePrev} disabled={current === 0}>← Prev</button>
          <div className="iv-q-dots">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`iv-q-dot${i === current ? " iv-q-dot--active" : ""}${selected[questions[i]?.quiz_question_id] ? " iv-q-dot--answered" : ""}`}
                onClick={() => { clearInterval(timerRef.current); setCurrent(i); }}
              />
            ))}
          </div>
          <button className="btn btn--primary" onClick={() => handleNext(false)}>
            {current === questions.length - 1 ? "Submit ✓" : "Next →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Result Phase ──────────────────────────────────────────────────────
  if (phase === "result") {
    if (submitting) {
      return <div className="page iv-loading"><span className="auth-spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /><p>Calculating your score...</p></div>;
    }

    const pct = result ? Math.round((result.score_obtained / result.max_score) * 100) : 0;
    const grade = pct >= 80 ? { label: "Excellent! 🎉", color: "#22c55e" }
                : pct >= 60 ? { label: "Good Job! 👍", color: "#4f46e5" }
                : pct >= 40 ? { label: "Keep Practicing 📚", color: "#f97316" }
                :             { label: "Needs Improvement 💪", color: "#ef4444" };

    return (
      <div className="page iv-result-page">
        <div className="iv-result-header">
          <div className="iv-result-score-ring">
            <svg viewBox="0 0 120 120" width="140" height="140">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none"
                stroke={grade.color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${pct * 3.27} 327`}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="iv-result-score-ring__label">
              <span className="iv-result-score-ring__pct" style={{ color: grade.color }}>{pct}%</span>
              <span className="iv-result-score-ring__raw">{result?.score_obtained}/{result?.max_score}</span>
            </div>
          </div>
          <div>
            <h1 className="iv-result-grade" style={{ color: grade.color }}>{grade.label}</h1>
            <p className="iv-result-sub">You scored {result?.score_obtained} out of {result?.max_score} marks</p>
            {result?.mock && <p className="iv-mock-note">⚠ Results calculated locally (backend not connected)</p>}
          </div>
        </div>

        {/* Question-by-question review */}
        {result?.results && (
          <div className="iv-review">
            <h2 className="section-title">Review Answers</h2>
            <div className="iv-review-list">
              {result.results.map((r, i) => (
                <div key={r.quiz_question_id} className={`iv-review-item${r.is_correct ? " iv-review-item--correct" : " iv-review-item--wrong"}`}>
                  <div className="iv-review-item__header">
                    <span className="iv-review-item__num">Q{i + 1}</span>
                    <span className={`iv-review-item__verdict${r.is_correct ? " iv-review-item__verdict--correct" : ""}`}>
                      {r.is_correct ? "✓ Correct" : "✗ Wrong"}
                    </span>
                  </div>
                  <p className="iv-review-item__q">{r.question_text}</p>
                  <div className="iv-review-options">
                    {OPTIONS.map((opt, oi) => {
                      const text = r[OPTION_KEYS[oi]];
                      if (!text) return null;
                      const isCorrect = opt === r.correct_option;
                      const isSelected = opt === r.selected;
                      return (
                        <div key={opt} className={`iv-review-opt${isCorrect ? " iv-review-opt--correct" : ""}${isSelected && !isCorrect ? " iv-review-opt--wrong" : ""}`}>
                          <span>{opt}.</span> {text}
                          {isCorrect && <span className="iv-review-opt__tag">✓ Correct Answer</span>}
                          {isSelected && !isCorrect && <span className="iv-review-opt__tag iv-review-opt__tag--wrong">✗ Your Answer</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="iv-result-actions">
          <button className="btn btn--outline" onClick={() => { setPhase("config"); setResult(null); }}>Try Again</button>
          <button className="btn btn--primary" onClick={() => navigate("/interview")}>← Back to Hub</button>
        </div>
      </div>
    );
  }

  return null;
};

export default InterviewText;
