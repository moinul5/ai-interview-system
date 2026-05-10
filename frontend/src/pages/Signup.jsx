import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import Loader from "../components/Loader";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email:     "",
    password:  "",
    confirm_password: "",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      // TODO (Backend): POST /auth/register
      // Send: { full_name, email, password }
      // confirm_password is only for client-side validation, NOT sent to backend
      await registerUser({
        full_name: formData.full_name,
        email:     formData.email,
        password:  formData.password,
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      // TODO (Backend): Handle 409 Conflict (email already exists), etc.
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--auth">
      <div className="auth-card">
        <h1 className="auth-card__title">Create an Account</h1>
        <p className="auth-card__subtitle">Start your interview prep journey today</p>

        {error && <div className="alert alert--error" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="full_name" className="form-label">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              className="form-input"
              placeholder="Jane Doe"
              value={formData.full_name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

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
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password" className="form-label">Confirm Password</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              className="form-input"
              placeholder="Repeat your password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            id="signup-submit-btn"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading ? <Loader message="" /> : "Create Account"}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
