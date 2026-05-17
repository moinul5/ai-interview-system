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
import Profile        from "./pages/Profile";
import NotFound  from "./pages/NotFound";

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
              <Route path="/profile"         element={<Profile />} />
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
