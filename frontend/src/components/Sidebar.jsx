/**
 * Sidebar.jsx
 * -----------
 * Left-side navigation for authenticated (dashboard) pages.
 * Shown alongside the main content area via DashboardLayout.
 */

import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdDescription,
  MdPerson,
  MdSmartToy,
} from "react-icons/md";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: <MdDashboard size={20} /> },
  { label: "Resume",    to: "/resume",    icon: <MdDescription size={20} /> },
  { label: "Profile",   to: "/profile",   icon: <MdPerson size={20} /> },
];

const Sidebar = () => {
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

export default Sidebar;
