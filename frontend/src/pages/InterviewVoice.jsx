/**
 * InterviewVoice.jsx
 * ------------------
 * Voice-based interview session page.
 *
 * DB Tables used:
 *   - questions    (question_id, question_text, category, difficulty, expected_answer)
 *   - answers      (answer_id, iq_id, answer_text, audio_path, submitted_at)
 *   - ai_feedback  (feedback_id, answer_id, score, feedback_text, confidence_level)
 *
 * API Endpoints (backend team to implement):
 *   GET  /interview/questions/voice?category=&difficulty=&limit=5
 *        → { questions: [ { question_id, question_text, category, difficulty } ] }
 *   POST /interview/submit/voice
 *        Body: FormData { interview_id?, question_id, answer_text, audio_file? }
 *        → { answer_id, score, feedback_text, confidence_level }
 *
 * Route: /interview/voice
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";

// Mock questions aligned to `questions` table schema
const MOCK_QUESTIONS = [
  { question_id: 1, question_text: "Explain the difference between SQL and NoSQL databases.", category: "DBMS", difficulty: "medium" },
  { question_id: 2, question_text: "What is normalization in relational databases?", category: "DBMS", difficulty: "easy" },
  { question_id: 3, question_text: "What is the difference between a process and a thread?", category: "Operating Systems", difficulty: "medium" },
  { question_id: 4, question_text: "Explain what REST API is and how it works.", category: "Web Development", difficulty: "easy" },
  { question_id: 5, question_text: "What is Big O notation and why is it important?", category: "Algorithms", difficulty: "medium" },
];

const RECORD_MAX_SECONDS = 120; // 2 minutes max recording

const InterviewVoice = () => {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────────
  const [phase, setPhase]             = useState("config");   // config | session | result
  const [config, setConfig]           = useState({ category: "", difficulty: "", limit: 3 });
  const [questions, setQuestions]     = useState([]);
  const [current, setCurrent]         = useState(0);
  const [answers, setAnswers]         = useState([]);         // { question_id, answer_text, audio_blob, feedback }
  const [recording, setRecording]     = useState(false);
  const [audioUrl, setAudioUrl]       = useState(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [loading, setLoading]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [usingMock, setUsingMock]     = useState(false);
  const [transcript, setTranscript]   = useState("");
  const [listening, setListening]     = useState(false);

  const mediaRef    = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const recognRef   = useRef(null);

  // ── Load questions ────────────────────────────────────────────────────────────
  const startSession = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (config.category)   params.append("category",   config.category);
      if (config.difficulty) params.append("difficulty", config.difficulty);
      params.append("limit", config.limit);

      const res = await apiClient.get(`/interview/questions/voice?${params}`);
      setQuestions(res.data.questions || res.data);
      setUsingMock(false);
    } catch {
      setQuestions(MOCK_QUESTIONS.slice(0, config.limit));
      setUsingMock(true);
    } finally {
      setLoading(false);
      setCurrent(0);
      setAnswers([]);
      setTranscript("");
      setAudioUrl(null);
      setPhase("session");
    }
  };

  // ── Speech recognition (live transcript) ─────────────────────────────────────
  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";
    recog.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
      setTranscript(t.trim());
    };
    recog.start();
    recognRef.current = recog;
    setListening(true);
  };

  const stopRecognition = () => {
    recognRef.current?.stop();
    setListening(false);
  };

  // ── Recording ─────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    setTranscript("");
    setAudioUrl(null);
    chunksRef.current = [];
    setRecordSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
      startRecognition();

      // Auto-stop timer
      timerRef.current = setInterval(() => {
        setRecordSeconds(s => {
          if (s + 1 >= RECORD_MAX_SECONDS) { stopRecording(); return RECORD_MAX_SECONDS; }
          return s + 1;
        });
      }, 1000);
    } catch {
      alert("Microphone access denied. Please allow microphone access in your browser.");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    stopRecognition();
    mediaRef.current?.stop();
    setRecording(false);
  };

  // ── Submit this question's answer ─────────────────────────────────────────────
  const submitAnswer = async () => {
    const q = questions[current];
    setSubmitting(true);

    const formData = new FormData();
    formData.append("question_id", q.question_id);
    formData.append("answer_text", transcript);
    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      formData.append("audio_file", blob, `answer_q${q.question_id}.webm`);
    }

    let feedback = null;
    try {
      const res = await apiClient.post("/interview/submit/voice", formData);
      feedback = res.data; // { answer_id, score, feedback_text, confidence_level }
    } catch {
      // Mock feedback when backend not ready
      feedback = {
        answer_id: null,
        score: transcript.length > 20 ? (Math.random() * 30 + 60).toFixed(1) : (Math.random() * 30 + 20).toFixed(1),
        feedback_text: transcript
          ? "Good attempt! Your answer touched on relevant concepts. Try to be more specific and structured."
          : "No answer recorded. Try to speak clearly into the microphone.",
        confidence_level: (Math.random() * 0.4 + 0.6).toFixed(2),
        mock: true,
      };
    }

    const newAnswer = {
      question_id: q.question_id,
      question_text: q.question_text,
      answer_text: transcript,
      audio_url: audioUrl,
      feedback,
    };

    setAnswers(prev => {
      const existing = prev.findIndex(a => a.question_id === q.question_id);
      if (existing >= 0) { const arr = [...prev]; arr[existing] = newAnswer; return arr; }
      return [...prev, newAnswer];
    });
    setSubmitting(false);

    // Move to next or show results
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setTranscript("");
      setAudioUrl(null);
      chunksRef.current = [];
      setRecordSeconds(0);
    } else {
      setPhase("result");
    }
  };

  // Cleanup on unmount
  useEffect(() => () => { clearInterval(timerRef.current); stopRecognition(); }, []);

  const q = questions[current];
  const answeredIds = new Set(answers.map(a => a.question_id));

  // ── Config Phase ──────────────────────────────────────────────────────────────
  if (phase === "config") {
    return (
      <div className="page iv-config-page">
        <button className="iv-back-btn" onClick={() => navigate("/interview")}>← Back to Interview Hub</button>
        <div className="iv-config-card">
          <div className="iv-config-card__icon">🎙️</div>
          <h1 className="iv-config-card__title">Voice Interview</h1>
          <p className="iv-config-card__sub">Open-ended questions. Record your spoken answers. AI will evaluate your response.</p>

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
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-input" value={config.difficulty} onChange={e => setConfig(c => ({ ...c, difficulty: e.target.value }))}>
                <option value="">Any</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Number of Questions</label>
              <select className="form-input" value={config.limit} onChange={e => setConfig(c => ({ ...c, limit: parseInt(e.target.value) }))}>
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={7}>7 Questions</option>
              </select>
            </div>
          </div>

          <div className="iv-config-info">
            <span>🎙 Microphone required</span>
            <span>⏱ Up to 2 min/answer</span>
            <span>🤖 AI-evaluated</span>
          </div>

          <div className="iv-voice-permission-note">
            <strong>⚠️ Browser will ask for microphone permission</strong> — please click Allow when prompted.
          </div>

          <button className="btn btn--primary btn--full btn--lg" onClick={startSession} disabled={loading}>
            {loading ? <span className="auth-spinner" /> : "Start Voice Interview →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Session Phase ─────────────────────────────────────────────────────────────
  if (phase === "session") {
    if (!q) return null;
    const progress = ((current + 1) / questions.length) * 100;
    const isAnswered = answeredIds.has(q.question_id);
    const recPct = (recordSeconds / RECORD_MAX_SECONDS) * 100;

    return (
      <div className="page iv-session-page iv-session-page--voice">
        {usingMock && <div className="iv-mock-banner">⚠ Backend not connected — showing sample questions.</div>}

        <div className="iv-progress-bar">
          <div className="iv-progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="iv-session-header">
          <span className="iv-q-counter">Question {current + 1} / {questions.length}</span>
          <div className="iv-q-dots">
            {questions.map((qu, i) => (
              <div key={i} className={`iv-q-dot${i === current ? " iv-q-dot--active" : ""}${answeredIds.has(qu.question_id) ? " iv-q-dot--answered" : ""}`} />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="iv-voice-question-card">
          <div className="iv-question-card__meta">
            {q.category   && <span className="iv-tag">{q.category}</span>}
            {q.difficulty && <span className={`iv-tag iv-tag--${q.difficulty}`}>{q.difficulty}</span>}
          </div>
          <p className="iv-voice-question-card__text">{q.question_text}</p>
        </div>

        {/* Recorder */}
        <div className="iv-recorder">
          <div className={`iv-recorder__viz${recording ? " iv-recorder__viz--active" : ""}`}>
            {recording ? (
              <>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="iv-recorder__bar" style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </>
            ) : (
              <span className="iv-recorder__mic">{audioUrl ? "🔊" : "🎙️"}</span>
            )}
          </div>

          {recording && (
            <div className="iv-recorder__timer-wrap">
              <div className="iv-recorder__timer-bar">
                <div className="iv-recorder__timer-fill" style={{ width: `${recPct}%` }} />
              </div>
              <span className="iv-recorder__time">{Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")} / 2:00</span>
            </div>
          )}

          <div className="iv-recorder__btns">
            {!recording && !audioUrl && (
              <button className="iv-record-btn iv-record-btn--start" onClick={startRecording}>
                🔴 Start Recording
              </button>
            )}
            {recording && (
              <button className="iv-record-btn iv-record-btn--stop" onClick={stopRecording}>
                ⏹ Stop Recording
              </button>
            )}
            {!recording && audioUrl && (
              <>
                <audio controls src={audioUrl} className="iv-audio-player" />
                <button className="iv-record-btn iv-record-btn--redo" onClick={startRecording}>
                  🔄 Re-record
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live transcript */}
        <div className="iv-transcript-box">
          <div className="iv-transcript-box__label">
            📝 Live Transcript {listening && <span className="iv-listening-dot" />}
          </div>
          <p className="iv-transcript-box__text">
            {transcript || <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>Your spoken words will appear here...</span>}
          </p>
        </div>

        {/* Text fallback */}
        <details className="iv-text-fallback">
          <summary>Type your answer instead (optional)</summary>
          <textarea
            className="form-input form-textarea"
            placeholder="Type your answer here if microphone is not available..."
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            rows={4}
            style={{ marginTop: "0.75rem" }}
          />
        </details>

        <button
          className="btn btn--primary btn--full btn--lg"
          onClick={submitAnswer}
          disabled={submitting || recording || (!transcript && !audioUrl)}
        >
          {submitting ? <span className="auth-spinner" /> : (current === questions.length - 1 ? "Submit & Finish ✓" : "Submit & Next →")}
        </button>
      </div>
    );
  }

  // ── Result Phase ──────────────────────────────────────────────────────────────
  if (phase === "result") {
    const scores = answers.map(a => parseFloat(a.feedback?.score || 0));
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const grade = avgScore >= 80 ? { label: "Excellent! 🎉", color: "#22c55e" }
                : avgScore >= 60 ? { label: "Good Job! 👍", color: "#4f46e5" }
                : avgScore >= 40 ? { label: "Keep Practicing 📚", color: "#f97316" }
                :                  { label: "Needs Improvement 💪", color: "#ef4444" };

    return (
      <div className="page iv-result-page">
        <div className="iv-result-header">
          <div className="iv-result-score-ring">
            <svg viewBox="0 0 120 120" width="140" height="140">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none"
                stroke={grade.color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${avgScore * 3.27} 327`}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="iv-result-score-ring__label">
              <span className="iv-result-score-ring__pct" style={{ color: grade.color }}>{avgScore}%</span>
              <span className="iv-result-score-ring__raw">avg score</span>
            </div>
          </div>
          <div>
            <h1 className="iv-result-grade" style={{ color: grade.color }}>{grade.label}</h1>
            <p className="iv-result-sub">Average score across {answers.length} question{answers.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Per-question feedback */}
        <div className="iv-review">
          <h2 className="section-title">AI Feedback</h2>
          <div className="iv-review-list">
            {answers.map((a, i) => (
              <div key={a.question_id} className="iv-voice-review-card">
                <div className="iv-voice-review-card__header">
                  <span className="iv-review-item__num">Q{i + 1}</span>
                  <span className="iv-voice-score" style={{ color: parseFloat(a.feedback?.score) >= 60 ? "#22c55e" : "#ef4444" }}>
                    Score: {parseFloat(a.feedback?.score || 0).toFixed(1)}
                  </span>
                  {a.feedback?.confidence_level && (
                    <span className="iv-voice-confidence">
                      Confidence: {Math.round(parseFloat(a.feedback.confidence_level) * 100)}%
                    </span>
                  )}
                </div>
                <p className="iv-review-item__q">{a.question_text}</p>
                {a.answer_text && (
                  <div className="iv-voice-review-card__answer">
                    <strong>Your Answer:</strong> <span>{a.answer_text}</span>
                  </div>
                )}
                {a.audio_url && <audio controls src={a.audio_url} className="iv-audio-player" style={{ marginTop: "0.5rem" }} />}
                {a.feedback?.feedback_text && (
                  <div className="iv-voice-review-card__feedback">
                    🤖 <strong>AI Feedback:</strong> {a.feedback.feedback_text}
                  </div>
                )}
                {a.feedback?.mock && <p className="iv-mock-note">⚠ Mock feedback (backend not connected)</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="iv-result-actions">
          <button className="btn btn--outline" onClick={() => { setPhase("config"); setAnswers([]); }}>Try Again</button>
          <button className="btn btn--primary" onClick={() => navigate("/interview")}>← Back to Hub</button>
        </div>
      </div>
    );
  }

  return null;
};

export default InterviewVoice;
