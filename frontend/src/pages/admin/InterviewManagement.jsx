/**
 * InterviewManagement.jsx
 * -----------------------
 * Admin interview management with status filter tabs,
 * data table, and create interview modal.
 */

import { useState, useEffect, useCallback } from "react";
import {
  MdAdd,
  MdClose,
  MdVideoCall,
  MdCancel,
  MdVisibility,
  MdSwapHoriz,
} from "react-icons/md";
import {
  getAdminInterviews,
  createInterview,
  updateInterviewStatus,
  deleteInterview,
} from "../../services/adminService";
import { getUsers, getJobs } from "../../services/adminService";

const STATUS_TABS = ["all", "pending", "confirmed", "completed", "cancelled"];
const INTERVIEW_TYPES = ["technical", "hr", "behavioral", "final", "coding"];
const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled", "missed"];

const typeLabels = {
  technical: "Technical",
  hr: "HR",
  behavioral: "Behavioral",
  final: "Final",
  coding: "Coding",
};

export default function InterviewManagement() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [createForm, setCreateForm] = useState({
    candidate_id: "",
    interviewer_id: "",
    job_id: "",
    interview_type: "technical",
    duration_minutes: 60,
    round: 1,
  });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Status change modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailInterview, setDetailInterview] = useState(null);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== "all") params.status = activeTab;
      const { data } = await getAdminInterviews(params);
      setInterviews(data.interviews ?? data ?? []);
    } catch {
      setError("Failed to load interviews.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const openCreateModal = async () => {
    setCreateError("");
    setCreateForm({
      candidate_id: "",
      interviewer_id: "",
      job_id: "",
      interview_type: "technical",
      duration_minutes: 60,
      round: 1,
    });
    try {
      const [cRes, iRes, jRes] = await Promise.all([
        getUsers({ role: "candidate" }),
        getUsers({ role: "interviewer" }),
        getJobs(),
      ]);
      setCandidates(cRes.data.users ?? cRes.data ?? []);
      setInterviewers(iRes.data.users ?? iRes.data ?? []);
      setJobs(jRes.data.jobs ?? jRes.data ?? []);
    } catch {
      setCandidates([]);
      setInterviewers([]);
      setJobs([]);
    }
    setShowCreateModal(true);
  };

  const handleCreateChange = (e) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setCreateForm((prev) => ({ ...prev, [e.target.name]: val }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);
    try {
      await createInterview(createForm);
      setShowCreateModal(false);
      fetchInterviews();
    } catch (err) {
      setCreateError(err.response?.data?.detail || "Failed to create interview.");
    } finally {
      setCreateLoading(false);
    }
  };

  const openStatusModal = (interview) => {
    setStatusTarget(interview);
    setNewStatus(interview.status);
    setShowStatusModal(true);
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    try {
      await updateInterviewStatus(statusTarget.id, { status: newStatus });
      setShowStatusModal(false);
      fetchInterviews();
    } catch {
      alert("Failed to update status.");
    }
  };

  const handleCancel = async (interview) => {
    if (!window.confirm("Are you sure you want to cancel this interview?")) return;
    try {
      await deleteInterview(interview.id);
      fetchInterviews();
    } catch {
      alert("Failed to cancel interview.");
    }
  };

  const openDetailModal = (interview) => {
    setDetailInterview(interview);
    setShowDetailModal(true);
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-header__title">Interview Management</h1>
          <p className="page-header__subtitle">Manage all scheduled interviews</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <MdAdd size={18} /> Create Interview
        </button>
      </div>

      {/* Status Filter Tabs */}
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

      {loading ? (
        <div className="loader">
          <div className="loader__spinner" />
          <span className="loader__message">Loading interviews…</span>
        </div>
      ) : interviews.length === 0 ? (
        <div className="empty-state">
          <MdVideoCall size={40} />
          <p>No interviews found</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Interviewer</th>
                <th>Position</th>
                <th>Type</th>
                <th>Round</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((iv) => (
                <tr key={iv.id}>
                  <td>{iv.candidate_name || "—"}</td>
                  <td>{iv.interviewer_name || "—"}</td>
                  <td>{iv.position_title || iv.position || "—"}</td>
                  <td>
                    <span className={`type-badge type-badge--${iv.interview_type || "technical"}`}>
                      {typeLabels[iv.interview_type] || iv.interview_type || "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{iv.round ?? "—"}</td>
                  <td>
                    <span className={`status-badge status-badge--${iv.status || "pending"}`}>
                      {iv.status || "pending"}
                    </span>
                  </td>
                  <td>
                    {iv.scheduled_at
                      ? new Date(iv.scheduled_at).toLocaleDateString()
                      : "Not set"}
                  </td>
                  <td>
                    <div className="data-table__actions">
                      <button
                        className="action-btn action-btn--primary btn--sm"
                        onClick={() => openDetailModal(iv)}
                        title="View Details"
                      >
                        <MdVisibility size={15} />
                      </button>
                      <button
                        className="action-btn action-btn--warning btn--sm"
                        onClick={() => openStatusModal(iv)}
                        title="Change Status"
                      >
                        <MdSwapHoriz size={15} />
                      </button>
                      <button
                        className="action-btn action-btn--danger btn--sm"
                        onClick={() => handleCancel(iv)}
                        title="Cancel"
                      >
                        <MdCancel size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Interview Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-content--lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Interview</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {createError && <div className="alert alert--error">{createError}</div>}
                <div className="form-group">
                  <label className="form-label">Candidate</label>
                  <select
                    name="candidate_id"
                    className="form-input form-select"
                    value={createForm.candidate_id}
                    onChange={handleCreateChange}
                    required
                  >
                    <option value="">Select Candidate</option>
                    {candidates.map((c) => (
                      <option key={c.candidate_id || c.id} value={c.candidate_id || c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Interviewer</label>
                  <select
                    name="interviewer_id"
                    className="form-input form-select"
                    value={createForm.interviewer_id}
                    onChange={handleCreateChange}
                    required
                  >
                    <option value="">Select Interviewer</option>
                    {interviewers.map((i) => (
                      <option key={i.interviewer_id || i.id} value={i.interviewer_id || i.id}>
                        {i.name} ({i.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select
                    name="job_id"
                    className="form-input form-select"
                    value={createForm.job_id}
                    onChange={handleCreateChange}
                    required
                  >
                    <option value="">Select Position</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      name="interview_type"
                      className="form-input form-select"
                      value={createForm.interview_type}
                      onChange={handleCreateChange}
                    >
                      {INTERVIEW_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {typeLabels[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (min)</label>
                    <input
                      name="duration_minutes"
                      type="number"
                      className="form-input"
                      value={createForm.duration_minutes}
                      onChange={handleCreateChange}
                      min={15}
                      max={180}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Round</label>
                    <input
                      name="round"
                      type="number"
                      className="form-input"
                      value={createForm.round}
                      onChange={handleCreateChange}
                      min={1}
                      max={10}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={createLoading}>
                  {createLoading ? "Creating…" : "Create Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && statusTarget && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Interview Status</h3>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>
                <MdClose size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: "var(--space-4)", color: "var(--color-text-muted)" }}>
                Interview: {statusTarget.candidate_name} × {statusTarget.interviewer_name}
              </p>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select
                  className="form-input form-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn--outline" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={handleStatusChange}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailInterview && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Interview Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <MdClose size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-item__label">Candidate</span>
                  <span className="detail-item__value">{detailInterview.candidate_name || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Interviewer</span>
                  <span className="detail-item__value">{detailInterview.interviewer_name || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Position</span>
                  <span className="detail-item__value">{detailInterview.position_title || detailInterview.position || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Type</span>
                  <span className={`type-badge type-badge--${detailInterview.interview_type || "technical"}`}>
                    {typeLabels[detailInterview.interview_type] || "—"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Round</span>
                  <span className="detail-item__value">{detailInterview.round ?? "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Status</span>
                  <span className={`status-badge status-badge--${detailInterview.status || "pending"}`}>
                    {detailInterview.status || "pending"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Scheduled</span>
                  <span className="detail-item__value">
                    {detailInterview.scheduled_at
                      ? new Date(detailInterview.scheduled_at).toLocaleString()
                      : "Not set"}
                  </span>
                </div>
                {detailInterview.meet_link && (
                  <div className="detail-item">
                    <span className="detail-item__label">Meeting Link</span>
                    <a href={detailInterview.meet_link} target="_blank" rel="noopener noreferrer" className="detail-item__link">
                      {detailInterview.meet_link}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn--outline" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
