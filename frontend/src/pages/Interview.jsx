/**
 * Interview.jsx
 * -------------
 * Interview Hub — landing page where user picks interview type.
 * Types: Text MCQ, Voice-based, Video (coming soon)
 *
 * Route: /interview
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MODES = [
  {
    id: "text",
    icon: "📝",
    label: "Text MCQ Interview",
    desc: "Answer multiple-choice questions. Each question has 4 options (A/B/C/D). Timer-based. Results shown instantly.",
    badge: "Available",
    badgeClass: "iv-badge--green",
    route: "/interview/text",
    accent: "#4f46e5",
    bg: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
  },
  {
    id: "ai",
    icon: "🤖",
    label: "AI Interview",
    desc: "Get a personalized interview based on your role and skills. AI generates questions, evaluates your written answers, and recommends courses.",
    badge: "AI Powered",
    badgeClass: "iv-badge--purple",
    route: "/interview/ai",
    accent: "#7c3aed",
    bg: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)",
  },
  {
    id: "voice",
    icon: "🎙️",
    label: "Voice-Based Interview",
    desc: "Listen to open-ended questions and record your answers using your microphone. AI evaluates your spoken response.",
    badge: "Available",
    badgeClass: "iv-badge--green",
    route: "/interview/voice",
    accent: "#0ea5e9",
    bg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
  },
  {
    id: "video",
    icon: "🎥",
    label: "Video Interview",
    desc: "Face-to-face AI video interview with real-time facial analysis and posture feedback. Full simulation mode.",
    badge: "Coming Soon",
    badgeClass: "iv-badge--gray",
    route: null,
    accent: "#8b5cf6",
    bg: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
  },
];

const Interview = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  return (
    <div className="page iv-hub-page">
      <div className="page-header">
        <h1 className="page-header__title">🎯 Interview Practice</h1>
        <p className="page-header__subtitle">
          Choose your interview mode, {user?.name?.split(" ")[0] || "there"}. Each mode tests you differently.
        </p>
      </div>

      <div className="iv-mode-grid">
        {MODES.map((mode) => (
          <div
            key={mode.id}
            className={`iv-mode-card${mode.route ? " iv-mode-card--clickable" : " iv-mode-card--disabled"}`}
            style={{ background: mode.bg }}
            onClick={() => mode.route && navigate(mode.route)}
            role={mode.route ? "button" : undefined}
            tabIndex={mode.route ? 0 : undefined}
            onKeyDown={e => { if (e.key === "Enter" && mode.route) navigate(mode.route); }}
          >
            <div className="iv-mode-card__top">
              <span className="iv-mode-card__icon">{mode.icon}</span>
              <span className={`iv-badge ${mode.badgeClass}`}>{mode.badge}</span>
            </div>
            <h2 className="iv-mode-card__title" style={{ color: mode.accent }}>{mode.label}</h2>
            <p className="iv-mode-card__desc">{mode.desc}</p>
            {mode.route && (
              <div className="iv-mode-card__cta">
                Start Now <span>→</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="iv-how">
        <h2 className="section-title">How It Works</h2>
        <div className="iv-steps-row">
          {[
            { n: "1", label: "Pick a Mode", desc: "Choose Text MCQ or Voice based on your preference" },
            { n: "2", label: "Answer Questions", desc: "Questions come from our database, matched to your level" },
            { n: "3", label: "Get AI Feedback", desc: "Your answers are scored and feedback is provided instantly" },
            { n: "4", label: "Track Progress", desc: "View your session history on the Dashboard" },
          ].map(s => (
            <div key={s.n} className="iv-step">
              <div className="iv-step__num">{s.n}</div>
              <p className="iv-step__label">{s.label}</p>
              <p className="iv-step__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Interview;
