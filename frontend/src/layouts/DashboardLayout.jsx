/**
 * DashboardLayout.jsx
 * -------------------
 * Layout wrapper for authenticated pages (Dashboard, Resume, Profile).
 * Includes Sidebar on the left and renders child routes via <Outlet>.
 */

import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-layout__body">
        <Sidebar />
        <main className="dashboard-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
