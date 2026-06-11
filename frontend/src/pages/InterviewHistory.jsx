/**
 * InterviewHistory.jsx
 * --------------------
 * Interview History page — shows all past interviews taken by the user.
 * Fetches from: GET /interview/history?interview_type=
 *
 * Displays Voice, AI, and Video interview results in a unified timeline.
 *
 * Route: /interview/history
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";

const InterviewHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("all"); // all | voice | ai | video
  const [expanded, setExpanded] = useState(null);

  // ── Fetch history ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const params = filter !== "all" ? `?interview_type=${filter}` : "";
        const res = await apiClient.get(`/interview/history${params}`);
        setHistory(res.data.history || []);
      } catch {
        setError("Could not load interview history. Make sure the backend is running.");
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [filter]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const scoreColor = (score) => {
    if (score == null) return "#94a3b8";
    if (score >= 80) return "#22c55e";
    if (score >= 65) return "#7c3aed";
    if (score >= 50) return "#f97316";
    return "#ef4444";
  };

  const scoreLabel = (score) => {
    if (score == null) return "Pending";
    if (score >= 80) return "Excellent";
    if (score >= 65) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Work";
  };

  // ── Video metric mini-bar ──────────────────────────────────────────────────
  const VidMetricBar = ({ label, value, icon }) => {
    const pct = Math.round(value ?? 0);
    const color = pct >= 75 ? "#10b981" : pct >= 55 ? "#7c3aed" : pct >= 35 ? "#f59e0b" : "#ef4444";
    return (
      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "3px" }}>
          <span>{icon} {label}</span>
          <span style={{ color, fontWeight: 700 }}>{pct}%</span>
        </div>
        <div style={{ height: "5px", background: "rgba(0,0,0,0.08)", borderRadius: "4px" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.8s ease" }} />
        </div>
      </div>
    );
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalInterviews = history.length;
  const scored   = history.filter(h => h.score != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum, h) => sum + (h.score || 0), 0) / scored.length)
    : 0;
  const voiceCount = history.filter(h => h.type === "voice").length;
  const aiCount    = history.filter(h => h.type === "ai").length;
  const videoCount = history.filter(h => h.type === "video").length;

  return (
    <div className="page ih-page">
      <button className="iv-back-btn" onClick={() => navigate("/interview")}>← Back to Interview Hub</button>

      {/* Header */}
      <div className="page-header">
        <h1 className="page-header__title">📋 Interview History</h1>
        <p className="page-header__subtitle">
          Review all your past interviews, {user?.name?.split(" ")[0] || "there"}. Track your progress over time.
        </p>
      </div>

      {/* Stats Row */}
      <div className="ih-stats-row">
        <div className="ih-stat-card">
          <span className="ih-stat-card__value">{totalInterviews}</span>
          <span className="ih-stat-card__label">Total Interviews</span>
        </div>
        <div className="ih-stat-card">
          <span className="ih-stat-card__value" style={{ color: scoreColor(avgScore) }}>{avgScore}%</span>
          <span className="ih-stat-card__label">Average Score</span>
        </div>
        <div className="ih-stat-card">
          <span className="ih-stat-card__value">{voiceCount}</span>
          <span className="ih-stat-card__label">Voice Interviews</span>
        </div>
        <div className="ih-stat-card">
          <span className="ih-stat-card__value">{aiCount}</span>
          <span className="ih-stat-card__label">AI Interviews</span>
        </div>
        <div className="ih-stat-card">
          <span className="ih-stat-card__value">{videoCount}</span>
          <span className="ih-stat-card__label">Video Interviews</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="ih-filter-tabs">
        {[
          { value: "all",   label: "All",   icon: "📋" },
          { value: "voice", label: "Voice", icon: "🎙️" },
          { value: "ai",    label: "AI",    icon: "🤖" },
          { value: "video", label: "Video", icon: "🎥" },
        ].map(tab => (
          <button
            key={tab.value}
            className={`ih-filter-tab${filter === tab.value ? " ih-filter-tab--active" : ""}`}
            onClick={() => setFilter(tab.value)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="ih-loading">
          <span className="auth-spinner" />
          <p>Loading interview history...</p>
        </div>
      )}

      {/* Error */}
      {error && <div className="alert alert--error">{error}</div>}

      {/* Empty state */}
      {!loading && !error && history.length === 0 && (
        <div className="ih-empty">
          <span className="ih-empty__icon">📭</span>
          <h3>No interview history yet</h3>
          <p>Complete your first interview and it will appear here!</p>
          <button className="btn btn--primary" onClick={() => navigate("/interview")}>
            Start an Interview →
          </button>
        </div>
      )}

      {/* History List */}
      {!loading && history.length > 0 && (
        <div className="ih-list">
          {history.map((item, idx) => {
            const key = `${item.type}-${item.id}-${idx}`;
            const isExpanded = expanded === key;

            const typeIcon     = item.type === "voice" ? "🎙️" : item.type === "video" ? "🎥" : "🤖";
            const typeLabel    = item.type === "voice" ? "Voice" : item.type === "video" ? "Video Analysis" : "AI Interview";
            const typeTagClass = item.type === "video" ? "iv-tag--hard" : item.type === "voice" ? "iv-tag--medium" : "iv-tag--easy";

            const cardTitle = item.type === "voice"
              ? (item.question_text || "Voice Interview").substring(0, 80) + ((item.question_text?.length ?? 0) > 80 ? "..." : "")
              : `${item.desired_role || "Interview"} · ${item.experience_level || ""}`;

            return (
              <div
                key={key}
                className={`ih-card${isExpanded ? " ih-card--expanded" : ""}`}
                onClick={() => setExpanded(isExpanded ? null : key)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === "Enter") setExpanded(isExpanded ? null : key); }}
              >
                {/* Card header */}
                <div className="ih-card__header">
                  <div className="ih-card__left">
                    <span className="ih-card__type-icon">{typeIcon}</span>
                    <div>
                      <p className="ih-card__title">{cardTitle}</p>
                      <div className="ih-card__meta">
                        <span className={`iv-tag ${typeTagClass}`}>{typeLabel}</span>
                        {item.category   && <span className="iv-tag">{item.category}</span>}
                        {item.difficulty && <span className={`iv-tag iv-tag--${item.difficulty}`}>{item.difficulty}</span>}
                        {item.type === "video" && item.analysis_source === "hybrid" && (
                          <span className="iv-tag" style={{ background: "rgba(124,58,237,0.15)", color: "#7c3aed" }}>✅ AI Evaluated</span>
                        )}
                        <span className="ih-card__date">{formatDate(item.submitted_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ih-card__score" style={{ color: scoreColor(item.score) }}>
                    <span className="ih-card__score-value">
                      {typeof item.score === "number" ? Math.round(item.score) : "—"}
                    </span>
                    <span className="ih-card__score-label">{scoreLabel(item.score)}</span>
                    {item.badge && (
                      <div style={{
                        background: item.score >= 80 ? "#dcfce7" : item.score >= 65 ? "rgba(124,58,237,0.12)" : item.score >= 50 ? "#fff7ed" : "#fee2e2",
                        color: item.score >= 80 ? "#15803d" : item.score >= 65 ? "#7c3aed" : item.score >= 50 ? "#c2410c" : "#b91c1c",
                        padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", marginTop: "4px",
                      }}>
                        🏅 {item.badge}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="ih-card__details" onClick={e => e.stopPropagation()}>

                    {/* ── Voice ── */}
                    {item.type === "voice" && (
                      <>
                        <div className="ih-detail-section">
                          <h4>Question</h4>
                          <p>{item.question_text}</p>
                        </div>
                        {item.answer_text && (
                          <div className="ih-detail-section">
                            <h4>Your Answer</h4>
                            <p className="ih-answer-text">{item.answer_text}</p>
                          </div>
                        )}
                        {item.feedback_text && (
                          <div className="ih-detail-section ih-detail-section--feedback">
                            <h4>🤖 AI Feedback</h4>
                            <p>{item.feedback_text}</p>
                          </div>
                        )}
                        {item.improvement && (
                          <div className="ih-detail-section ih-detail-section--improvement">
                            <h4>💡 How to Improve</h4>
                            <p>{item.improvement}</p>
                          </div>
                        )}
                        {item.confidence_level != null && (
                          <div className="ih-detail-row">
                            <span>AI Confidence:</span>
                            <span style={{ fontWeight: 600 }}>{Math.round(item.confidence_level * 100)}%</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── AI Text ── */}
                    {item.type === "ai" && (
                      <>
                        {item.summary && (
                          <div className="ih-detail-section">
                            <h4>Summary</h4>
                            <p>{item.summary}</p>
                          </div>
                        )}
                        <div className="ih-detail-row">
                          <span>Questions:</span>
                          <span style={{ fontWeight: 600 }}>{item.question_count || "—"}</span>
                        </div>
                        {item.strengths?.length > 0 && (
                          <div className="ih-detail-section ih-detail-section--feedback">
                            <h4>✅ Strengths</h4>
                            <ul>{item.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                          </div>
                        )}
                        {item.gaps?.length > 0 && (
                          <div className="ih-detail-section ih-detail-section--improvement">
                            <h4>⚠️ Areas to Improve</h4>
                            <ul>{item.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Video ── */}
                    {item.type === "video" && (
                      <>
                        {/* Score grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                          <div className="ih-detail-row">
                            <span>Overall Score:</span>
                            <span style={{ fontWeight: 700, color: scoreColor(item.score) }}>{Math.round(item.score ?? 0)}/100</span>
                          </div>
                          <div className="ih-detail-row">
                            <span>Confidence:</span>
                            <span style={{ fontWeight: 700, color: scoreColor(item.confidence_score) }}>{Math.round(item.confidence_score ?? 0)}/100</span>
                          </div>
                          <div className="ih-detail-row">
                            <span>🗣 WPM:</span>
                            <span style={{ fontWeight: 600 }}>{item.words_per_minute ?? 0}</span>
                          </div>
                          <div className="ih-detail-row">
                            <span>🔁 Filler Words:</span>
                            <span style={{ fontWeight: 600, color: (item.filler_words_count ?? 0) > 5 ? "#f59e0b" : "#10b981" }}>
                              {item.filler_words_count ?? 0}
                            </span>
                          </div>
                        </div>

                        {/* Delivery metrics */}
                        <div className="ih-detail-section" style={{ padding: "12px 16px" }}>
                          <h4 style={{ marginBottom: "10px" }}>📊 Delivery Metrics</h4>
                          <VidMetricBar label="Eye Contact"     value={item.eye_contact_score}    icon="👁" />
                          <VidMetricBar label="Face Visibility" value={item.face_visibility_score} icon="😊" />
                          <VidMetricBar label="Head Stability"  value={item.head_stability_score}  icon="📐" />
                          <VidMetricBar label="Speech Clarity"  value={item.speech_clarity_score}  icon="🗣" />
                        </div>

                        {/* AI Summary */}
                        {item.summary && (
                          <div className="ih-detail-section ih-detail-section--feedback">
                            <h4>🤖 AI Summary</h4>
                            <p>{item.summary}</p>
                          </div>
                        )}

                        {/* Strengths */}
                        {item.strengths?.length > 0 && (
                          <div className="ih-detail-section ih-detail-section--feedback">
                            <h4>✅ Strengths</h4>
                            <ul>{item.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                          </div>
                        )}

                        {/* Weaknesses */}
                        {item.weaknesses?.length > 0 && (
                          <div className="ih-detail-section ih-detail-section--improvement">
                            <h4>⚠️ Areas to Improve</h4>
                            <ul>{item.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                          </div>
                        )}

                        {/* Per-question answer evaluations */}
                        {item.answer_evaluations?.length > 0 && (
                          <div className="ih-detail-section" style={{ padding: "12px 16px" }}>
                            <h4 style={{ marginBottom: "10px" }}>💡 Answer Evaluations</h4>
                            {item.answer_evaluations.map((ev, i) => (
                              <div key={i} style={{
                                background: "rgba(0,0,0,0.03)", borderRadius: "8px",
                                padding: "10px 12px", marginBottom: "8px",
                                borderLeft: `3px solid ${scoreColor(ev.score)}`,
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                  <strong style={{ fontSize: "0.8rem" }}>Q{i + 1}: {(ev.question || "").substring(0, 60)}…</strong>
                                  <span style={{ color: scoreColor(ev.score), fontWeight: 700, fontSize: "0.85rem" }}>{ev.score}/100</span>
                                </div>
                                {ev.answer && ev.answer !== "(No answer recorded)" ? (
                                  <p style={{ fontSize: "0.78rem", color: "#555", margin: "4px 0", fontStyle: "italic" }}>
                                    "{ev.answer.substring(0, 120)}{ev.answer.length > 120 ? "..." : ""}"
                                  </p>
                                ) : (
                                  <p style={{ fontSize: "0.78rem", color: "#ef4444", margin: "4px 0" }}>⚠ No answer recorded</p>
                                )}
                                <p style={{ fontSize: "0.78rem", color: "#666" }}>{ev.feedback}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InterviewHistory;
