/**
 * InterviewRequests.jsx
 * ---------------------
 * Pending interview requests for the interviewer.
 * Accept/reject with reason modal.
 */

import { useState, useEffect } from "react";
import {
  MdThumbUp,
  MdThumbDown,
  MdClose,
  MdAssignment,
  MdOpenInNew,
} from "react-icons/md";
import {
  getInterviewerInterviews,
  acceptInterview,
  rejectInterview,
} from "../../services/schedulingService";

const typeLabels = {
  technical: "Technical",
  hr: "HR",
  behavioral: "Behavioral",
  final: "Final",
  coding: "Coding",
};

export default function InterviewRequests() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const { data } = await getInterviewerInterviews();
      const all = data.interviews ?? data ?? [];
      setInterviews(all);
    } catch {
      setError("Failed to load interview requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const pendingInterviews = interviews.filter((iv) => iv.status === "pending");
  const acceptedInterviews = interviews.filter((iv) => iv.status === "confirmed");

  const handleAccept = async (id) => {
    try {
      await acceptInterview(id);
      fetchInterviews();
    } catch {
      alert("Failed to accept interview.");
    }
  };

  const openRejectModal = (interview) => {
    setRejectTarget(interview);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await rejectInterview(rejectTarget.id, { reason: rejectReason });
      setShowRejectModal(false);
      fetchInterviews();
    } catch {
      alert("Failed to reject interview.");
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loader">
          <div className="loader__spinner" />
          <span className="loader__message">Loading requests…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-header__title">Interview Requests</h1>
        <p className="page-header__subtitle">Review and respond to interview requests</p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {/* Pending Requests */}
      <div className="section">
        <h2 className="section-title">
          Pending Requests ({pendingInterviews.length})
        </h2>
        {pendingInterviews.length === 0 ? (
          <div className="empty-state">
            <MdAssignment size={48} />
            <p>No pending requests</p>
          </div>
        ) : (
          <div className="interview-cards-grid">
            {pendingInterviews.map((iv) => (
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
                    <span className={`type-badge type-badge--${iv.interview_type || "technical"}`}>
                      {typeLabels[iv.interview_type] || iv.interview_type || "—"}
                    </span>
                  </div>
                  {iv.scheduled_at && (
                    <div className="interview-card__detail">
                      <span className="interview-card__label">Requested Time</span>
                      <span className="interview-card__value">
                        {new Date(iv.scheduled_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {iv.candidate_message && (
                    <div className="interview-card__detail">
                      <span className="interview-card__label">Message</span>
                      <span className="interview-card__value">{iv.candidate_message}</span>
                    </div>
                  )}
                </div>
                <div className="interview-card__actions">
                  <button
                    className="btn btn--sm"
                    onClick={() => handleAccept(iv.id)}
                    style={{
                      background: "var(--color-success)",
                      color: "#fff",
                      borderColor: "var(--color-success)",
                    }}
                  >
                    <MdThumbUp size={16} /> Accept
                  </button>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => openRejectModal(iv)}
                  >
                    <MdThumbDown size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Accepted */}
      {acceptedInterviews.length > 0 && (
        <div className="section">
          <h2 className="section-title">Accepted Interviews</h2>
          <div className="interview-cards-grid">
            {acceptedInterviews.map((iv) => (
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
                      <MdOpenInNew size={16} /> Meeting Link
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Interview</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>
                <MdClose size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
                Please provide a reason for rejecting this interview request.
              </p>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-input form-textarea"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection…"
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn--outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn--danger"
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || rejectLoading}
              >
                {rejectLoading ? "Rejecting…" : "Reject Interview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
