/**
 * Dashboard.jsx
 * -------------
 * Main authenticated dashboard page.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserResumes } from "../services/resumeService";
import Loader from "../components/Loader";
import {
  MdOutlineWavingHand,
  MdVideoLibrary,
  MdStarRate,
  MdDescription,
  MdCheckCircle,
  MdCalendarMonth,
} from "react-icons/md";

const Dashboard = () => {
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await getUserResumes();
        setSessions(data.items?.slice(0, 5) || []);
      } catch (err) {
        setError("Failed to load recent activity. Please refresh.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="page page--dashboard">
      {/* Welcome Header */}
      <div className="page-header">
        <h1 className="page-header__title">
          Welcome back, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="page-header__subtitle">
          Ready for your next interview practice session?
        </p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card__icon"><MdVideoLibrary size={28} /></span>
          <p className="stat-card__value">{sessions.length}</p>
          <p className="stat-card__label">Resumes Parsed</p>
        </div>
        <div className="stat-card">
          <span className="stat-card__icon"><MdStarRate size={28} /></span>
          <p className="stat-card__value">—</p>
          <p className="stat-card__label">Avg. Score</p>
        </div>
      </div>

      {/* Recent Sessions */}
      <section className="recent-sessions">
        <h2 className="section-title">Recent Sessions</h2>
        {loading && <Loader message="Loading sessions..." />}
        {error   && <p className="alert alert--error">{error}</p>}
        {!loading && !error && sessions.length === 0 && (
          <div className="empty-state">
            <p>No interview sessions yet.</p>
          </div>
        )}
        {!loading && sessions.length > 0 && (
          <ul className="sessions-list">
            {sessions.map((s) => (
              <li key={s.analysis_id} className="session-item">
                <MdDescription size={16} style={{ marginRight: "6px", color: "#6366f1", flexShrink: 0 }} />
                <span className="session-item__role">{s.file_name}</span>
                <span className="session-item__score">
                  <MdCheckCircle size={14} style={{ marginRight: "3px", color: "#22c55e" }} />
                  Parsed
                </span>
                <span className="session-item__date">
                  <MdCalendarMonth size={14} style={{ marginRight: "3px" }} />
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
