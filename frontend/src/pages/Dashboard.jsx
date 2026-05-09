/**
 * Dashboard.jsx
 * -------------
 * Main authenticated dashboard page.
 * Shows a summary/overview of the user's activity.
 *
 * BACKEND INTEGRATION:
 *   - Fetches user stats (sessions, scores, etc.) from GET /interviews/sessions
 *   - Fetches user info from AuthContext (populated from GET /auth/me)
 *   - Replace the placeholder stat cards with real API data when ready
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getInterviewSessions } from "../services/interviewService";
import Loader from "../components/Loader";

const Dashboard = () => {
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // TODO (Backend): GET /interviews/sessions — list past interview sessions
        const data = await getInterviewSessions();
        setSessions(data);
      } catch (err) {
        // TODO (Backend): Handle specific error codes if needed
        setError("Failed to load sessions. Please refresh.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  return (
    <div className="page page--dashboard">
      {/* Welcome Header */}
      <div className="page-header">
        <h1 className="page-header__title">
          Welcome back, {user?.full_name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="page-header__subtitle">
          Ready for your next interview practice session?
        </p>
      </div>

      {/* Stats Overview */}
      {/* TODO (Backend): Populate these from real API data */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card__icon">🎯</span>
          <p className="stat-card__value">{sessions.length}</p>
          <p className="stat-card__label">Sessions Completed</p>
        </div>
        <div className="stat-card">
          <span className="stat-card__icon">⭐</span>
          <p className="stat-card__value">—</p>
          <p className="stat-card__label">Avg. Score</p>
          {/* TODO (Backend): Calculate from sessions[].score */}
        </div>
        <div className="stat-card">
          <span className="stat-card__icon">📄</span>
          <p className="stat-card__value">—</p>
          <p className="stat-card__label">Resumes Uploaded</p>
          {/* TODO (Backend): Fetch from GET /resumes and show count */}
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
            {/* TODO: Add a "Start Interview" button once the interview page is built */}
          </div>
        )}
        {!loading && sessions.length > 0 && (
          <ul className="sessions-list">
            {sessions.map((s) => (
              <li key={s.session_id} className="session-item">
                {/* TODO (Backend): Adjust field names from your API response */}
                <span className="session-item__role">{s.job_role}</span>
                <span className="session-item__score">Score: {s.score ?? "N/A"}</span>
                <span className="session-item__date">{new Date(s.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
