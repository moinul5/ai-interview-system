/**
 * ProtectedRoute.jsx
 * ------------------
 * Wraps any route that requires authentication.
 * Redirects unauthenticated users to /login.
 * Shows a <Loader> while the session is being restored on app load.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show spinner while auth state is being restored from localStorage
  if (loading) return <Loader fullScreen />;

  // Redirect to login if not authenticated
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Render the child route
  return <Outlet />;
};

export default ProtectedRoute;
