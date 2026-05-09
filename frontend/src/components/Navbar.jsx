/**
 * Navbar.jsx
 * ----------
 * Top navigation bar.
 * - Shows public links when not authenticated
 * - Shows app links + logout when authenticated
 * - Highlights the active route
 */

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Brand / Logo */}
      <Link to="/" className="navbar__brand">
        🎯 InterviewAI
      </Link>

      {/* Navigation Links */}
      <ul className="navbar__links">
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? "navbar__link navbar__link--active" : "navbar__link"}>
            Home
          </NavLink>
        </li>

        {isAuthenticated ? (
          <>
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "navbar__link navbar__link--active" : "navbar__link"}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/resume" className={({ isActive }) => isActive ? "navbar__link navbar__link--active" : "navbar__link"}>
                Resume
              </NavLink>
            </li>
            <li>
              <NavLink to="/profile" className={({ isActive }) => isActive ? "navbar__link navbar__link--active" : "navbar__link"}>
                {/* TODO (Backend): Replace with user.full_name from API */}
                {user?.full_name || "Profile"}
              </NavLink>
            </li>
            <li>
              <button className="navbar__btn navbar__btn--logout" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login" className={({ isActive }) => isActive ? "navbar__link navbar__link--active" : "navbar__link"}>
                Login
              </NavLink>
            </li>
            <li>
              <NavLink to="/signup" className={({ isActive }) => isActive ? "navbar__link navbar__link--active" : "navbar__link"}>
                <button className="navbar__btn navbar__btn--signup">Get Started</button>
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
