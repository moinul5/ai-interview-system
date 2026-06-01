/**
 * GuestRoute.jsx
 * --------------
 * Redirects already-authenticated users away from public pages
 * like Login and Signup — sends them to /dashboard instead.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

const GuestRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader fullScreen />;

  // If already logged in, skip login/signup and go to dashboard
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default GuestRoute;
