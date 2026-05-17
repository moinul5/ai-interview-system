/**
 * Signup.jsx
 * ----------
 * Premium registration page.
 * - Uses `name` field (matching DB column)
 * - Allows role selection: candidate | interviewer
 * - Calls POST /auth/register via authService
 * - Redirects to /login with success state on completion
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

const ROLES = [
  { value: "candidate",   label: "Candidate",   icon: "🎯", desc: "Looking for a job" },
  { value: "interviewer", label: "Interviewer",  icon: "💼", desc: "Conducting interviews" },
];

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name:             "",
    email:            "",
    password:         "",
    confirm_password: "",
    role:             "candidate",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name:     formData.name,
        email:    formData.email,
        password: formData.password,
        role:     formData.role,
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const strength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"][strength];

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-panel auth-panel--left" aria-hidden="true">
        <div className="auth-panel__bg" />
        <div className="auth-panel__content">
          <div className="auth-panel__logo">
            <span className="auth-panel__logo-icon">🤖</span>
            <span className="auth-panel__logo-text">InterviewAI</span>
          </div>
          <h2 className="auth-panel__headline">
            Start your journey<br />to career success
          </h2>
          <p className="auth-panel__sub">
            Join thousands of candidates who landed jobs with AI-powered interview prep.
          </p>
          <ul className="auth-panel__features">
            {["Free to get started", "AI mock interviews", "Resume ATS analysis", "Real-time feedback"].map((f) => (
              <li key={f} className="auth-panel__feature">
                <span className="auth-panel__check">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel auth-panel--right">
        <div className="auth-form-wrap">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <span>🤖</span> InterviewAI
          </div>

          <h1 className="auth-form-wrap__title">Create your account</h1>
          <p className="auth-form-wrap__sub">Free forever · No credit card required</p>

          {error && (
            <div className="auth-alert auth-alert--error" role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Role selector */}
          <div className="auth-role-selector">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`auth-role-btn${formData.role === r.value ? " auth-role-btn--active" : ""}`}
                onClick={() => handleRoleSelect(r.value)}
              >
                <span className="auth-role-btn__icon">{r.icon}</span>
                <span className="auth-role-btn__label">{r.label}</span>
                <span className="auth-role-btn__desc">{r.desc}</span>
              </button>
            ))}
          </div>

          <form className="auth-form-fields" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="auth-field">
              <label htmlFor="signup-name" className="auth-label">Full Name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  className="auth-input"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="signup-email" className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉</span>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="signup-password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="signup-password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  className="auth-input auth-input--with-toggle"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button type="button" className="auth-input-toggle" onClick={() => setShowPass(v => !v)}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
              {formData.password && (
                <div className="auth-strength">
                  <div className="auth-strength__bar">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="auth-strength__seg"
                        style={{ background: i <= strength ? strengthColor : "var(--color-border)" }}
                      />
                    ))}
                  </div>
                  <span className="auth-strength__label" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label htmlFor="signup-confirm" className="auth-label">Confirm Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="signup-confirm"
                  name="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  className={`auth-input auth-input--with-toggle${
                    formData.confirm_password && formData.confirm_password !== formData.password
                      ? " auth-input--error"
                      : ""
                  }`}
                  placeholder="Repeat your password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button type="button" className="auth-input-toggle" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? "🙈" : "👁"}
                </button>
              </div>
              {formData.confirm_password && formData.confirm_password !== formData.password && (
                <p className="auth-field-error">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              id="signup-submit-btn"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? <span className="auth-spinner" /> : "Create Account →"}
            </button>
          </form>

          <p className="auth-form-wrap__footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
