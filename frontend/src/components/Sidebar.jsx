import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdDescription,
  MdEditDocument,
  MdPerson,
  MdMic,
} from "react-icons/md";

const navItems = [
  { label: "Dashboard",       to: "/dashboard",      icon: <MdDashboard size={20} /> },
  { label: "Resume Analysis", to: "/resume",         icon: <MdDescription size={20} /> },
  { label: "Resume Builder",  to: "/resume-builder", icon: <MdEditDocument size={20} /> },
  { label: "Interview",       to: "/interview",      icon: <MdMic size={20} /> },
  { label: "Profile",         to: "/profile",        icon: <MdPerson size={20} /> },
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
