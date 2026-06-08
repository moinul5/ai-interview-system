/**
 * AdminDashboard.jsx
 * ------------------
 * Admin overview page with stats cards, recent interviews table,
 * and quick action buttons.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdPeople,
  MdVideoCall,
  MdTrendingUp,
  MdWork,
  MdAdd,
  MdPersonAdd,
  MdPostAdd,
} from "react-icons/md";
import { getAnalytics, getAdminInterviews } from "../../services/adminService";

const statusColors = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
  missed: "missed",
};

const typeLabels = {
  technical: "Technical",
  hr: "HR",
  behavioral: "Behavioral",
  final: "Final",
  coding: "Coding",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, interviewsRes] = await Promise.all([
          getAnalytics(),
          getAdminInterviews({ limit: 10, sort: "-created_at" }),
        ]);
        setAnalytics(analyticsRes.data);
        setRecentInterviews(interviewsRes.data.interviews ?? interviewsRes.data ?? []);
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="loader">
          <div className="loader__spinner" />
          <span className="loader__message">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert--error">{error}</div>
      </div>
    );
  }

  const stats = [
    {
      icon: <MdPeople size={28} />,
      value: analytics?.total_users ?? 0,
      label: "Total Users",
      gradient: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    },
    {
      icon: <MdVideoCall size={28} />,
      value: analytics?.active_interviews ?? 0,
      label: "Active Interviews",
      gradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    },
    {
      icon: <MdTrendingUp size={28} />,
      value: analytics?.completion_rate != null ? `${analytics.completion_rate}%` : "—",
      label: "Completion Rate",
      gradient: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
    },
    {
      icon: <MdWork size={28} />,
      value: analytics?.open_positions ?? 0,
      label: "Open Positions",
      gradient: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
    },
  ];

  return (
    <div className="page admin-dashboard">
      <div className="page-header">
        <h1 className="page-header__title">Admin Dashboard</h1>
        <p className="page-header__subtitle">Overview of your interview system</p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="admin-stat-card"
            style={{ background: stat.gradient }}
          >
            <div className="admin-stat-card__icon">{stat.icon}</div>
            <div className="admin-stat-card__value">{stat.value}</div>
            <div className="admin-stat-card__label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="admin-dashboard__actions">
        <button
          className="action-btn action-btn--primary"
          onClick={() => navigate("/admin/interviews")}
        >
          <MdAdd size={18} /> Create Interview
        </button>
        <button
          className="action-btn action-btn--success"
          onClick={() => navigate("/admin/users")}
        >
          <MdPersonAdd size={18} /> Add User
        </button>
        <button
          className="action-btn action-btn--warning"
          onClick={() => navigate("/admin/jobs")}
        >
          <MdPostAdd size={18} /> New Position
        </button>
      </div>

      {/* Recent Interviews Table */}
      <div className="section">
        <h2 className="section-title">Recent Interviews</h2>
        {recentInterviews.length === 0 ? (
          <div className="empty-state">
            <MdVideoCall size={40} />
            <p>No interviews yet</p>
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
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentInterviews.map((interview) => (
                  <tr key={interview.id}>
                    <td>{interview.candidate_name || "—"}</td>
                    <td>{interview.interviewer_name || "—"}</td>
                    <td>{interview.position_title || interview.position || "—"}</td>
                    <td>
                      <span className={`type-badge type-badge--${interview.interview_type || "technical"}`}>
                        {typeLabels[interview.interview_type] || interview.interview_type || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${statusColors[interview.status] || "pending"}`}>
                        {interview.status || "pending"}
                      </span>
                    </td>
                    <td>
                      {interview.scheduled_at
                        ? new Date(interview.scheduled_at).toLocaleDateString()
                        : "Not scheduled"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
