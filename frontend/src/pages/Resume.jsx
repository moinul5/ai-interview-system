/**
 * Resume.jsx
 * ----------
 * Resume management page.
 * - Allows users to upload a new resume
 * - Lists previously uploaded resumes
 * - Allows deletion of resumes
 */

import { useState, useEffect } from "react";
import { getUserResumes, deleteResume } from "../services/resumeService";
import ResumeUpload from "../components/ResumeUpload";
import Loader from "../components/Loader";
import {
  MdDescription,
  MdDeleteOutline,
  MdCalendarMonth,
  MdInbox,
  MdWarningAmber,
} from "react-icons/md";

const Resume = () => {
  const [resumes, setResumes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [deleting, setDeleting] = useState(null);

  // ─── Fetch Resumes ──────────────────────────────────────────────────────────
  const fetchResumes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUserResumes();
      setResumes(data.items || []);
    } catch (err) {
      setError("Failed to load resumes. Please refresh.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResumes(); }, []);

  // ─── Handle Delete ──────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    setDeleting(id);
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.analysis_id !== id));
    } catch (err) {
      setError("Failed to delete resume.");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  // ─── Handle Upload Success ──────────────────────────────────────────────────
  const handleUploadSuccess = () => {
    fetchResumes();
  };

  return (
    <div className="page page--resume">
      <div className="page-header">
        <h1 className="page-header__title">
          <MdDescription size={28} style={{ verticalAlign: "middle", marginRight: "8px", color: "#6366f1" }} />
          My Resumes
        </h1>
        <p className="page-header__subtitle">Upload and manage your resumes for AI-powered interview practice.</p>
      </div>

      {/* Upload Section */}
      <section className="section">
        <h2 className="section-title">Upload a New Resume</h2>
        <ResumeUpload onUploadSuccess={handleUploadSuccess} />
      </section>

      {/* Resume List */}
      <section className="section">
        <h2 className="section-title">Uploaded Resumes</h2>

        {loading && <Loader message="Loading resumes..." />}

        {error && (
          <p className="alert alert--error">
            <MdWarningAmber size={16} style={{ verticalAlign: "middle", marginRight: "4px" }} />
            {error}
          </p>
        )}

        {!loading && !error && resumes.length === 0 && (
          <div className="empty-state">
            <MdInbox size={40} style={{ color: "#94a3b8", marginBottom: "8px" }} />
            <p>No resumes uploaded yet. Upload your first one above!</p>
          </div>
        )}

        {!loading && resumes.length > 0 && (
          <ul className="resume-list">
            {resumes.map((resume) => (
              <li key={resume.analysis_id} className="resume-item">
                <div className="resume-item__info">
                  <MdDescription size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
                  <span className="resume-item__name">{resume.file_name}</span>
                  <span className="resume-item__date">
                    <MdCalendarMonth size={13} style={{ verticalAlign: "middle", marginRight: "3px" }} />
                    {new Date(resume.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => handleDelete(resume.analysis_id)}
                  disabled={deleting === resume.analysis_id}
                  aria-label={`Delete ${resume.file_name}`}
                >
                  <MdDeleteOutline size={16} style={{ verticalAlign: "middle", marginRight: "3px" }} />
                  {deleting === resume.analysis_id ? "Deleting..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Resume;
