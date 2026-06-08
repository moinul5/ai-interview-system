/**
 * SlotSelection.jsx
 * -----------------
 * Time slot selection page for candidates.
 * Shows available slots grouped by date as clickable cards.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdSchedule,
  MdCheckCircle,
  MdAccessTime,
} from "react-icons/md";
import { getAvailableSlots, selectSlot } from "../../services/schedulingService";

export default function SlotSelection() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [interviewDetails, setInterviewDetails] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data } = await getAvailableSlots(interviewId);
        setSlots(data.slots ?? data.available_slots ?? []);
        setInterviewDetails(data.interview ?? null);
      } catch {
        setError("Failed to load available slots.");
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [interviewId]);

  // Group slots by date
  const groupedSlots = slots.reduce((groups, slot) => {
    const date = new Date(slot.start_time).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(slot);
    return groups;
  }, {});

  const handleSubmit = async () => {
    if (!selectedSlotId) return;
    setSubmitting(true);
    setError("");
    try {
      await selectSlot(interviewId, {
        slot_id: selectedSlotId,
        message: message || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to select slot.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loader">
          <div className="loader__spinner" />
          <span className="loader__message">Loading available slots…</span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page">
        <div className="slot-selection__success">
          <MdCheckCircle size={64} />
          <h2>Time Slot Confirmed!</h2>
          <p>Your interview has been scheduled. You'll receive a confirmation soon.</p>
          <button className="btn btn--primary" onClick={() => navigate("/candidate/interviews")}>
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button
        className="btn btn--outline btn--sm"
        onClick={() => navigate("/candidate/interviews")}
        style={{ marginBottom: "var(--space-4)" }}
      >
        <MdArrowBack size={16} /> Back to Interviews
      </button>

      <div className="page-header">
        <h1 className="page-header__title">Select Interview Time</h1>
        <p className="page-header__subtitle">Choose a time slot that works best for you</p>
      </div>

      {/* Interview details summary */}
      {interviewDetails && (
        <div className="slot-selection__info">
          <div className="slot-selection__info-item">
            <span className="slot-selection__info-label">Position</span>
            <span className="slot-selection__info-value">
              {interviewDetails.position_title || interviewDetails.position || "—"}
            </span>
          </div>
          <div className="slot-selection__info-item">
            <span className="slot-selection__info-label">Interviewer</span>
            <span className="slot-selection__info-value">
              {interviewDetails.interviewer_name || "—"}
            </span>
          </div>
          <div className="slot-selection__info-item">
            <span className="slot-selection__info-label">Type</span>
            <span className="slot-selection__info-value">
              {interviewDetails.interview_type || "—"}
            </span>
          </div>
        </div>
      )}

      {error && <div className="alert alert--error">{error}</div>}

      {Object.keys(groupedSlots).length === 0 ? (
        <div className="empty-state">
          <MdSchedule size={48} />
          <p>No available slots at the moment</p>
        </div>
      ) : (
        <div className="slot-selection__groups">
          {Object.entries(groupedSlots).map(([date, dateSlots]) => (
            <div key={date} className="slot-group">
              <h3 className="slot-group__date">{date}</h3>
              <div className="slot-grid">
                {dateSlots.map((slot) => (
                  <button
                    key={slot.id}
                    className={`slot-card ${selectedSlotId === slot.id ? "slot-card--selected" : ""} ${slot.is_booked ? "slot-card--booked" : ""}`}
                    onClick={() => !slot.is_booked && setSelectedSlotId(slot.id)}
                    disabled={slot.is_booked}
                  >
                    <MdAccessTime size={20} />
                    <span className="slot-card__time">
                      {new Date(slot.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(slot.end_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="slot-card__duration">
                      {slot.duration_minutes ? `${slot.duration_minutes} min` : ""}
                    </span>
                    {slot.is_booked && (
                      <span className="slot-card__booked-label">Booked</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message + Confirm */}
      {slots.length > 0 && (
        <div className="slot-selection__footer">
          <div className="form-group">
            <label className="form-label">Message (optional)</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Any notes for the interviewer…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          <button
            className="btn btn--primary btn--lg"
            onClick={handleSubmit}
            disabled={!selectedSlotId || submitting}
          >
            {submitting ? "Confirming…" : "Confirm Selection"}
          </button>
        </div>
      )}
    </div>
  );
}
