/**
 * Resume.jsx
 * ----------
 * Resume management page.
 * - Allows users to upload a new resume
 * - Lists previously uploaded resumes
 * - Allows deletion of resumes
 *
 * BACKEND INTEGRATION:
 *   - GET /resumes — fetch uploaded resumes list
 *   - POST /resumes/upload — upload new resume (via ResumeUpload component)
 *   - DELETE /resumes/:id — delete a resume
 */

import { useState, useEffect } from "react";
import { getUserResumes, deleteResume } from "../services/resumeService";
import ResumeUpload from "../components/ResumeUpload";
import Loader from "../components/Loader";

const Resume = () => {
  const [resumes, setResumes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [deleting, setDeleting] = useState(null); // ID of resume being deleted

  // ─── Fetch Resumes ──────────────────────────────────────────────────────────
  const fetchResumes = async () => {
    setLoading(true);
    setError("");
    try {
      // TODO (Backend): GET /resumes — returns array of resume objects
      const data = await getUserResumes();
      setResumes(data);
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
      // TODO (Backend): DELETE /resumes/:id
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError("Failed to delete resume.");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  // ─── Handle Upload Success ──────────────────────────────────────────────────
  const handleUploadSuccess = (newResume) => {
    // TODO (Backend): Append the newly uploaded resume to the list
    // Adjust based on your API response shape
    setResumes((prev) => [newResume, ...prev]);
  };

  return (
    <div className="page page--resume">
      <div className="page-header">
        <h1 className="page-header__title">My Resumes</h1>
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
        {error   && <p className="alert alert--error">{error}</p>}

        {!loading && !error && resumes.length === 0 && (
          <div className="empty-state">
            <p>No resumes uploaded yet. Upload your first one above!</p>
          </div>
        )}

        {!loading && resumes.length > 0 && (
          <ul className="resume-list">
            {resumes.map((resume) => (
              <li key={resume.id} className="resume-item">
                {/* TODO (Backend): Adjust field names from your API response */}
                <div className="resume-item__info">
                  <span className="resume-item__name">📄 {resume.filename}</span>
                  <span className="resume-item__date">
                    {new Date(resume.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => handleDelete(resume.id)}
                  disabled={deleting === resume.id}
                  aria-label={`Delete ${resume.filename}`}
                >
                  {deleting === resume.id ? "Deleting..." : "Delete"}
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
