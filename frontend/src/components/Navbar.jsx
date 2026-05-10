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
import {
  MdHome,
  MdDashboard,
  MdDescription,
  MdPerson,
  MdLogin,
  MdLogout,
  MdSmartToy,
  MdRocketLaunch,
} from "react-icons/md";

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
      <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar__brand">
        <MdSmartToy size={22} />
        InterviewAI
      </Link>

      {/* Navigation Links */}
      <ul className="navbar__links">
        {isAuthenticated ? (
          <>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive
                    ? "navbar__link navbar__link--active"
                    : "navbar__link"
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
                  isActive
                    ? "navbar__link navbar__link--active"
                    : "navbar__link"
                }
              >
                <MdDescription size={16} />
                Resume
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive
                    ? "navbar__link navbar__link--active"
                    : "navbar__link"
                }
              >
                <MdPerson size={16} />
                {user?.full_name || "Profile"}
              </NavLink>
            </li>
            <li>
              <button
                className="navbar__btn navbar__btn--logout"
                onClick={handleLogout}
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
                  isActive
                    ? "navbar__link navbar__link--active"
                    : "navbar__link"
                }
              >
                <MdLogin size={16} />
                Login
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  isActive
                    ? "navbar__link navbar__link--active"
                    : "navbar__link"
                }
              >
                <button className="navbar__btn navbar__btn--signup">
                  <MdRocketLaunch size={16} />
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
