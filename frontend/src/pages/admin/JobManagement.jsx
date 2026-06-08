/**
 * JobManagement.jsx
 * -----------------
 * Admin job positions management with add/edit modals.
 */

import { useState, useEffect, useCallback } from "react";
import { MdAdd, MdEdit, MdDelete, MdClose, MdWork } from "react-icons/md";
import { getJobs, createJob, updateJob, deleteJob } from "../../services/adminService";

const STATUS_TABS = ["all", "open", "closed"];

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    required_experience: 0,
    status: "open",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== "all") params.status = activeTab;
      const { data } = await getJobs(params);
      setJobs(data.jobs ?? data ?? []);
    } catch {
      setError("Failed to load job positions.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFormChange = (e) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: val }));
  };

  const openAddModal = () => {
    setEditingJob(null);
    setFormData({ title: "", description: "", required_experience: 0, status: "open" });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description || "",
      required_experience: job.required_experience || 0,
      status: job.status || "open",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      if (editingJob) {
        await updateJob(editingJob.id, formData);
      } else {
        await createJob(formData);
      }
      setShowModal(false);
      fetchJobs();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to save position.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete position "${job.title}"?`)) return;
    try {
      await deleteJob(job.id);
      fetchJobs();
    } catch {
      alert("Failed to delete position.");
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-header__title">Job Positions</h1>
          <p className="page-header__subtitle">Manage open positions</p>
        </div>
        <button className="btn btn--primary" onClick={openAddModal}>
          <MdAdd size={18} /> Add Position
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
          <span className="loader__message">Loading positions…</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <MdWork size={40} />
          <p>No positions found</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Experience (yrs)</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="data-table__cell--name">{job.title}</td>
                  <td style={{ maxWidth: "250px" }}>
                    <span className="text-truncate">
                      {job.description?.length > 80
                        ? job.description.slice(0, 80) + "…"
                        : job.description || "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{job.required_experience ?? "—"}</td>
                  <td>
                    <span className={`status-badge status-badge--${job.status === "open" ? "confirmed" : "cancelled"}`}>
                      {job.status || "open"}
                    </span>
                  </td>
                  <td>{job.created_at ? new Date(job.created_at).toLocaleDateString() : "—"}</td>
                  <td>
                    <div className="data-table__actions">
                      <button
                        className="action-btn action-btn--primary btn--sm"
                        onClick={() => openEditModal(job)}
                        title="Edit"
                      >
                        <MdEdit size={15} />
                      </button>
                      <button
                        className="action-btn action-btn--danger btn--sm"
                        onClick={() => handleDelete(job)}
                        title="Delete"
                      >
                        <MdDelete size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingJob ? "Edit Position" : "Add Position"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert--error">{formError}</div>}
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    name="title"
                    className="form-input"
                    value={formData.title}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-input form-textarea"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Required Experience (years)</label>
                  <input
                    name="required_experience"
                    type="number"
                    className="form-input"
                    value={formData.required_experience}
                    onChange={handleFormChange}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    className="form-input form-select"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={formLoading}>
                  {formLoading ? "Saving…" : editingJob ? "Save Changes" : "Create Position"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
