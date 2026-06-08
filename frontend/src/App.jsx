/**
 * App.jsx
 * -------
 * Root application component.
 * Route structure:
 *   - / (Home)            → PublicLayout (Navbar + Footer), GuestRoute
 *   - /login, /signup     → Standalone (no Navbar), GuestRoute
 *   - /dashboard, etc.    → ProtectedRoute → DashboardLayout
 *   - * 404               → NotFound
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// ─── Layouts ─────────────────────────────────────────────────────────────────
import PublicLayout    from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// ─── Route Guards ─────────────────────────────────────────────────────────────
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute     from "./routes/GuestRoute";

// ─── Pages ───────────────────────────────────────────────────────────────────
import Home      from "./pages/Home";
import Login     from "./pages/Login";
import Signup    from "./pages/Signup";
import Dashboard      from "./pages/Dashboard";
import Resume         from "./pages/Resume";
import ResumeBuilder  from "./pages/ResumeBuilder";
import Interview      from "./pages/Interview";
import InterviewText  from "./pages/InterviewText";
import InterviewVoice from "./pages/InterviewVoice";
import InterviewAI    from "./pages/InterviewAI";
import InterviewVideo from "./pages/InterviewVideo";
import InterviewHistory from "./pages/InterviewHistory";
import Pricing        from "./pages/Pricing";
import Profile        from "./pages/Profile";
import NotFound       from "./pages/NotFound";

// ─── Human Interview Scheduling System ───────────────────────────────────────
import RoleRoute from "./routes/RoleRoute";
import AdminLayout from "./layouts/AdminLayout";
import InterviewerLayout from "./layouts/InterviewerLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import InterviewManagement from "./pages/admin/InterviewManagement";
import JobManagement from "./pages/admin/JobManagement";
import CandidateInterviews from "./pages/candidate/CandidateInterviews";
import SlotSelection from "./pages/candidate/SlotSelection";
import InterviewerDashboard from "./pages/interviewer/InterviewerDashboard";
import AvailabilityManager from "./pages/interviewer/AvailabilityManager";
import InterviewRequests from "./pages/interviewer/InterviewRequests";
import FeedbackForm from "./pages/interviewer/FeedbackForm";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Home (public, with Navbar + Footer) ──────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route element={<GuestRoute />}>
              <Route path="/" element={<Home />} />
            </Route>
          </Route>

          {/* ── Auth pages (standalone — full-page split layout, no Navbar) ─ */}
          <Route element={<GuestRoute />}>
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* ── Protected Routes (Dashboard Layout: Navbar + Sidebar) ─────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard"       element={<Dashboard />} />
              <Route path="/resume"          element={<Resume />} />
              <Route path="/resume-builder"  element={<ResumeBuilder />} />
              <Route path="/interview"       element={<Interview />} />
              <Route path="/interview/text"  element={<InterviewText />} />
              <Route path="/interview/voice" element={<InterviewVoice />} />
              <Route path="/interview/ai"    element={<InterviewAI />} />
              <Route path="/interview/video" element={<InterviewVideo />} />
              <Route path="/interview/history" element={<InterviewHistory />} />
              <Route path="/pricing"         element={<Pricing />} />
              <Route path="/profile"         element={<Profile />} />

              {/* Candidate scheduling routes */}
              <Route element={<RoleRoute allowedRoles={["candidate"]} />}>
                <Route path="/candidate/interviews" element={<CandidateInterviews />} />
                <Route path="/candidate/interviews/:interviewId/select-slot" element={<SlotSelection />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/interviews" element={<InterviewManagement />} />
                <Route path="/admin/jobs" element={<JobManagement />} />
              </Route>
            </Route>

            {/* Interviewer Routes */}
            <Route element={<RoleRoute allowedRoles={["interviewer"]} />}>
              <Route element={<InterviewerLayout />}>
                <Route path="/interviewer/dashboard" element={<InterviewerDashboard />} />
                <Route path="/interviewer/availability" element={<AvailabilityManager />} />
                <Route path="/interviewer/requests" element={<InterviewRequests />} />
                <Route path="/interviewer/interviews/:interviewId/feedback" element={<FeedbackForm />} />
              </Route>
            </Route>
          </Route>

          {/* ── 404 Fallback ──────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;