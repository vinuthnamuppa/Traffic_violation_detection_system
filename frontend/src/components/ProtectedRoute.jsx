import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

/**
 * Generic protected route wrapper.
 *
 * Optionally accepts an array of allowed roles (backend roles: "public" | "officer").
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to a simple home/dashboard if role is not allowed
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;

