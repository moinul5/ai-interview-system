/**
 * AvailabilityManager.jsx
 * -----------------------
 * Manage interviewer availability slots with add form
 * and grouped slot list with delete capability.
 */

import { useState, useEffect } from "react";
import {
  MdAdd,
  MdDelete,
  MdSchedule,
  MdEventAvailable,
  MdEventBusy,
} from "react-icons/md";
import {
  getInterviewerAvailability,
  createAvailability,
  deleteAvailability,
} from "../../services/schedulingService";

export default function AvailabilityManager() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const { data } = await getInterviewerAvailability();
      setSlots(data.availability ?? data.slots ?? data ?? []);
    } catch {
      setError("Failed to load availability.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  // Group slots by date
  const groupedSlots = slots.reduce((groups, slot) => {
    const d = new Date(slot.start_time || slot.date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!groups[d]) groups[d] = [];
    groups[d].push(slot);
    return groups;
  }, {});

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setAddError("");
    if (!date || !startTime || !endTime) {
      setAddError("Please fill in all fields.");
      return;
    }
    setAddLoading(true);
    try {
      await createAvailability({
        start_time: `${date}T${startTime}:00`,
        end_time: `${date}T${endTime}:00`,
      });
      setDate("");
      setStartTime("");
      setEndTime("");
      fetchSlots();
    } catch (err) {
      let msg = "Failed to add slot.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d) => `${d.loc.slice(1).join(".")}: ${d.msg}`).join(", ");
        } else if (typeof detail === "object") {
          msg = JSON.stringify(detail);
        }
      }
      setAddError(msg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Delete this availability slot?")) return;
    try {
      await deleteAvailability(slotId);
      fetchSlots();
    } catch {
      alert("Failed to delete slot.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-header__title">Manage Availability</h1>
        <p className="page-header__subtitle">
          Set your available time slots for interviews
        </p>
      </div>

      {/* Add Slot Form */}
      <div className="availability-form">
        <h3 className="section-title">Add New Slot</h3>
        <form onSubmit={handleAddSlot} className="availability-form__row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input
              type="time"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input
              type="time"
              className="form-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={addLoading}
            style={{ alignSelf: "flex-end" }}
          >
            <MdAdd size={18} /> {addLoading ? "Adding…" : "Add Slot"}
          </button>
        </form>
        {addError && <div className="alert alert--error" style={{ marginTop: "var(--space-2)" }}>{addError}</div>}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {/* Slot List */}
      <div className="section" style={{ marginTop: "var(--space-8)" }}>
        <h3 className="section-title">Your Availability</h3>
        {loading ? (
          <div className="loader">
            <div className="loader__spinner" />
            <span className="loader__message">Loading slots…</span>
          </div>
        ) : Object.keys(groupedSlots).length === 0 ? (
          <div className="empty-state">
            <MdSchedule size={48} />
            <p>No availability slots set</p>
          </div>
        ) : (
          <div className="availability-list">
            {Object.entries(groupedSlots).map(([dateLabel, dateSlots]) => (
              <div key={dateLabel} className="availability-date-group">
                <h4 className="availability-date-group__label">{dateLabel}</h4>
                <div className="availability-date-group__slots">
                  {dateSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`availability-slot ${slot.is_booked ? "availability-slot--booked" : "availability-slot--available"}`}
                    >
                      <div className="availability-slot__icon">
                        {slot.is_booked ? (
                          <MdEventBusy size={20} />
                        ) : (
                          <MdEventAvailable size={20} />
                        )}
                      </div>
                      <div className="availability-slot__time">
                        {new Date(slot.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {new Date(slot.end_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <span className={`status-badge ${slot.is_booked ? "status-badge--cancelled" : "status-badge--confirmed"}`}>
                        {slot.is_booked ? "Booked" : "Available"}
                      </span>
                      {!slot.is_booked && (
                        <button
                          className="action-btn action-btn--danger btn--sm"
                          onClick={() => handleDeleteSlot(slot.id)}
                          title="Delete"
                        >
                          <MdDelete size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
