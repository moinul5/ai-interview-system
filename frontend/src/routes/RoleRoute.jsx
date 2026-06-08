/**
 * RoleRoute.jsx
 * -------------
 * Route guard that checks if the authenticated user has one of the allowed roles.
 * Redirects unauthorized users to their role-specific dashboard.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleDashboards = {
  admin: "/admin/dashboard",
  interviewer: "/interviewer/dashboard",
  candidate: "/dashboard",
};

export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const redirect = roleDashboards[user.role] || "/dashboard";
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}
