/**
 * AdminSidebar.jsx
 * ----------------
 * Admin-specific sidebar navigation.
 * Same styling pattern as the main Sidebar component.
 */

import { NavLink } from "react-router-dom";
import { MdDashboard, MdPeople, MdVideoCall, MdWork } from "react-icons/md";

const navItems = [
  { label: "Dashboard",       to: "/admin/dashboard",  icon: <MdDashboard size={20} /> },
  { label: "User Management", to: "/admin/users",       icon: <MdPeople size={20} /> },
  { label: "Interviews",      to: "/admin/interviews",  icon: <MdVideoCall size={20} /> },
  { label: "Job Positions",   to: "/admin/jobs",        icon: <MdWork size={20} /> },
];

const AdminSidebar = () => {
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

export default AdminSidebar;
