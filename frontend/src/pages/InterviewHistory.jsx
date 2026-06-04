/**
 * InterviewHistory.jsx
 * --------------------
 * Interview History page — shows all past interviews taken by the user.
 * Fetches from: GET /interview/history?interview_type=
 *
 * Displays Voice and AI interview results in a unified timeline.
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
  const [filter, setFilter]     = useState("all"); // all | voice | ai
  const [expanded, setExpanded] = useState(null);   // id of expanded card

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

  // ── Helper: format date ────────────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // ── Helper: score color ────────────────────────────────────────────────────
  const scoreColor = (score) => {
    if (score == null) return "#94a3b8";
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#4f46e5";
    if (score >= 40) return "#f97316";
    return "#ef4444";
  };

  // ── Helper: score label ────────────────────────────────────────────────────
  const scoreLabel = (score) => {
    if (score == null) return "Pending";
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    return "Needs Work";
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalInterviews = history.length;
  const avgScore = totalInterviews
    ? Math.round(history.filter(h => h.score != null).reduce((sum, h) => sum + (h.score || 0), 0) / Math.max(history.filter(h => h.score != null).length, 1))
    : 0;
  const voiceCount = history.filter(h => h.type === "voice").length;
  const aiCount = history.filter(h => h.type === "ai").length;

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
      </div>

      {/* Filter tabs */}
      <div className="ih-filter-tabs">
        {[
          { value: "all", label: "All", icon: "📋" },
          { value: "voice", label: "Voice", icon: "🎙️" },
          { value: "ai", label: "AI", icon: "🤖" },
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
      {/* Learning Roadmap Section */}
{!loading && history.length > 0 && history[0]?.type === "ai" && (
  <div
    style={{
      background: "#fff",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "24px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    }}
  >
    <h2>🗺️ Personalized Learning Roadmap</h2>

    <p>
      <strong>Current Score:</strong> {history[0]?.score || 0}/100
    </p>

    <p>
    <strong>Progress:</strong> {history[0]?.score || 0}% → 70%
    </p>

    {history[0]?.gaps?.length > 0 && (
      <>
        <h3>🎯 Priority Skills</h3>
        <ul>
          {history[0].gaps.map((gap, index) => (
            <li key={index}>{gap}</li>
          ))}
        </ul>
      </>
    )}

    <h3>🚀 Action Plan</h3>
    <ol>
      <li>Improve weak areas identified in the interview</li>
      <li>Practice technical questions regularly</li>
      <li>Complete another AI interview</li>
      <li>Increase score above 70%</li>
    </ol>
  </div>
)}
      {!loading && history.length > 0 && (
        <div className="ih-list">
          {history.map((item, idx) => {
            const isExpanded = expanded === `${item.type}-${item.id}-${idx}`;
            const key = `${item.type}-${item.id}-${idx}`;

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
                    <span className="ih-card__type-icon">
                      {item.type === "voice" ? "🎙️" : "🤖"}
                    </span>
                    <div>
                      <p className="ih-card__title">
                        {item.type === "voice"
                          ? item.question_text?.substring(0, 80) + (item.question_text?.length > 80 ? "..." : "")
                          : `${item.desired_role || "AI Interview"} · ${item.experience_level || ""}`}
                      </p>
                      <div className="ih-card__meta">
                        <span className={`iv-tag iv-tag--${item.type === "voice" ? "medium" : "easy"}`}>
                          {item.type === "voice" ? "Voice" : "AI Interview"}
                        </span>
                        {item.category && <span className="iv-tag">{item.category}</span>}
                        {item.difficulty && <span className={`iv-tag iv-tag--${item.difficulty}`}>{item.difficulty}</span>}
                        <span className="ih-card__date">{formatDate(item.submitted_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ih-card__right">
                    {item.score != null && (
                      <div className="ih-card__score" style={{ color: scoreColor(item.score) }}>
                        <span className="ih-card__score-value">{typeof item.score === "number" ? item.score.toFixed(1) : item.score}</span>
                        <span className="ih-card__score-label">{scoreLabel(item.score)}</span>
                      </div>
                    )}
                    <span className={`ih-card__chevron${isExpanded ? " ih-card__chevron--open" : ""}`}>▾</span>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="ih-card__details" onClick={e => e.stopPropagation()}>

                    {/* Voice interview details */}
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

                    {/* AI interview details */}
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
