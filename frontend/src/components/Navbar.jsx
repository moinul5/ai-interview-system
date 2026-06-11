/**
 * Navbar.jsx
 * ----------
 * Top navigation bar — redesigned with glassmorphism + modern aesthetics.
 * - Transparent/frosted-glass when at top of page, opaque on scroll
 * - Shows public links when not authenticated
 * - Shows app links + logout when authenticated
 * - Highlights the active route
 */

import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import {
  MdDashboard,
  MdDescription,
  MdPerson,
  MdLogin,
  MdLogout,
  MdSmartToy,
  MdRocketLaunch,
  MdHome,
} from "react-icons/md";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
      {/* Brand / Logo */}
      <Link
        to={isAuthenticated ? "/dashboard" : "/"}
        className="navbar__brand"
      >
        <span className="navbar__brand-icon">
          <MdSmartToy size={20} />
        </span>
        <span className="navbar__brand-text">InterviewAI</span>
      </Link>

      {/* Navigation Links */}
      <ul className="navbar__links">
        {isAuthenticated ? (
          <>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "navbar__link navbar__link--active" : "navbar__link"
                }
              >
                <MdDashboard size={16} />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/resume"
                className={({ isActive }) =>
                  isActive ? "navbar__link navbar__link--active" : "navbar__link"
                }
              >
                <MdDescription size={16} />
                Resume
              </NavLink>
            </li>
            <li>
              <NotificationBell />
            </li>
            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? "navbar__link navbar__link--active" : "navbar__link"
                }
              >
                <span className="navbar__avatar">
                  {user?.name ? user.name[0].toUpperCase() : <MdPerson size={15} />}
                </span>
                {user?.name || "Profile"}
              </NavLink>
            </li>
            <li>
              <button
                className="navbar__btn navbar__btn--logout"
                onClick={handleLogout}
                id="navbar-logout-btn"
              >
                <MdLogout size={16} />
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? "navbar__link navbar__link--active" : "navbar__link"
                }
              >
                <MdHome size={16} />
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? "navbar__link navbar__link--active" : "navbar__link"
                }
              >
                <MdLogin size={16} />
                Login
              </NavLink>
            </li>
            <li>
              <NavLink to="/signup">
                <button className="navbar__btn navbar__btn--signup" id="navbar-signup-btn">
                  <MdRocketLaunch size={15} />
                  Get Started
                </button>
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
