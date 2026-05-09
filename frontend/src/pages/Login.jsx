/**
 * Login.jsx
 * ---------
 * Login form page.
 * - Calls authService.loginUser() on submit
 * - Stores JWT via AuthContext.login()
 * - Redirects to /dashboard on success
 *
 * BACKEND INTEGRATION:
 *   The form submits { email, password } to POST /auth/login
 *   via the login() function in AuthContext.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

const Login = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // TODO (Backend): Calls POST /auth/login — see authService.js
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      // TODO (Backend): Map specific error codes (e.g., 401, 422) to user-friendly messages
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--auth">
      <div className="auth-card">
        <h1 className="auth-card__title">Welcome Back</h1>
        <p className="auth-card__subtitle">Sign in to your InterviewAI account</p>

        {error && <div className="alert alert--error" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          {/* TODO: Add "Forgot password?" link when endpoint is ready */}

          <button
            type="submit"
            id="login-submit-btn"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading ? <Loader message="" /> : "Sign In"}
          </button>
        </form>

        <p className="auth-card__footer">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-card__link">Sign up free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
