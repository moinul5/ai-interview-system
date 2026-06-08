/**
 * CandidateInterviews.jsx
 * -----------------------
 * Candidate's human interview list with card-based layout,
 * status filter tabs, and action buttons per interview.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdVideoCall,
  MdSchedule,
  MdOpenInNew,
  MdRefresh,
  MdStar,
} from "react-icons/md";
import { getCandidateInterviews, requestReschedule } from "../../services/schedulingService";

const STATUS_TABS = ["all", "pending", "confirmed", "completed"];

const typeLabels = {
  technical: "Technical",
  hr: "HR",
  behavioral: "Behavioral",
  final: "Final",
  coding: "Coding",
};

export default function CandidateInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchInterviews = async () => {
      setLoading(true);
      try {
        const { data } = await getCandidateInterviews();
        setInterviews(data.interviews ?? data ?? []);
      } catch {
        setError("Failed to load interviews.");
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const filteredInterviews =
    activeTab === "all"
      ? interviews
      : interviews.filter((iv) => iv.status === activeTab);

  const handleReschedule = async (interviewId) => {
    const reason = prompt("Reason for rescheduling:");
    if (!reason) return;
    try {
      await requestReschedule(interviewId, { reason });
      alert("Reschedule request sent!");
    } catch {
      alert("Failed to send reschedule request.");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loader">
          <div className="loader__spinner" />
          <span className="loader__message">Loading interviews…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-header__title">My Interviews</h1>
        <p className="page-header__subtitle">Your scheduled human interviews</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={`filter-tab ${activeTab === tab ? "filter-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {filteredInterviews.length === 0 ? (
        <div className="empty-state">
          <MdVideoCall size={48} />
          <p>No interviews found</p>
        </div>
      ) : (
        <div className="interview-cards-grid">
          {filteredInterviews.map((iv) => (
            <div
              key={iv.id}
              className={`interview-card interview-card--${iv.status || "pending"}`}
            >
              <div className="interview-card__header">
                <h3 className="interview-card__title">
                  {iv.position_title || iv.position || "Interview"}
                </h3>
                <span className={`status-badge status-badge--${iv.status || "pending"}`}>
                  {iv.status || "pending"}
                </span>
              </div>

              <div className="interview-card__details">
                <div className="interview-card__detail">
                  <span className="interview-card__label">Interviewer</span>
                  <span className="interview-card__value">{iv.interviewer_name || "TBD"}</span>
                </div>
                <div className="interview-card__detail">
                  <span className="interview-card__label">Type</span>
                  <span className={`type-badge type-badge--${iv.interview_type || "technical"}`}>
                    {typeLabels[iv.interview_type] || iv.interview_type || "—"}
                  </span>
                </div>
                <div className="interview-card__detail">
                  <span className="interview-card__label">Round</span>
                  <span className="interview-card__value">{iv.round ?? "—"}</span>
                </div>
                {iv.scheduled_at && (
                  <div className="interview-card__detail">
                    <span className="interview-card__label">Date & Time</span>
                    <span className="interview-card__value">
                      {new Date(iv.scheduled_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {iv.status === "completed" && iv.score != null && (
                  <div className="interview-card__detail">
                    <span className="interview-card__label">Score</span>
                    <span className="interview-card__value interview-card__score">
                      <MdStar size={16} /> {iv.score}/100
                    </span>
                  </div>
                )}
              </div>

              <div className="interview-card__actions">
                {iv.status === "pending" && (
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => navigate(`/candidate/interviews/${iv.id}/select-slot`)}
                  >
                    <MdSchedule size={16} /> Select Time Slot
                  </button>
                )}
                {iv.status === "confirmed" && iv.meet_link && (
                  <a
                    href={iv.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--primary btn--sm"
                  >
                    <MdOpenInNew size={16} /> Join Interview
                  </a>
                )}
                {["pending", "confirmed"].includes(iv.status) && (
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => handleReschedule(iv.id)}
                  >
                    <MdRefresh size={16} /> Reschedule
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
