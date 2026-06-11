/**
 * InterviewVideo.jsx
 * ------------------
 * Redesigned Video Interview with MediaPipe Face Analysis.
 *
 * Phases:
 *   setup     → Role/skills selection + camera permission
 *   session   → Live interview with robot questions, MediaPipe HUD, recording
 *   processing → Upload metrics to backend + generate AI feedback
 *   result    → Full inline report with scores, feedback, transparency
 *
 * Tech stack:
 *   - MediaPipe FaceLandmarker (CDN) via useMediaPipeAnalysis hook
 *   - MediaRecorder API for video capture
 *   - Web Speech API for live transcription
 *   - Groq AI (via backend) for qualitative feedback
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import {
  uploadVideoAnalysis,
  generateVideoFeedback,
} from "../services/videoInterviewService";
import { useMediaPipeAnalysis } from "../hooks/useMediaPipeAnalysis";
import { useAuth } from "../context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const RECORD_MAX_SECONDS = 180;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const COMMON_ROLES = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Software Engineer", "Data Analyst", "Machine Learning Engineer", "UI/UX Designer",
];
const COMMON_SKILLS = ["React", "JavaScript", "Python", "FastAPI", "SQL", "DSA", "REST API", "Git"];

const FILLER_WORDS_LIST = ["um", "uh", "like", "basically", "actually"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeLocalQuestions = (profile, count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `local_${i + 1}`,
    question: [
      `Tell me about yourself and why you're interested in ${profile.desired_role}.`,
      `Describe a project where you used ${profile.current_skills || "your skills"}. What was your contribution?`,
      "Walk me through a difficult technical problem you solved and how you approached it.",
      `How do you stay current with developments in ${profile.desired_role}?`,
      `Why should we hire you for ${profile.desired_role}?`,
    ][i % 5],
    competency: i % 2 === 0 ? "Communication" : "Technical Depth",
  }));

const getScoreGrade = (score) => {
  if (score >= 85) return { label: "Excellent", color: "#10b981", bg: "rgba(16,185,129,0.12)" };
  if (score >= 70) return { label: "Good",      color: "#7c3aed", bg: "rgba(124,58,237,0.12)" };
  if (score >= 55) return { label: "Fair",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return              { label: "Needs Work",  color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
};

const getMetricLabel = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  return "Needs Work";
};

const countFillerWords = (text) => {
  const lower = text.toLowerCase();
  return FILLER_WORDS_LIST.reduce((acc, w) => {
    const matches = lower.match(new RegExp(`\\b${w}\\b`, "g"));
    return acc + (matches ? matches.length : 0);
  }, 0);
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const RobotAvatar = ({ speaking, listening }) => (
  <div className={`vid-robot${speaking ? " vid-robot--speaking" : ""}${listening ? " vid-robot--listening" : ""}`}>
    <div className="vid-robot__antenna" />
    <div className="vid-robot__head">
      <span className="vid-robot__eye" />
      <span className="vid-robot__eye" />
      <span className="vid-robot__mouth" />
    </div>
    <div className="vid-robot__body">AI</div>
  </div>
);

const ScoreRing = ({ score, size = 140, color }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="vid-score-ring">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <circle
        cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dashoffset 1.2s ease" }}
      />
      <text x="60" y="55" textAnchor="middle" fill={color} fontSize="22" fontWeight="700">{Math.round(score)}</text>
      <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">/100</text>
    </svg>
  );
};

const MetricBar = ({ label, score, icon }) => {
  const grade = getMetricLabel(score);
  const barColor = score >= 80 ? "#10b981" : score >= 65 ? "#7c3aed" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="vid-metric-bar">
      <div className="vid-metric-bar__header">
        <span className="vid-metric-bar__icon">{icon}</span>
        <span className="vid-metric-bar__label">{label}</span>
        <span className="vid-metric-bar__score" style={{ color: barColor }}>{Math.round(score)}%</span>
        <span className="vid-metric-bar__grade" style={{ color: barColor }}>{grade}</span>
      </div>
      <div className="vid-metric-bar__track">
        <div
          className="vid-metric-bar__fill"
          style={{ width: `${score}%`, background: barColor, transition: "width 1s ease" }}
        />
      </div>
    </div>
  );
};

const LiveMetricHUD = ({ metrics }) => (
  <div className="vid-hud">
    <div className={`vid-hud__badge ${metrics.faceDetected ? "vid-hud__badge--ok" : "vid-hud__badge--warn"}`}>
      {metrics.faceDetected ? "👁" : "⚠"} {metrics.faceDetected ? "Face OK" : "No Face"}
    </div>
    <div className={`vid-hud__badge ${metrics.eyeContact ? "vid-hud__badge--ok" : "vid-hud__badge--warn"}`}>
      🎯 {metrics.eyeContact ? "Eye ✓" : "Eye ✗"}
    </div>
    <div className="vid-hud__badge vid-hud__badge--info">
      📊 {Math.round(metrics.eye_contact_score ?? 0)}%
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const InterviewVideo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Refs
  const videoRef       = useRef(null);
  const streamRef      = useRef(null);
  const recorderRef    = useRef(null);
  const chunksRef      = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef       = useRef(null);
  const startTimeRef   = useRef(null);
  const finalTransRef  = useRef("");
  const recordingFlag  = useRef(false);
  const accTransRef    = useRef(""); // accumulated transcript for all answers

  // MediaPipe hook
  const {
    isReady: mpReady,
    loadError: mpError,
    liveMetrics,
    startAnalysis,
    stopAnalysis,
    getMetrics,
    resetMetrics,
  } = useMediaPipeAnalysis(videoRef);

  // State
  const [phase, setPhase] = useState("setup");
  const [profile, setProfile] = useState({
    desired_role: "", experience_level: "mid", current_skills: "", interview_focus: "",
  });
  const [questionCount, setQuestionCount] = useState(3);
  const [sessionId, setSessionId]     = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [current, setCurrent]         = useState(0);
  const [answers, setAnswers]         = useState({});  // questionId → transcript
  const [source, setSource]           = useState("ai");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [recording, setRecording]     = useState(false);
  const [listening, setListening]     = useState(false);
  const [speaking, setSpeaking]       = useState(false);
  const [recSeconds, setRecSeconds]   = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [mediaStatus, setMediaStatus] = useState({ audio: false, video: false });
  const [result, setResult]           = useState(null);
  const [processingStep, setProcessingStep] = useState("");
  const [sttSupported]                = useState(Boolean(SpeechRecognition));
  const [transcriptLang]              = useState("en-US");

  // Derived
  const q = questions[current];
  const answerText = answers[q?.id] || "";
  const progress = questions.length ? ((current + 1) / questions.length) * 100 : 0;
  const recPct = (recSeconds / RECORD_MAX_SECONDS) * 100;

  // ── Camera ────────────────────────────────────────────────────────────────
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    setMediaStatus({ audio: false, video: false });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      const audio = stream.getAudioTracks().some((t) => t.readyState === "live" && t.enabled);
      const video = stream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled);
      setMediaStatus({ audio, video });
      setCameraReady(video);
      if (!audio) setError("Camera on, but microphone not detected. Please allow mic permissions.");
      else setError("");
    } catch (err) {
      setMediaStatus({ audio: false, video: false });
      setError(`Camera/microphone permission denied (${err?.name}). Allow both from browser settings.`);
    }
  };

  // ── Speech Synthesis ──────────────────────────────────────────────────────
  const stopSpeaking = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

  const speakText = (text) => {
    if (!text || !window.speechSynthesis) return;
    stopSpeaking();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9; utt.pitch = 0.85; utt.volume = 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  // ── Speech Recognition ────────────────────────────────────────────────────
  const startRecognition = () => {
    if (!SpeechRecognition) return;
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = transcriptLang;
    finalTransRef.current = answerText || "";

    rec.onresult = (e) => {
      let interim = "";
      let final = finalTransRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += `${e.results[i][0].transcript} `;
        else interim += e.results[i][0].transcript;
      }
      finalTransRef.current = final;
      const merged = `${final} ${interim}`.replace(/\s+/g, " ").trim();
      if (q?.id) setAnswers((prev) => ({ ...prev, [q.id]: merged }));
    };
    rec.onend = () => {
      setListening(false);
      if (recordingFlag.current) setTimeout(() => { if (recordingFlag.current) startRecognition(); }, 350);
    };
    rec.onerror = () => setListening(false);
    try { rec.start(); recognitionRef.current = rec; setListening(true); } catch { setListening(false); }
  };

  const stopRecognition = () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    recognitionRef.current = null;
    setListening(false);
  };

  // ── Session Start ─────────────────────────────────────────────────────────
  const startSession = async () => {
    if (!profile.desired_role.trim()) { setError("Please select or type a role first."); return; }
    setLoading(true); setError(""); setResult(null);

    try {
      const skills = profile.current_skills.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await apiClient.post("/api/interviews", {
        candidate_profile: {
          desired_role: profile.desired_role,
          experience_level: profile.experience_level,
          current_skills: skills,
          target_skills: [],
          interview_focus: "Video interview with MediaPipe face analysis",
        },
        question_count: questionCount,
      });
      setSessionId(res.data.session_id);
      setQuestions(res.data.questions || []);
      setSource(res.data.source || "ai");
    } catch {
      setSessionId(null);
      setQuestions(makeLocalQuestions(profile, questionCount));
      setSource("fallback");
    } finally {
      setAnswers({});
      setCurrent(0);
      setRecSeconds(0);
      accTransRef.current = "";
      resetMetrics();
      setPhase("session");
      setLoading(false);
      setTimeout(startCamera, 400);
    }
  };

  // ── Recording ─────────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (!streamRef.current) await startCamera();
    if (!streamRef.current) return;
    if (!mediaStatus.audio && !streamRef.current.getAudioTracks().length) {
      setError("Microphone not detected. Please allow mic access and try Allow Camera again.");
      return;
    }

    chunksRef.current = [];
    finalTransRef.current = answerText || "";
    stopSpeaking();

    const mimeType = ["video/webm;codecs=vp8,opus","video/webm;codecs=vp9,opus","video/webm"]
      .find(MediaRecorder.isTypeSupported);

    try {
      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {};

      startTimeRef.current = Date.now();
      recordingFlag.current = true;
      recorder.start(1000);
      setRecording(true);

      startAnalysis(); // Start MediaPipe
      startRecognition();

      timerRef.current = setInterval(() => {
        setRecSeconds((s) => {
          if (s + 1 >= RECORD_MAX_SECONDS) { stopRecording(); return RECORD_MAX_SECONDS; }
          return s + 1;
        });
      }, 1000);
      setError("");
    } catch {
      setError("Your browser could not start video recording. Try Chrome or Edge.");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    recordingFlag.current = false;
    stopRecognition();
    stopAnalysis();
    try {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    } catch { /* ignore */ }
    setRecording(false);
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = () => {
    stopRecording();
    stopSpeaking();
    setRecSeconds(0);
    if (current < questions.length - 1) setCurrent((p) => p + 1);
  };

  const goPrev = () => {
    stopRecording();
    stopSpeaking();
    setRecSeconds(0);
    if (current > 0) setCurrent((p) => p - 1);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const submitInterview = async () => {
    stopRecording();
    stopSpeaking();

    // Build combined transcript
    const combinedTranscript = questions
      .map((qItem, i) => {
        const a = answers[qItem.id] || "";
        return a ? `Q${i + 1}: ${qItem.question}\nAnswer: ${a}` : "";
      })
      .filter(Boolean)
      .join("\n\n");

    // Calculate interview duration
    const durationSeconds = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : recSeconds;

    // Get final MediaPipe metrics
    const mediaPipeMetrics = getMetrics();

    setPhase("processing");
    setProcessingStep("Uploading analysis metrics...");

    const userId = user?.id;
    if (!userId) {
      setError("You must be logged in as a candidate to submit a video interview.");
      setPhase("session");
      return;
    }

    try {
      // Step 1: Upload metrics + transcript
      setProcessingStep("📊 Computing your scores...");
      const uploadResult = await uploadVideoAnalysis({
        session_id: sessionId,
        user_id: userId,
        eye_contact_score: mediaPipeMetrics.eye_contact_score,
        face_visibility_score: mediaPipeMetrics.face_visibility_score,
        head_stability_score: mediaPipeMetrics.head_stability_score,
        transcript: combinedTranscript,
        duration_seconds: durationSeconds,
      });

      // Step 2: Generate AI feedback
      setProcessingStep("🤖 Generating AI coaching feedback...");
      let feedbackResult = null;
      if (sessionId) {
        try {
          feedbackResult = await generateVideoFeedback(sessionId);
        } catch {
          // Feedback generation is optional
        }
      }

      // Build result object
      const scores = uploadResult.scores || {};
      const feedback = feedbackResult?.feedback || {};
      const fillerBreakdown = uploadResult.filler_breakdown || {};

      // Count filler words from transcript for display
      const fillerCount = scores.filler_words_count ?? countFillerWords(combinedTranscript);

      // Prefer AI-updated confidence/overall (blended with answer content quality)
      const finalConfidence    = feedback.updated_confidence_score ?? scores.confidence_score;
      const finalOverall       = feedback.overall_video_score       ?? scores.overall_video_score;
      const answerContentScore = feedback.answer_content_score      ?? 0;

      setResult({
        session_id: sessionId,
        scores: {
          ...scores,
          filler_words_count:   fillerCount,
          confidence_score:     finalConfidence,
          overall_video_score:  finalOverall,
          answer_content_score: answerContentScore,
        },
        feedback: {
          strengths: feedback.strengths || [],
          weaknesses: feedback.weaknesses || [],
          communication_feedback: feedback.communication_feedback || [],
          body_language_feedback: feedback.body_language_feedback || [],
          improvement_suggestions: feedback.improvement_suggestions || [],
          transparency_breakdown: feedback.transparency_breakdown || {},
          summary: feedback.summary || "",
          answer_evaluations: feedback.answer_evaluations || [],
        },
        filler_breakdown: fillerBreakdown,
        transcript: combinedTranscript,
        analysis_source: feedbackResult?.source || "mediapipe",
        desired_role: profile.desired_role,
      });

      stopCamera();
      setPhase("result");
    } catch (err) {
      // Fallback: compute scores locally
      const metrics = getMetrics();
      const fillerCount = countFillerWords(combinedTranscript);
      const wpm = durationSeconds > 0
        ? Math.round(combinedTranscript.split(/\s+/).filter(Boolean).length / (durationSeconds / 60))
        : 0;

      const fillerScore   = Math.max(0, 100 - fillerCount * 5);
      const speechClarity = Math.max(0, Math.min(100, 100 - fillerCount * 3));
      const eyeContact    = metrics.eye_contact_score;
      const headStability = metrics.head_stability_score;
      const faceVisibility= metrics.face_visibility_score;

      // Basic answer quality estimate (no AI available — max 80)
      const answeredQs = questions.filter((qItem) => (answers[qItem.id] || "").trim().length > 20);
      const answerContentScore = questions.length > 0
        ? Math.round((answeredQs.length / questions.length) * 80)
        : 0;

      const confidence = Math.round(
        eyeContact * 0.25 + headStability * 0.15 + faceVisibility * 0.10 +
        speechClarity * 0.15 + fillerScore * 0.10 + answerContentScore * 0.25
      );

      setResult({
        session_id: null,
        scores: {
          eye_contact_score: eyeContact,
          face_visibility_score: faceVisibility,
          head_stability_score: headStability,
          speech_clarity_score: speechClarity,
          communication_score: Math.round((speechClarity + fillerScore) / 2),
          filler_words_count: fillerCount,
          words_per_minute: wpm,
          confidence_score: confidence,
          overall_video_score: Math.round(confidence * 0.6 + speechClarity * 0.4),
          transparency_score: confidence,
          answer_content_score: answerContentScore,
        },
        feedback: {
          strengths: ["Camera-based interview completed successfully.", "You practiced speaking in interview format."],
          weaknesses: eyeContact < 60 ? ["Eye contact could be improved — look directly at the camera."] : [],
          communication_feedback: [`Estimated ${wpm} words per minute.`, `${fillerCount} filler words detected.`],
          body_language_feedback: [`Eye contact: ${eyeContact}%`, `Head stability: ${headStability}%`],
          improvement_suggestions: ["Practice maintaining eye contact with the camera.", "Use pauses instead of filler words."],
          transparency_breakdown: { eye_contact: eyeContact, communication: speechClarity, posture: headStability, confidence },
          summary: "Local analysis completed. The candidate completed the video recording session and responded to the target questions.",
          answer_evaluations: questions.map((qItem) => {
            const a = answers[qItem.id] || "";
            return {
              question: qItem.question,
              answer: a || "(No answer recorded)",
              score: a ? 75 : 0,
              feedback: a ? "Good response captured." : "No response provided.",
            };
          }),
        },
        filler_breakdown: {},
        transcript: combinedTranscript,
        analysis_source: "mediapipe",
        desired_role: profile.desired_role,
      });

      stopCamera();
      setPhase("result");
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "session" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase, current]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    stopRecognition();
    stopSpeaking();
    stopCamera();
    stopAnalysis();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: SETUP
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="page vid-page">
        <button className="iv-back-btn" onClick={() => navigate("/interview")}>← Back to Interview Hub</button>

        <div className="vid-setup-grid">
          {/* Left: Form */}
          <div className="vid-setup-card">
            <div className="vid-setup-title-row">
              <span className="vid-setup-icon">🎥</span>
              <div>
                <h1>Video Interview Analysis</h1>
                <p>Real-time face tracking + AI feedback on eye contact, posture, and communication.</p>
              </div>
            </div>

            {error && <div className="alert alert--error">{error}</div>}
            {!mpReady && !mpError && (
              <div className="vid-loading-badge">
                <span className="auth-spinner" /> Loading MediaPipe face tracker...
              </div>
            )}
            {mpError && (
              <div className="vid-fallback-notice">
                ⚠ Face tracking could not initialize ({mpError.slice(0, 80)}). Interview will proceed with transcript-only analysis.
              </div>
            )}

            {/* Role */}
            <div className="form-group">
              <label className="form-label">Target Role <span style={{ color: "var(--color-danger)" }}>*</span></label>
              <div className="ai-role-suggestions">
                {COMMON_ROLES.map((role) => (
                  <button
                    key={role} type="button"
                    className={`ai-role-chip${profile.desired_role === role ? " ai-role-chip--active" : ""}`}
                    onClick={() => setProfile((p) => ({ ...p, desired_role: role }))}
                  >{role}</button>
                ))}
              </div>
              <input className="form-input" style={{ marginTop: "0.6rem" }} value={profile.desired_role}
                onChange={(e) => setProfile((p) => ({ ...p, desired_role: e.target.value }))}
                placeholder="e.g. Frontend Developer" />
            </div>

            {/* Experience + Count */}
            <div className="ai-two-col">
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select className="form-input" value={profile.experience_level}
                  onChange={(e) => setProfile((p) => ({ ...p, experience_level: e.target.value }))}>
                  <option value="junior">Junior / Entry</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Questions</label>
                <select className="form-input" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={7}>7 Questions</option>
                </select>
              </div>
            </div>

            {/* Skills */}
            <div className="form-group">
              <label className="form-label">Skills <span className="ai-field-hint">comma separated</span></label>
              <input className="form-input" value={profile.current_skills}
                onChange={(e) => setProfile((p) => ({ ...p, current_skills: e.target.value }))}
                placeholder="React, JavaScript, Python" />
              <div className="ai-skill-suggestions">
                {COMMON_SKILLS.map((skill) => (
                  <button key={skill} type="button" className="ai-skill-suggestion"
                    onClick={() => setProfile((p) => ({
                      ...p, current_skills: p.current_skills ? `${p.current_skills}, ${skill}` : skill,
                    }))}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn--primary btn--full btn--lg" onClick={startSession} disabled={loading || !profile.desired_role.trim()}>
              {loading ? <><span className="auth-spinner" /> Generating Questions...</> : "Start Video Interview →"}
            </button>
          </div>

          {/* Right: Info */}
          <div className="vid-setup-side">
            <div className="vid-robot-card-wrap">
              <RobotAvatar />
              <div className="vid-robot-bubble">
                <div className="vid-robot-bubble__label">🤖 AI Interviewer</div>
                <p>I'll ask you questions while tracking your eye contact, face visibility, and head stability in real-time using MediaPipe.</p>
              </div>
            </div>

            <div className="vid-feature-grid">
              <div className="vid-feature-item">
                <span className="vid-feature-item__icon">👁</span>
                <div>
                  <strong>Eye Contact Tracking</strong>
                  <p>Measures gaze direction toward camera</p>
                </div>
              </div>
              <div className="vid-feature-item">
                <span className="vid-feature-item__icon">😊</span>
                <div>
                  <strong>Face Visibility</strong>
                  <p>Detects face presence throughout interview</p>
                </div>
              </div>
              <div className="vid-feature-item">
                <span className="vid-feature-item__icon">📊</span>
                <div>
                  <strong>Head Stability</strong>
                  <p>Tracks nose landmark movement variance</p>
                </div>
              </div>
              <div className="vid-feature-item">
                <span className="vid-feature-item__icon">🎤</span>
                <div>
                  <strong>Speech Analysis</strong>
                  <p>Counts filler words, measures WPM</p>
                </div>
              </div>
              <div className="vid-feature-item">
                <span className="vid-feature-item__icon">🤖</span>
                <div>
                  <strong>AI Feedback</strong>
                  <p>Groq generates coaching recommendations</p>
                </div>
              </div>
              <div className="vid-feature-item">
                <span className="vid-feature-item__icon">🔒</span>
                <div>
                  <strong>Private</strong>
                  <p>Video stays in your browser. Only metrics are sent.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: PROCESSING
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "processing") {
    return (
      <div className="page vid-processing-page">
        <div className="vid-processing-card">
          <div className="vid-processing-spinner">
            <svg viewBox="0 0 60 60" width="80" height="80">
              <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(124,58,237,0.2)" strokeWidth="6" />
              <circle cx="30" cy="30" r="24" fill="none" stroke="#7c3aed" strokeWidth="6"
                strokeLinecap="round" strokeDasharray="40 110"
                style={{ transformOrigin: "center", animation: "vid-spin 1.2s linear infinite" }} />
            </svg>
          </div>
          <h2>Analyzing Your Interview</h2>
          <p className="vid-processing-step">{processingStep}</p>
          <div className="vid-processing-steps">
            <div className="vid-processing-step-item vid-processing-step-item--done">✅ MediaPipe face analysis collected</div>
            <div className={`vid-processing-step-item ${processingStep.includes("Computing") ? "vid-processing-step-item--active" : "vid-processing-step-item--pending"}`}>
              📊 Computing confidence scores
            </div>
            <div className={`vid-processing-step-item ${processingStep.includes("AI") ? "vid-processing-step-item--active" : "vid-processing-step-item--pending"}`}>
              🤖 Generating AI coaching feedback
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: SESSION
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "session") {
    const currentQ = questions[current];
    const currentQText = currentQ?.question || "";

    return (
      <div className="page vid-session-page">
        {source === "fallback" && (
          <div className="iv-mock-banner">⚠ AI backend unavailable — using fallback questions.</div>
        )}
        {!sttSupported && (
          <div className="iv-mock-banner">⚠ Live transcript not supported. Type your answer manually.</div>
        )}
        {error && <div className="alert alert--error">{error}</div>}

        {/* Progress */}
        <div className="iv-progress-bar">
          <div className="iv-progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Header */}
        <div className="vid-session-header">
          <div>
            <span className="iv-q-counter">Question {current + 1} / {questions.length}</span>
            <h2>{profile.desired_role} Video Interview</h2>
          </div>
          <button className="btn btn--outline btn--sm" onClick={() => speakText(currentQText)} disabled={speaking}>
            {speaking ? "🔊 Speaking..." : "🔊 Read Question"}
          </button>
        </div>

        <div className="vid-session-layout">
          {/* Left: Camera + Robot */}
          <div className="vid-session-left">
            {/* Robot + Question */}
            <div className="vid-robot-question-card">
              <div className="vid-robot-question-card__robot">
                <RobotAvatar speaking={speaking} listening={listening || recording} />
              </div>
              <div className="vid-robot-question-card__text">
                <div className="vid-robot-question-card__label">🤖 Question {current + 1}</div>
                <p>{currentQText}</p>
              </div>
            </div>

            {/* Camera */}
            <div className="vid-camera-card">
              <div className="vid-camera-frame">
                <video ref={videoRef} autoPlay muted playsInline className="vid-camera" />
                {!cameraReady && (
                  <div className="vid-camera-placeholder">
                    <span>📷</span>
                    <p>Click "Allow Camera" to begin</p>
                  </div>
                )}
                {recording && (
                  <div className="vid-rec-pill">
                    <span className="vid-rec-dot" /> REC {Math.floor(recSeconds / 60)}:{String(recSeconds % 60).padStart(2, "0")}
                  </div>
                )}
                {/* MediaPipe HUD */}
                {(recording || cameraReady) && <LiveMetricHUD metrics={liveMetrics} />}
              </div>

              {recording && (
                <div className="iv-recorder__timer-wrap">
                  <div className="iv-recorder__timer-bar">
                    <div className="iv-recorder__timer-fill" style={{ width: `${recPct}%` }} />
                  </div>
                  <span className="iv-recorder__time">Max {Math.floor(RECORD_MAX_SECONDS / 60)}:00</span>
                </div>
              )}

              {/* Camera Controls */}
              <div className="vid-controls">
                {!cameraReady && (
                  <button className="btn btn--outline" onClick={startCamera}>📷 Allow Camera + Mic</button>
                )}
                {cameraReady && !recording && (
                  <button className="vid-rec-btn vid-rec-btn--start" onClick={startRecording}>
                    🔴 Start Recording
                  </button>
                )}
                {recording && (
                  <button className="vid-rec-btn vid-rec-btn--stop" onClick={stopRecording}>
                    ⏹ Stop Recording
                  </button>
                )}
              </div>

              {/* Status badges */}
              <div className="vid-status-badges">
                <span className={`vid-status-badge ${mediaStatus.video ? "ok" : "warn"}`}>
                  {mediaStatus.video ? "✅ Camera" : "⚠ No Camera"}
                </span>
                <span className={`vid-status-badge ${mediaStatus.audio ? "ok" : "warn"}`}>
                  {mediaStatus.audio ? "✅ Mic" : "⚠ No Mic"}
                </span>
                <span className={`vid-status-badge ${mpReady ? "ok" : "warn"}`}>
                  {mpReady ? "✅ MediaPipe" : "⏳ Loading..."}
                </span>
                {sttSupported && (
                  <span className={`vid-status-badge ${listening ? "ok" : "info"}`}>
                    {listening ? "🎤 Listening..." : "🎤 STT Ready"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Transcript + Live Analytics */}
          <div className="vid-session-right">
            {/* Live Metrics */}
            {recording && (
              <div className="vid-live-analytics">
                <div className="vid-live-analytics__title">📊 Live Analysis</div>
                <div className="vid-live-stat-grid">
                  <div className="vid-live-stat">
                    <div className="vid-live-stat__val" style={{ color: liveMetrics.eye_contact_score >= 60 ? "#10b981" : "#f59e0b" }}>
                      {Math.round(liveMetrics.eye_contact_score ?? 0)}%
                    </div>
                    <div className="vid-live-stat__label">Eye Contact</div>
                  </div>
                  <div className="vid-live-stat">
                    <div className="vid-live-stat__val" style={{ color: liveMetrics.face_visibility_score >= 70 ? "#10b981" : "#f59e0b" }}>
                      {Math.round(liveMetrics.face_visibility_score ?? 0)}%
                    </div>
                    <div className="vid-live-stat__label">Face Visible</div>
                  </div>
                  <div className="vid-live-stat">
                    <div className="vid-live-stat__val" style={{ color: liveMetrics.head_stability_score >= 60 ? "#10b981" : "#f59e0b" }}>
                      {Math.round(liveMetrics.head_stability_score ?? 100)}%
                    </div>
                    <div className="vid-live-stat__label">Stability</div>
                  </div>
                  <div className="vid-live-stat">
                    <div className="vid-live-stat__val" style={{ color: liveMetrics.faceDetected ? "#10b981" : "#ef4444" }}>
                      {liveMetrics.faceDetected ? "✓" : "✗"}
                    </div>
                    <div className="vid-live-stat__label">Face Detected</div>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript */}
            <div className="vid-transcript-card">
              <div className="vid-transcript-label">
                📝 Live Transcript
                {listening && <span className="iv-listening-dot" />}
              </div>
              <textarea
                className="form-input form-textarea vid-transcript-area"
                value={answerText}
                onChange={(e) => {
                  if (q?.id) setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }));
                }}
                placeholder={
                  recording
                    ? "Speaking... transcript will appear here. You can also type or edit."
                    : "Start recording to capture your answer, or type here."
                }
              />
              <div className="vid-transcript-meta">
                <span>{answerText.split(/\s+/).filter(Boolean).length} words</span>
                {countFillerWords(answerText) > 0 && (
                  <span style={{ color: "#f59e0b" }}>
                    ⚠ {countFillerWords(answerText)} filler words detected
                  </span>
                )}
              </div>
            </div>

            {/* Question list */}
            <div className="vid-q-list">
              {questions.map((qItem, i) => (
                <div key={qItem.id} className={`vid-q-pill ${i === current ? "vid-q-pill--active" : ""} ${answers[qItem.id] ? "vid-q-pill--answered" : ""}`}>
                  Q{i + 1} {answers[qItem.id] ? "✓" : ""}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="video-nav-actions">
          <button className="btn btn--outline" onClick={goPrev} disabled={current === 0 || recording}>
            ← Previous
          </button>
          {current < questions.length - 1 ? (
            <button className="btn btn--primary" onClick={goNext} disabled={recording}>
              Next Question →
            </button>
          ) : (
            <button
              className="btn btn--primary"
              onClick={submitInterview}
              disabled={recording || loading}
            >
              {loading ? <span className="auth-spinner" /> : "Submit & Analyze ✓"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: RESULT
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const s = result.scores;
    const f = result.feedback;
    const confidenceGrade = getScoreGrade(s.confidence_score);
    const overallGrade    = getScoreGrade(s.overall_video_score);
    const tb = f.transparency_breakdown || {};
    const hasAnswerContent = (s.answer_content_score ?? 0) > 0;

    return (
      <div className="page vid-result-page">
        {/* ── Hero: Overall Score ── */}
        <div className="vid-result-hero">
          <div className="vid-result-hero__left">
            <ScoreRing score={s.overall_video_score} color={overallGrade.color} />
            <div className="vid-result-hero__grade">
              <h1 style={{ color: overallGrade.color }}>{overallGrade.label}!</h1>
              <p>Overall Interview Score</p>
              {result.analysis_source === "hybrid" && (
                <span className="vid-source-badge vid-source-badge--ai">✅ Groq AI Feedback</span>
              )}
              {result.analysis_source === "mediapipe" && (
                <span className="vid-source-badge vid-source-badge--mp">📊 MediaPipe Analysis</span>
              )}
            </div>
          </div>
          <div className="vid-result-hero__right">
            <h2>{result.desired_role} Interview Report</h2>

            {/* Confidence Score Card */}
            <div className="vid-confidence-card">
              <div className="vid-confidence-card__header">
                <span className="vid-confidence-card__icon">💪</span>
                <div>
                  <div className="vid-confidence-card__title">Confidence Score</div>
                  <div className="vid-confidence-card__val" style={{ color: confidenceGrade.color }}>
                    {Math.round(s.confidence_score)}/100
                  </div>
                </div>
              </div>
              <div className="vid-confidence-card__why">
                <div className="vid-confidence-card__why-title">
                  Score Breakdown
                  {hasAnswerContent && (
                    <span className="vid-confidence-card__formula-note">incl. answer quality</span>
                  )}
                </div>
                <div className={`vid-confidence-item ${s.eye_contact_score >= 70 ? "ok" : "warn"}`}>
                  <span>{s.eye_contact_score >= 70 ? "✓" : "✗"} Eye Contact: {Math.round(s.eye_contact_score)}%</span>
                  <span className="vid-confidence-weight">{hasAnswerContent ? "25%" : "30%"}</span>
                </div>
                <div className={`vid-confidence-item ${s.head_stability_score >= 65 ? "ok" : "warn"}`}>
                  <span>{s.head_stability_score >= 65 ? "✓" : "✗"} Head Stability: {Math.round(s.head_stability_score)}%</span>
                  <span className="vid-confidence-weight">{hasAnswerContent ? "15%" : "20%"}</span>
                </div>
                <div className={`vid-confidence-item ${s.face_visibility_score >= 75 ? "ok" : "warn"}`}>
                  <span>{s.face_visibility_score >= 75 ? "✓" : "✗"} Face Visibility: {Math.round(s.face_visibility_score)}%</span>
                  <span className="vid-confidence-weight">{hasAnswerContent ? "10%" : "15%"}</span>
                </div>
                <div className={`vid-confidence-item ${s.speech_clarity_score >= 65 ? "ok" : "warn"}`}>
                  <span>{s.speech_clarity_score >= 65 ? "✓" : "✗"} Speech Clarity: {Math.round(s.speech_clarity_score)}%</span>
                  <span className="vid-confidence-weight">{hasAnswerContent ? "15%" : "20%"}</span>
                </div>
                <div className={`vid-confidence-item ${s.filler_words_count <= 5 ? "ok" : "warn"}`}>
                  <span>{s.filler_words_count <= 5 ? "✓" : "✗"} {s.filler_words_count} filler word{s.filler_words_count !== 1 ? "s" : ""}</span>
                  <span className="vid-confidence-weight">{hasAnswerContent ? "10%" : "15%"}</span>
                </div>
                {hasAnswerContent && (
                  <div className={`vid-confidence-item vid-confidence-item--answer ${s.answer_content_score >= 65 ? "ok" : "warn"}`}>
                    <span>🧠 {s.answer_content_score >= 65 ? "✓" : "✗"} Answer Quality: {Math.round(s.answer_content_score)}%</span>
                    <span className="vid-confidence-weight vid-confidence-weight--highlight">25%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary Section ── */}
        {f.summary && (
          <div className="vid-section vid-summary-section">
            <h2 className="section-title">📝 Performance & Answer Content Summary</h2>
            <div className="vid-summary-bubble">
              <p>{f.summary}</p>
            </div>
          </div>
        )}

        {/* ── Metric Bars ── */}
        <div className="vid-section">
          <h2 className="section-title">👁 Eye Contact & Body Language</h2>
          <div className="vid-metric-bars">
            <MetricBar label="Eye Contact"     score={s.eye_contact_score}    icon="👁" />
            <MetricBar label="Face Visibility" score={s.face_visibility_score} icon="😊" />
            <MetricBar label="Head Stability"  score={s.head_stability_score}  icon="📐" />
          </div>
        </div>

        {/* ── Communication Analysis ── */}
        <div className="vid-section">
          <h2 className="section-title">🎤 Communication Analysis</h2>
          <div className="vid-comm-grid">
            <div className="vid-comm-card">
              <div className="vid-comm-card__icon">🗣</div>
              <div className="vid-comm-card__val" style={{ color: getScoreGrade(s.speech_clarity_score).color }}>
                {Math.round(s.speech_clarity_score)}
              </div>
              <div className="vid-comm-card__label">Speech Clarity</div>
            </div>
            <div className="vid-comm-card">
              <div className="vid-comm-card__icon">💬</div>
              <div className="vid-comm-card__val" style={{ color: getScoreGrade(s.communication_score).color }}>
                {Math.round(s.communication_score)}
              </div>
              <div className="vid-comm-card__label">Communication</div>
            </div>
            <div className="vid-comm-card">
              <div className="vid-comm-card__icon">⚡</div>
              <div className="vid-comm-card__val" style={{ color: s.words_per_minute >= 110 && s.words_per_minute <= 160 ? "#10b981" : "#f59e0b" }}>
                {s.words_per_minute}
              </div>
              <div className="vid-comm-card__label">Words / Min</div>
            </div>
            <div className="vid-comm-card">
              <div className="vid-comm-card__icon">🔁</div>
              <div className="vid-comm-card__val" style={{ color: s.filler_words_count <= 5 ? "#10b981" : s.filler_words_count <= 10 ? "#f59e0b" : "#ef4444" }}>
                {s.filler_words_count}
              </div>
              <div className="vid-comm-card__label">Filler Words</div>
            </div>
          </div>

          {/* WPM indicator */}
          <div className="vid-wpm-indicator">
            <div className="vid-wpm-indicator__label">Speaking Pace</div>
            <div className="vid-wpm-indicator__track">
              <div className="vid-wpm-indicator__zone vid-wpm-indicator__zone--slow">Slow &lt;80</div>
              <div className="vid-wpm-indicator__zone vid-wpm-indicator__zone--ideal">Ideal 110-160</div>
              <div className="vid-wpm-indicator__zone vid-wpm-indicator__zone--fast">Fast &gt;180</div>
            </div>
            <div
              className="vid-wpm-indicator__needle"
              style={{ left: `${Math.min(95, Math.max(5, (s.words_per_minute / 220) * 100))}%` }}
            >▲</div>
            <div className="vid-wpm-indicator__val">{s.words_per_minute} WPM</div>
          </div>

          {/* Communication feedback */}
          {f.communication_feedback?.length > 0 && (
            <div className="vid-feedback-list vid-feedback-list--info">
              {f.communication_feedback.map((item, i) => (
                <div key={i} className="vid-feedback-item">💬 {item}</div>
              ))}
            </div>
          )}
        </div>

        {/* ── Body Language Feedback ── */}
        {f.body_language_feedback?.length > 0 && (
          <div className="vid-section">
            <h2 className="section-title">🏃 Body Language Feedback</h2>
            <div className="vid-feedback-list vid-feedback-list--body">
              {f.body_language_feedback.map((item, i) => (
                <div key={i} className="vid-feedback-item">📐 {item}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Strengths & Weaknesses ── */}
        <div className="vid-section">
          <h2 className="section-title">🏆 Strengths & Areas to Improve</h2>
          <div className="ai-sg-grid">
            {f.strengths?.length > 0 && (
              <div className="ai-sg-card ai-sg-card--strength">
                <h3 className="ai-sg-card__title">✅ Strengths</h3>
                <ul className="ai-sg-list">
                  {f.strengths.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {f.weaknesses?.length > 0 && (
              <div className="ai-sg-card ai-sg-card--gap">
                <h3 className="ai-sg-card__title">⚠️ Areas to Improve</h3>
                <ul className="ai-sg-list">
                  {f.weaknesses.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── Improvement Suggestions ── */}
        {f.improvement_suggestions?.length > 0 && (
          <div className="vid-section">
            <h2 className="section-title">🚀 Improvement Suggestions</h2>
            <ol className="ai-next-steps">
              {f.improvement_suggestions.map((step, i) => (
                <li key={i} className="ai-next-step">
                  <span className="ai-next-step__num">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── Transparency Score Breakdown ── */}
        <div className="vid-section">
          <h2 className="section-title">🔍 Transparency Score Breakdown</h2>
          <p className="vid-section__sub">How each dimension contributed to your overall performance</p>
          <div className="vid-transparency-grid">
            {[
              { key: "eye_contact",    label: "Eye Contact",    icon: "👁",  val: tb.eye_contact    ?? s.eye_contact_score },
              { key: "communication",  label: "Communication",  icon: "🎤",  val: tb.communication  ?? s.communication_score },
              { key: "posture",        label: "Head Stability", icon: "📐",  val: tb.posture        ?? s.head_stability_score },
              { key: "confidence",     label: "Confidence",     icon: "💪",  val: tb.confidence     ?? s.confidence_score },
            ].map(({ key, label, icon, val }) => {
              const g = getScoreGrade(val);
              return (
                <div key={key} className="vid-transparency-card">
                  <div className="vid-transparency-card__icon">{icon}</div>
                  <div className="vid-transparency-card__label">{label}</div>
                  <div className="vid-transparency-card__score" style={{ color: g.color }}>
                    {Math.round(val ?? 0)}
                  </div>
                  <div className="vid-transparency-card__grade" style={{ color: g.color }}>{g.label}</div>
                  <div className="vid-transparency-card__bar-track">
                    <div className="vid-transparency-card__bar-fill"
                      style={{ width: `${Math.min(100, val ?? 0)}%`, background: g.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Answer Content Evaluation ── */}
        {f.answer_evaluations && f.answer_evaluations.length > 0 && (
          <div className="vid-section">
            <h2 className="section-title">💡 Answer Content Evaluation</h2>
            <div className="vid-eval-list">
              {f.answer_evaluations.map((item, idx) => {
                const evalGrade = getScoreGrade(item.score);
                return (
                  <div key={idx} className="vid-eval-item">
                    <div className="vid-eval-item__header">
                      <span className="vid-eval-item__q-num">Question {idx + 1}</span>
                      <span className="vid-eval-item__score" style={{ color: evalGrade.color, background: evalGrade.bg }}>
                        Score: {item.score}/100 ({evalGrade.label})
                      </span>
                    </div>
                    <div className="vid-eval-item__question">
                      <strong>Q:</strong> {item.question}
                    </div>
                    <div className="vid-eval-item__answer">
                      <strong>Your Answer:</strong>
                      <p>{item.answer || "(No transcript captured)"}</p>
                    </div>
                    {item.feedback && (
                      <div className="vid-eval-item__feedback">
                        <strong>AI Coaching Feedback:</strong>
                        <p>{item.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Transcript Review ── */}
        {result.transcript && (
          <div className="vid-section">
            <h2 className="section-title">📝 Transcript Review</h2>
            <div className="vid-transcript-review">
              <pre className="vid-transcript-pre">{result.transcript}</pre>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="iv-result-actions">
          <button className="btn btn--outline" onClick={() => { setPhase("setup"); setResult(null); resetMetrics(); }}>
            🔄 Try Again
          </button>
          <button className="btn btn--primary" onClick={() => navigate("/interview")}>
            ← Back to Interview Hub
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default InterviewVideo;
