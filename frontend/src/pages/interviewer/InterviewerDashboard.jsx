/**
 * InterviewerDashboard.jsx
 * ------------------------
 * Interviewer overview with stats, upcoming interviews,
 * and pending requests sections.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdSchedule,
  MdPendingActions,
  MdCheckCircle,
  MdOpenInNew,
  MdThumbUp,
  MdThumbDown,
  MdVideoCall,
} from "react-icons/md";
import {
  getInterviewerInterviews,
  acceptInterview,
  rejectInterview,
} from "../../services/schedulingService";

export default function InterviewerDashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const { data } = await getInterviewerInterviews();
      setInterviews(data.interviews ?? data ?? []);
    } catch {
      setError("Failed to load interviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const upcoming = interviews.filter((iv) => iv.status === "confirmed");
  const pending = interviews.filter((iv) => iv.status === "pending");
  const completed = interviews.filter((iv) => iv.status === "completed");

  const handleAccept = async (id) => {
    try {
      await acceptInterview(id);
      fetchInterviews();
    } catch {
      alert("Failed to accept interview.");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejecting:");
    if (!reason) return;
    try {
      await rejectInterview(id, { reason });
      fetchInterviews();
    } catch {
      alert("Failed to reject interview.");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loader">
          <div className="loader__spinner" />
          <span className="loader__message">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: <MdSchedule size={28} />,
      value: upcoming.length,
      label: "Upcoming",
      gradient: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    },
    {
      icon: <MdPendingActions size={28} />,
      value: pending.length,
      label: "Pending Requests",
      gradient: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
    },
    {
      icon: <MdCheckCircle size={28} />,
      value: completed.length,
      label: "Completed",
      gradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-header__title">Interviewer Dashboard</h1>
        <p className="page-header__subtitle">Your interview overview</p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {/* Stats */}
      <div className="admin-stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="admin-stat-card" style={{ background: stat.gradient }}>
            <div className="admin-stat-card__icon">{stat.icon}</div>
            <div className="admin-stat-card__value">{stat.value}</div>
            <div className="admin-stat-card__label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Interviews */}
      <div className="section">
        <h2 className="section-title">Upcoming Interviews</h2>
        {upcoming.length === 0 ? (
          <div className="empty-state">
            <MdVideoCall size={40} />
            <p>No upcoming interviews</p>
          </div>
        ) : (
          <div className="interview-cards-grid">
            {upcoming.map((iv) => (
              <div key={iv.id} className="interview-card interview-card--confirmed">
                <div className="interview-card__header">
                  <h3 className="interview-card__title">
                    {iv.position_title || iv.position || "Interview"}
                  </h3>
                  <span className="status-badge status-badge--confirmed">Confirmed</span>
                </div>
                <div className="interview-card__details">
                  <div className="interview-card__detail">
                    <span className="interview-card__label">Candidate</span>
                    <span className="interview-card__value">{iv.candidate_name || "—"}</span>
                  </div>
                  {iv.scheduled_at && (
                    <div className="interview-card__detail">
                      <span className="interview-card__label">Date & Time</span>
                      <span className="interview-card__value">
                        {new Date(iv.scheduled_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="interview-card__actions">
                  {iv.meet_link && (
                    <a
                      href={iv.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--primary btn--sm"
                    >
                      <MdOpenInNew size={16} /> Join Meeting
                    </a>
                  )}
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => navigate(`/interviewer/interviews/${iv.id}/feedback`)}
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      <div className="section">
        <h2 className="section-title">Pending Requests</h2>
        {pending.length === 0 ? (
          <div className="empty-state">
            <MdPendingActions size={40} />
            <p>No pending requests</p>
          </div>
        ) : (
          <div className="interview-cards-grid">
            {pending.map((iv) => (
              <div key={iv.id} className="interview-card interview-card--pending">
                <div className="interview-card__header">
                  <h3 className="interview-card__title">
                    {iv.position_title || iv.position || "Interview"}
                  </h3>
                  <span className="status-badge status-badge--pending">Pending</span>
                </div>
                <div className="interview-card__details">
                  <div className="interview-card__detail">
                    <span className="interview-card__label">Candidate</span>
                    <span className="interview-card__value">{iv.candidate_name || "—"}</span>
                  </div>
                  <div className="interview-card__detail">
                    <span className="interview-card__label">Type</span>
                    <span className="interview-card__value">{iv.interview_type || "—"}</span>
                  </div>
                  {iv.candidate_message && (
                    <div className="interview-card__detail">
                      <span className="interview-card__label">Message</span>
                      <span className="interview-card__value">{iv.candidate_message}</span>
                    </div>
                  )}
                </div>
                <div className="interview-card__actions">
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => handleAccept(iv.id)}
                    style={{ background: "var(--color-success)", borderColor: "var(--color-success)" }}
                  >
                    <MdThumbUp size={16} /> Accept
                  </button>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => handleReject(iv.id)}
                  >
                    <MdThumbDown size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
