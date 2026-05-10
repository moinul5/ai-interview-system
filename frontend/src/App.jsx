/**
 * App.jsx
 * -------
 * Root application component.
 * Sets up React Router with:
 *   - Public routes (Home, Login, Signup) wrapped in PublicLayout
 *   - GuestRoute: redirects logged-in users away from auth pages
 *   - ProtectedRoute: guards Dashboard, Resume, Profile behind authentication
 *   - DashboardLayout: sidebar layout for authenticated pages
 *   - 404 catch-all route
 *
 * All routes are defined here. Add new routes in this file.
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
import Dashboard from "./pages/Dashboard";
import Resume    from "./pages/Resume";
import Profile   from "./pages/Profile";
import NotFound  from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps the entire app so all routes can access auth state */}
      <AuthProvider>
        <Routes>

          {/* ── Public Routes (with Navbar + Footer) ─────────────────────── */}
          <Route element={<PublicLayout />}>
            {/* Guest-only routes: redirect to /dashboard if already logged in */}
            <Route element={<GuestRoute />}>
              <Route path="/"       element={<Home />} />
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>
          </Route>

          {/* ── Protected Routes (Dashboard Layout: Navbar + Sidebar) ────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/resume"    element={<Resume />} />
              <Route path="/profile"   element={<Profile />} />
              {/* TODO: Add more protected routes here (e.g., /interview, /results) */}
            </Route>
          </Route>

          {/* ── 404 Fallback ─────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
