/**
 * Sidebar.jsx
 * -----------
 * Left-side navigation for authenticated (dashboard) pages.
 * Shown alongside the main content area via DashboardLayout.
 */

import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard",  to: "/dashboard", icon: "🏠" },
  { label: "Resume",     to: "/resume",    icon: "📄" },
  { label: "Profile",    to: "/profile",   icon: "👤" },
  // TODO: Add more sections (e.g., /interview, /analytics) when pages are built
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">🎯 InterviewAI</div>

      <nav className="sidebar__nav">
        <ul className="sidebar__list">
          {navItems.map(({ label, to, icon }) => (
            <li key={to} className="sidebar__item">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
                }
              >
                <span className="sidebar__icon">{icon}</span>
                <span className="sidebar__label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
