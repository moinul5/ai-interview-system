/**
 * Login.jsx
 * ---------
 * Premium login page.
 * - Calls POST /auth/login via AuthContext.login()
 * - Shows toast-style success from registration redirect
 * - Redirects to /dashboard on success
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Show success banner if redirected after registration
  useEffect(() => {
    if (location.state?.registered) {
      setSuccess("Account created! Please sign in.");
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-panel auth-panel--left" aria-hidden="true">
        <div className="auth-panel__bg" />
        <div className="auth-panel__content">
          <div className="auth-panel__logo">
            <span className="auth-panel__logo-icon">🤖</span>
            <span className="auth-panel__logo-text">InterviewAI</span>
          </div>
          <h2 className="auth-panel__headline">
            Ace your next<br />interview with AI
          </h2>
          <p className="auth-panel__sub">
            Practice with real questions, get instant feedback, and land your dream job.
          </p>
          <ul className="auth-panel__features">
            {["AI-powered mock interviews", "Resume ATS scoring", "Personalised feedback", "Track your progress"].map((f) => (
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

          <h1 className="auth-form-wrap__title">Welcome back</h1>
          <p className="auth-form-wrap__sub">Sign in to your account to continue</p>

          {success && (
            <div className="auth-alert auth-alert--success" role="alert">
              <span>✓</span> {success}
            </div>
          )}
          {error && (
            <div className="auth-alert auth-alert--error" role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          <form className="auth-form-fields" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="auth-field">
              <label htmlFor="login-email" className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉</span>
                <input
                  id="login-email"
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
              <div className="auth-label-row">
                <label htmlFor="login-password" className="auth-label">Password</label>
              </div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="login-password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  className="auth-input auth-input--with-toggle"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <p className="auth-form-wrap__footer">
            Don't have an account?{" "}
            <Link to="/signup" className="auth-link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
