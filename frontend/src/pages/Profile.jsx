/**
 * Profile.jsx
 * -----------
 * Candidate profile page.
 * Fetches the most recent resume analysis from the backend and displays:
 *   - ATS Score
 *   - Extracted skills (Missing Skills from AI analysis)
 *   - Strengths & Weaknesses
 *   - Suggestions
 *   - Full resume list with links to details
 *
 * BACKEND: GET /resume/analyses  →  GET /resume/analyses/:id
 * TODO (Future): Replace with GET /users/me once auth + user profile endpoint is built
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserResumes, getParsedResume } from "../services/resumeService";
import Loader from "../components/Loader";

/* ── helpers ── */
const Badge = ({ label, color = "blue" }) => (
  <span className={`profile-badge profile-badge--${color}`}>{label}</span>
);

const Section = ({ title, icon, children }) => (
  <div className="profile-section">
    <h2 className="profile-section__title">
      <span className="profile-section__icon">{icon}</span> {title}
    </h2>
    <div className="profile-section__body">{children}</div>
  </div>
);

const ScoreRing = ({ score }) => {
  // score is a string like "85/100" or a number
  const num = parseInt(String(score).split("/")[0]) || 0;
  const pct = Math.min(100, Math.max(0, num));
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="score-ring" title={`ATS Score: ${score}`}>
      <svg viewBox="0 0 36 36" className="score-ring__svg">
        <path
          className="score-ring__bg"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className="score-ring__fill"
          strokeDasharray={`${pct}, 100`}
          style={{ stroke: color }}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="score-ring__label">
        <span className="score-ring__value">{num}</span>
        <span className="score-ring__sub">/ 100</span>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const Profile = () => {
  const { user } = useAuth();

  const [resumes, setResumes]         = useState([]);
  const [selected, setSelected]       = useState(null); // full analysis object
  const [selectedId, setSelectedId]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError]             = useState("");

  /* ── 1. Load resume list ── */
  useEffect(() => {
    const load = async () => {
      try {
        // GET /resume/analyses
        const data = await getUserResumes();
        const items = data.items || [];
        setResumes(items);
        // Auto-select the most recent one
        if (items.length > 0) {
          fetchDetail(items[0].analysis_id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError("Could not load resume analyses. Make sure the backend is running.");
        setLoading(false);
        console.error(err);
      }
    };
    load();
  }, []);

  /* ── 2. Load detail for a specific analysis ── */
  const fetchDetail = async (id) => {
    setSelectedId(id);
    setDetailLoading(true);
    setError("");
    try {
      // GET /resume/analyses/:id
      const data = await getParsedResume(id);
      setSelected(data);
    } catch (err) {
      setError("Failed to load analysis details.");
      console.error(err);
    } finally {
      setDetailLoading(false);
      setLoading(false);
    }
  };

  /* ── Derived AI data ── */
  const ai       = selected?.ai_analysis || {};
  const skills   = ai["Missing Skills"]  || [];
  const strengths    = ai["Strengths"]   || [];
  const weaknesses   = ai["Weaknesses"]  || [];
  const suggestions  = ai["Suggestions"] || [];
  const atsScore     = ai["ATS Score"]   || "N/A";

  /* ── Render ── */
  if (loading) return <Loader fullScreen message="Loading your profile..." />;

  return (
    <div className="page page--profile-v2">

      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-header__title">My Profile</h1>
        <p className="page-header__subtitle">
          Based on your most recently uploaded resume analysis
        </p>
      </div>

      {error && <p className="alert alert--error">{error}</p>}

      {resumes.length === 0 && !error && (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          <p>📭 No resume analyses found yet.</p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
            Go to the <strong>Resume</strong> page, upload a PDF or DOCX, and your profile will populate here automatically.
          </p>
        </div>
      )}

      {resumes.length > 0 && (
        <div className="profile-v2-layout">

          {/* ── LEFT: Resume Selector + ATS Score ── */}
          <aside className="profile-v2-sidebar">
            {/* Avatar / Identity */}
            <div className="profile-identity">
              <div className="profile-avatar">
                <span>{(user?.full_name || "U").charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="profile-identity__name">{user?.full_name || "Candidate"}</h3>
              <p className="profile-identity__email">{user?.email || ""}</p>
            </div>

            {/* ATS Score Ring */}
            {selected && (
              <div className="profile-ats">
                <p className="profile-ats__label">ATS Score</p>
                <ScoreRing score={atsScore} />
                <p className="profile-ats__hint">From your latest resume scan</p>
              </div>
            )}

            {/* Resume selector */}
            <div className="profile-resume-selector">
              <p className="profile-resume-selector__label">Select Resume Analysis</p>
              <ul className="profile-resume-list">
                {resumes.map((r) => (
                  <li
                    key={r.analysis_id}
                    className={`profile-resume-item ${selectedId === r.analysis_id ? "profile-resume-item--active" : ""}`}
                    onClick={() => fetchDetail(r.analysis_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && fetchDetail(r.analysis_id)}
                  >
                    <span className="profile-resume-item__icon">📄</span>
                    <div>
                      <p className="profile-resume-item__name">{r.file_name}</p>
                      <p className="profile-resume-item__date">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── RIGHT: Analysis Details ── */}
          <div className="profile-v2-main">
            {detailLoading && <Loader message="Loading analysis..." />}

            {!detailLoading && selected && (
              <>
                {/* File Info */}
                <div className="profile-file-info">
                  <span className="profile-file-info__icon">📋</span>
                  <div>
                    <p className="profile-file-info__name">{selected.file_name}</p>
                    <p className="profile-file-info__date">
                      Analyzed on {new Date(selected.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Skills Extracted (Missing Skills from AI) */}
                <Section title="Skills to Add" icon="🛠️">
                  {skills.length > 0 ? (
                    <div className="badge-group">
                      {skills.map((s, i) => (
                        <Badge key={i} label={s} color="purple" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No missing skills identified.</p>
                  )}
                </Section>

                {/* Strengths */}
                <Section title="Strengths" icon="💪">
                  <ul className="profile-list profile-list--success">
                    {strengths.length > 0
                      ? strengths.map((s, i) => <li key={i}>{s}</li>)
                      : <li className="text-muted">No strengths listed.</li>
                    }
                  </ul>
                </Section>

                {/* Weaknesses */}
                <Section title="Weaknesses" icon="⚠️">
                  <ul className="profile-list profile-list--warning">
                    {weaknesses.length > 0
                      ? weaknesses.map((w, i) => <li key={i}>{w}</li>)
                      : <li className="text-muted">No weaknesses listed.</li>
                    }
                  </ul>
                </Section>

                {/* Suggestions */}
                <Section title="AI Suggestions" icon="💡">
                  <ul className="profile-list profile-list--info">
                    {suggestions.length > 0
                      ? suggestions.map((s, i) => <li key={i}>{s}</li>)
                      : <li className="text-muted">No suggestions available.</li>
                    }
                  </ul>
                </Section>

                {/* Extracted Text preview */}
                {selected.extracted_text && (
                  <Section title="Extracted Resume Text" icon="📝">
                    <details className="resume-text-preview">
                      <summary>Click to expand raw extracted text</summary>
                      <pre className="resume-text-preview__content">
                        {selected.extracted_text}
                      </pre>
                    </details>
                  </Section>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
