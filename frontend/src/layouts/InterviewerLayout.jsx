/**
 * InterviewerLayout.jsx
 * ---------------------
 * Layout for interviewer pages — same structure as DashboardLayout
 * but uses InterviewerSidebar instead.
 */

import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import InterviewerSidebar from "../components/InterviewerSidebar";

export default function InterviewerLayout() {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-layout__body">
        <InterviewerSidebar />
        <main className="dashboard-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
