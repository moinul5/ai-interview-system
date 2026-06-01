/**
 * InterviewVideo.jsx
 * ------------------
 * Phase 2: Robot video viva interview.
 *
 * Features:
 *   - Robot avatar asks AI-generated questions using browser SpeechSynthesis
 *   - User answers on camera using getUserMedia + MediaRecorder
 *   - Browser SpeechRecognition converts voice to live transcript when supported
 *   - Existing Groq-backed /api/interviews endpoint evaluates transcript answers
 *
 * Notes:
 *   - Video blobs are kept locally in the browser for preview/download.
 *   - Evaluation is based on transcript text. Chrome/Edge works best for STT.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const AI_BASE_URL = import.meta.env.VITE_AI_API_URL || import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const RECORD_MAX_SECONDS = 150;

const COMMON_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Data Analyst",
  "Machine Learning Engineer",
  "UI/UX Designer",
];

const COMMON_SKILLS = ["React", "JavaScript", "Python", "FastAPI", "SQL", "DSA", "REST API", "Git"];

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const makeFallbackQuestions = (profile, count) => {
  const role = profile.desired_role || "this role";
  const skills = profile.current_skills || "your skills";
  return Array.from({ length: count }, (_, i) => ({
    id: `fallback_video_${i + 1}`,
    question: [
      `Tell me about yourself and why you are interested in ${role}.`,
      `Explain one project where you used ${skills}. What was your contribution?`,
      `What is a technical challenge you faced and how did you solve it?`,
      `How do you keep yourself updated for ${role}?`,
      `Why should we hire you for ${role}?`,
    ][i % 5],
    competency: i % 2 === 0 ? "Communication" : "Technical Depth",
    difficulty: profile.experience_level || "mid",
    expected_signals: ["Clear structure", "Relevant example", "Specific impact"],
  }));
};

const RobotAvatar = ({ speaking, listening, question }) => (
  <div className="video-robot-card">
    <div className={`video-robot${speaking ? " video-robot--speaking" : ""}${listening ? " video-robot--listening" : ""}`}>
      <div className="video-robot__antenna" />
      <div className="video-robot__head">
        <span className="video-robot__eye" />
        <span className="video-robot__eye" />
        <span className="video-robot__mouth" />
      </div>
      <div className="video-robot__body">AI</div>
    </div>
    <div className="video-robot-bubble">
      <div className="video-robot-bubble__label">🤖 Interview Bot</div>
      <p>{question || "I will ask you viva-style questions. Answer clearly while looking at the camera."}</p>
    </div>
  </div>
);

const InterviewVideo = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const recordingFlagRef = useRef(false);

  const [phase, setPhase] = useState("setup");
  const [profile, setProfile] = useState({
    desired_role: "",
    experience_level: "mid",
    current_skills: "",
    interview_focus: "Video viva interview",
  });
  const [questionCount, setQuestionCount] = useState(3);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [videoAnswers, setVideoAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [sttSupported] = useState(Boolean(SpeechRecognition));
  const [mediaStatus, setMediaStatus] = useState({ audio: false, video: false });
  const [transcriptLang, setTranscriptLang] = useState("en-US");

  const q = questions[current];
  const currentQuestionText = q?.question || q?.question_text || "";
  const answerText = answers[q?.id] || "";
  const progress = questions.length ? ((current + 1) / questions.length) * 100 : 0;
  const recPct = (recordSeconds / RECORD_MAX_SECONDS) * 100;

  const roleSuggestions = useMemo(() => COMMON_ROLES.filter(Boolean), []);

  const updateProfile = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    setMediaStatus({ audio: false, video: false });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      const audio = stream.getAudioTracks().some((track) => track.readyState === "live" && track.enabled);
      const video = stream.getVideoTracks().some((track) => track.readyState === "live" && track.enabled);
      setMediaStatus({ audio, video });
      setCameraReady(video);
      setError(audio ? "" : "Camera is on, but microphone audio was not detected. Allow microphone permission before recording.");
    } catch (err) {
      setMediaStatus({ audio: false, video: false });
      setError(`Camera or microphone permission denied (${err?.name || "permission error"}). Please allow both permissions from your browser site settings.`);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const speakQuestion = (text = currentQuestionText) => {
    if (!text || !window.speechSynthesis) return;
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 0.85;
    utterance.volume = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startRecognition = () => {
    if (!SpeechRecognition) {
      setError("Live transcript is not supported in this browser. Use Chrome/Edge or type the transcript manually.");
      return;
    }

    try { recognitionRef.current?.stop(); } catch { /* ignore */ }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = transcriptLang;
    finalTranscriptRef.current = answerText || "";

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = finalTranscriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += `${text} `;
        else interim += text;
      }
      finalTranscriptRef.current = finalText;
      const merged = `${finalText} ${interim}`.replace(/\s+/g, " ").trim();
      if (q?.id) setAnswers((prev) => ({ ...prev, [q.id]: merged }));
    };

    recognition.onend = () => {
      setListening(false);
      // Chrome often stops speech recognition after a short silence. Restart while recording.
      if (recordingFlagRef.current) {
        setTimeout(() => {
          if (recordingFlagRef.current) startRecognition();
        }, 350);
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        setError("Microphone permission is blocked for live transcript. Allow microphone permission from browser site settings.");
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const stopRecognition = () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    recognitionRef.current = null;
    setListening(false);
  };

  const startSession = async () => {
    if (!profile.desired_role.trim()) {
      setError("Please choose or type a role first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const skills = profile.current_skills.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`${AI_BASE_URL}/api/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_profile: {
            desired_role: profile.desired_role,
            experience_level: profile.experience_level,
            current_skills: skills,
            target_skills: [],
            industry: "",
            interview_focus: profile.interview_focus || "Video viva interview with communication and technical depth",
          },
          question_count: questionCount,
        }),
      });

      if (!res.ok) throw new Error("AI backend failed");
      const data = await res.json();
      setSessionId(data.session_id);
      setQuestions(data.questions || []);
      setSource(data.source || "ai");
    } catch {
      setSessionId(null);
      setQuestions(makeFallbackQuestions(profile, questionCount));
      setSource("fallback");
    } finally {
      setAnswers({});
      setVideoAnswers({});
      setCurrent(0);
      setPreviewUrl("");
      setRecordSeconds(0);
      setPhase("session");
      setLoading(false);
      setTimeout(() => startCamera(), 300);
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) await startCamera();
    if (!streamRef.current) return;

    const hasAudio = streamRef.current.getAudioTracks().some((track) => track.readyState === "live" && track.enabled);
    const hasVideo = streamRef.current.getVideoTracks().some((track) => track.readyState === "live" && track.enabled);
    setMediaStatus({ audio: hasAudio, video: hasVideo });
    if (!hasAudio) {
      setError("Microphone track is missing, so preview will have no audio and transcript may not work. Allow microphone permission and click Allow Camera again.");
      return;
    }

    setPreviewUrl("");
    setRecordSeconds(0);
    chunksRef.current = [];
    finalTranscriptRef.current = answerText || "";
    stopSpeaking();

    try {
      const mimeType = [
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9,opus",
        "video/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blobType = recorder.mimeType || mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        if (q?.id) setVideoAnswers((prev) => ({ ...prev, [q.id]: { blob, url } }));
      };
      recordingFlagRef.current = true;
      recorder.start(1000);
      setRecording(true);
      startRecognition();

      timerRef.current = setInterval(() => {
        setRecordSeconds((seconds) => {
          if (seconds + 1 >= RECORD_MAX_SECONDS) {
            stopRecording();
            return RECORD_MAX_SECONDS;
          }
          return seconds + 1;
        });
      }, 1000);
    } catch {
      setError("Your browser could not start video recording. Try Chrome or Edge.");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    recordingFlagRef.current = false;
    stopRecognition();
    try {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    } catch { /* ignore */ }
    setRecording(false);
  };

  const goNext = () => {
    stopRecording();
    stopSpeaking();
    setPreviewUrl(videoAnswers[questions[current + 1]?.id]?.url || "");
    setRecordSeconds(0);
    if (current < questions.length - 1) setCurrent((prev) => prev + 1);
  };

  const goPrev = () => {
    stopRecording();
    stopSpeaking();
    setPreviewUrl(videoAnswers[questions[current - 1]?.id]?.url || "");
    setRecordSeconds(0);
    if (current > 0) setCurrent((prev) => prev - 1);
  };

  const submitInterview = async () => {
    stopRecording();
    stopSpeaking();
    setLoading(true);
    setError("");

    const answersPayload = questions.map((question) => ({
      question_id: question.id,
      answer: answers[question.id] || "",
    }));

    try {
      if (!sessionId) throw new Error("Fallback session cannot be saved to AI backend");
      const res = await fetch(`${AI_BASE_URL}/api/interviews/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersPayload }),
      });
      if (!res.ok) throw new Error("Evaluation failed");
      const data = await res.json();
      setResult(data);
    } catch {
      const answered = answersPayload.filter((item) => item.answer.trim()).length;
      const score = Math.min(90, Math.max(35, Math.round((answered / Math.max(1, questions.length)) * 70 + 20)));
      setResult({
        overall_score: score,
        summary: "Fallback evaluation: video viva completed locally. Connect Groq backend for detailed AI feedback.",
        strengths: ["Completed camera-based answers", "Practiced speaking in interview format"],
        weaknesses: ["Detailed AI scoring unavailable in fallback mode"],
        recommendations: ["Keep answers structured: Situation, Action, Result", "Use examples and measurable impact"],
      });
    } finally {
      stopCamera();
      setLoading(false);
      setPhase("result");
    }
  };

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
  }, []);

  if (phase === "setup") {
    return (
      <div className="page video-page">
        <button className="iv-back-btn" onClick={() => navigate("/interview")}>← Back to Interview Hub</button>

        <div className="video-setup-grid">
          <div className="video-setup-card">
            <div className="video-setup-title-row">
              <span className="video-setup-icon">🎥</span>
              <div>
                <h1>Robot Video Viva</h1>
                <p>Robot asks questions, you answer on camera, speech becomes transcript, Groq evaluates.</p>
              </div>
            </div>

            {error && <div className="alert alert--error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Role <span style={{ color: "var(--color-danger)" }}>*</span></label>
              <div className="ai-role-suggestions">
                {roleSuggestions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`ai-role-chip${profile.desired_role === role ? " ai-role-chip--active" : ""}`}
                    onClick={() => updateProfile("desired_role", role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <input
                className="form-input"
                style={{ marginTop: "0.6rem" }}
                value={profile.desired_role}
                onChange={(e) => updateProfile("desired_role", e.target.value)}
                placeholder="Example: Frontend Developer"
              />
            </div>

            <div className="ai-two-col">
              <div className="form-group">
                <label className="form-label">Experience</label>
                <select className="form-input" value={profile.experience_level} onChange={(e) => updateProfile("experience_level", e.target.value)}>
                  <option value="entry">Entry</option>
                  <option value="mid">Mid</option>
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

            <div className="form-group">
              <label className="form-label">Transcript Language</label>
              <select className="form-input" value={transcriptLang} onChange={(e) => setTranscriptLang(e.target.value)}>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="bn-BD">Bangla (Bangladesh)</option>
                <option value="hi-IN">Hindi (India)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Skills <span className="ai-field-hint">comma separated</span></label>
              <input
                className="form-input"
                value={profile.current_skills}
                onChange={(e) => updateProfile("current_skills", e.target.value)}
                placeholder="React, JavaScript, SQL"
              />
              <div className="ai-skill-suggestions">
                {COMMON_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className="ai-skill-suggestion"
                    onClick={() => updateProfile("current_skills", profile.current_skills ? `${profile.current_skills}, ${skill}` : skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn--primary btn--full btn--lg" onClick={startSession} disabled={loading}>
              {loading ? <span className="auth-spinner" /> : "Start Robot Video Viva →"}
            </button>
          </div>

          <div className="video-setup-side">
            <RobotAvatar />
            <div className="video-feature-list">
              <span>🎥 Camera + mic answer</span>
              <span>🔊 Robot reads questions</span>
              <span>📝 Voice-to-text transcript</span>
              <span>🤖 Groq AI evaluation</span>
              {!sttSupported && <span>⚠ Speech-to-text works best in Chrome/Edge</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "session") {
    return (
      <div className="page video-session-page">
        {source === "fallback" && <div className="iv-mock-banner">⚠ AI backend unavailable — fallback questions are being used.</div>}
        {!sttSupported && <div className="iv-mock-banner">⚠ Your browser does not support live speech-to-text. Type/edit transcript manually before submit.</div>}
        {error && <div className="alert alert--error">{error}</div>}

        <div className="iv-progress-bar">
          <div className="iv-progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="video-session-header">
          <div>
            <span className="iv-q-counter">Question {current + 1} / {questions.length}</span>
            <h2>{profile.desired_role} Viva</h2>
          </div>
          <button className="btn btn--outline" onClick={() => speakQuestion(currentQuestionText)} disabled={speaking}>
            {speaking ? "Robot Speaking..." : "🔊 Repeat Question"}
          </button>
        </div>

        <RobotAvatar speaking={speaking} listening={listening || recording} question={currentQuestionText} />

        <div className="video-stage">
          <div className="video-camera-card">
            <div className="video-camera-frame">
              <video ref={videoRef} autoPlay muted playsInline className="video-camera" />
              {!cameraReady && <div className="video-camera-placeholder">Camera preview will appear here</div>}
              {recording && <div className="video-recording-pill">● Recording {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}</div>}
            </div>

            {recording && (
              <div className="iv-recorder__timer-wrap">
                <div className="iv-recorder__timer-bar"><div className="iv-recorder__timer-fill" style={{ width: `${recPct}%` }} /></div>
                <span className="iv-recorder__time">Max 2:30</span>
              </div>
            )}

            <div className="video-controls">
              {!cameraReady && <button className="btn btn--outline" onClick={startCamera}>Allow Camera + Mic</button>}
              {!recording && <button className="iv-record-btn iv-record-btn--start" onClick={startRecording}>🔴 Start Answer</button>}
              {recording && <button className="iv-record-btn iv-record-btn--stop" onClick={stopRecording}>⏹ Stop Answer</button>}
            </div>
            <div className="video-feature-list" style={{ marginTop: "0.75rem" }}>
              <span>{mediaStatus.video ? "✅ Camera detected" : "⚠ Camera not ready"}</span>
              <span>{mediaStatus.audio ? "✅ Microphone audio detected" : "⚠ Microphone audio missing"}</span>
              <span>{sttSupported ? `✅ Live transcript ready (${transcriptLang})` : "⚠ Live transcript unsupported"}</span>
            </div>
          </div>

          <div className="video-transcript-card">
            <div className="iv-transcript-box__label">📝 Live Transcript {listening && <span className="iv-listening-dot" />}</div>
            <textarea
              className="form-input form-textarea video-transcript-area"
              value={answerText}
              onChange={(e) => q?.id && setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Speak after pressing Start Answer. Transcript will appear here. You can edit it before submitting."
            />
            {previewUrl && (
              <div className="video-preview-box">
                <strong>Recorded Preview</strong>
                <video controls src={previewUrl} className="video-preview" />
              </div>
            )}
          </div>
        </div>

        <div className="video-nav-actions">
          <button className="btn btn--outline" onClick={goPrev} disabled={current === 0 || recording}>← Previous</button>
          {current < questions.length - 1 ? (
            <button className="btn btn--primary" onClick={goNext} disabled={recording}>Next Question →</button>
          ) : (
            <button className="btn btn--primary" onClick={submitInterview} disabled={recording || loading}>
              {loading ? <span className="auth-spinner" /> : "Submit Viva ✓"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const score = Math.round(result?.overall_score || result?.score || 0);
    return (
      <div className="page video-result-page">
        <div className="iv-result-header">
          <div className="iv-result-score-ring">
            <svg viewBox="0 0 120 120" width="140" height="140">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#7c3aed" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${score * 3.27} 327`} transform="rotate(-90 60 60)" />
            </svg>
            <div className="iv-result-score-ring__label">
              <span className="iv-result-score-ring__pct" style={{ color: "#7c3aed" }}>{score}%</span>
              <span className="iv-result-score-ring__raw">score</span>
            </div>
          </div>
          <div>
            <h1 className="iv-result-grade" style={{ color: "#7c3aed" }}>Robot Video Viva Complete</h1>
            <p className="iv-result-sub">{result?.summary || "Your video viva answers were evaluated from the generated transcript."}</p>
          </div>
        </div>

        <div className="ai-result-section">
          <h2 className="section-title">AI Feedback</h2>
          <div className="ai-sg-grid">
            <div className="ai-sg-card ai-sg-card--strength">
              <h3>Strengths</h3>
              <ul>{(result?.strengths || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="ai-sg-card">
              <h3>Improvements</h3>
              <ul>{(result?.weaknesses || result?.areas_to_improve || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="ai-sg-card">
              <h3>Recommendations</h3>
              <ul>{(result?.recommendations || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
          </div>
        </div>

        <div className="iv-review">
          <h2 className="section-title">Transcript & Video Review</h2>
          <div className="iv-review-list">
            {questions.map((question, i) => (
              <div key={question.id} className="iv-voice-review-card">
                <div className="iv-voice-review-card__header"><span className="iv-review-item__num">Q{i + 1}</span></div>
                <p className="iv-review-item__q">{question.question || question.question_text}</p>
                <div className="iv-voice-review-card__answer"><strong>Your transcript:</strong> <span>{answers[question.id] || "No transcript captured."}</span></div>
                {videoAnswers[question.id]?.url && <video controls src={videoAnswers[question.id].url} className="video-review-player" />}
              </div>
            ))}
          </div>
        </div>

        <div className="iv-result-actions">
          <button className="btn btn--outline" onClick={() => { setPhase("setup"); setResult(null); }}>Try Again</button>
          <button className="btn btn--primary" onClick={() => navigate("/interview")}>← Back to Hub</button>
        </div>
      </div>
    );
  }

  return null;
};

export default InterviewVideo;
