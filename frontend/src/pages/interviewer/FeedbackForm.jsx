/**
 * FeedbackForm.jsx
 * ----------------
 * Post-interview feedback form with score sliders
 * and recommendation radio buttons.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdSend,
  MdCheckCircle,
} from "react-icons/md";
import {
  getInterviewerInterviews,
  submitFeedback,
} from "../../services/schedulingService";

const SCORE_FIELDS = [
  { key: "technical_skills", label: "Technical Skills" },
  { key: "communication", label: "Communication" },
  { key: "problem_solving", label: "Problem Solving" },
  { key: "overall", label: "Overall Performance" },
];

const RECOMMENDATIONS = [
  { value: "hire", label: "Hire", color: "#22c55e" },
  { value: "maybe", label: "Maybe", color: "#f59e0b" },
  { value: "reject", label: "Reject", color: "#ef4444" },
];

export default function FeedbackForm() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [scores, setScores] = useState({
    technical_skills: 70,
    communication: 70,
    problem_solving: 70,
    overall: 70,
  });
  const [recommendation, setRecommendation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const { data } = await getInterviewerInterviews();
        const all = data.interviews ?? data ?? [];
        const found = all.find((iv) => iv.id === interviewId || iv.id === Number(interviewId));
        setInterview(found || null);
      } catch {
        setError("Failed to load interview details.");
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [interviewId]);

  const handleScoreChange = (key, value) => {
    setScores((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recommendation) {
      setError("Please select a recommendation.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitFeedback(interviewId, {
        scores,
        recommendation,
        notes,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loader">
          <div className="loader__spinner" />
          <span className="loader__message">Loading…</span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page">
        <div className="slot-selection__success">
          <MdCheckCircle size={64} />
          <h2>Feedback Submitted!</h2>
          <p>Thank you for your evaluation.</p>
          <button className="btn btn--primary" onClick={() => navigate("/interviewer/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button
        className="btn btn--outline btn--sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: "var(--space-4)" }}
      >
        <MdArrowBack size={16} /> Back
      </button>

      <div className="page-header">
        <h1 className="page-header__title">Interview Feedback</h1>
        <p className="page-header__subtitle">
          Evaluate the candidate's performance
        </p>
      </div>

      {/* Interview Details */}
      {interview && (
        <div className="feedback-interview-info">
          <div className="feedback-interview-info__item">
            <span className="feedback-interview-info__label">Candidate</span>
            <span className="feedback-interview-info__value">{interview.candidate_name || "—"}</span>
          </div>
          <div className="feedback-interview-info__item">
            <span className="feedback-interview-info__label">Position</span>
            <span className="feedback-interview-info__value">
              {interview.position_title || interview.position || "—"}
            </span>
          </div>
          <div className="feedback-interview-info__item">
            <span className="feedback-interview-info__label">Type</span>
            <span className="feedback-interview-info__value">{interview.interview_type || "—"}</span>
          </div>
        </div>
      )}

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="feedback-form">
        {/* Score Sliders */}
        <div className="feedback-form__section">
          <h3 className="section-title">Scores</h3>
          {SCORE_FIELDS.map(({ key, label }) => (
            <div key={key} className="score-slider">
              <div className="score-slider__header">
                <label className="score-slider__label">{label}</label>
                <span className="score-slider__value">{scores[key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={scores[key]}
                onChange={(e) => handleScoreChange(key, e.target.value)}
                className="score-slider__input"
              />
              <div className="score-slider__range">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        <div className="feedback-form__section">
          <h3 className="section-title">Recommendation</h3>
          <div className="recommendation-group">
            {RECOMMENDATIONS.map(({ value, label, color }) => (
              <label
                key={value}
                className={`recommendation-pill ${recommendation === value ? "recommendation-pill--active" : ""}`}
                style={{
                  "--pill-color": color,
                  borderColor: recommendation === value ? color : undefined,
                  background: recommendation === value ? color + "15" : undefined,
                }}
              >
                <input
                  type="radio"
                  name="recommendation"
                  value={value}
                  checked={recommendation === value}
                  onChange={(e) => setRecommendation(e.target.value)}
                />
                <span style={{ color: recommendation === value ? color : undefined }}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="feedback-form__section">
          <h3 className="section-title">Additional Notes</h3>
          <textarea
            className="form-input form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share detailed feedback about the candidate…"
            rows={5}
          />
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--lg"
          disabled={submitting}
          style={{ marginTop: "var(--space-4)" }}
        >
          <MdSend size={18} /> {submitting ? "Submitting…" : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}
