/**
 * AdminLayout.jsx
 * ---------------
 * Layout for admin pages — same structure as DashboardLayout
 * but uses AdminSidebar instead.
 */

import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-layout__body">
        <AdminSidebar />
        <main className="dashboard-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
