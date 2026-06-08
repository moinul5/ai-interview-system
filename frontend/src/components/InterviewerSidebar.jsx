/**
 * InterviewerSidebar.jsx
 * ----------------------
 * Interviewer-specific sidebar navigation.
 * Same styling pattern as the main Sidebar component.
 */

import { NavLink } from "react-router-dom";
import { MdDashboard, MdSchedule, MdAssignment } from "react-icons/md";

const navItems = [
  { label: "Dashboard",          to: "/interviewer/dashboard",    icon: <MdDashboard size={20} /> },
  { label: "My Availability",    to: "/interviewer/availability", icon: <MdSchedule size={20} /> },
  { label: "Interview Requests", to: "/interviewer/requests",     icon: <MdAssignment size={20} /> },
];

const InterviewerSidebar = () => {
  return (
    <aside className="sidebar">
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

export default InterviewerSidebar;
