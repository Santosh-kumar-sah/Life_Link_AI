import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/api";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Route protection wrapper component.
 * Redirects to /login if unauthenticated, or to appropriate dashboard if role is unauthorized.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Premium loading state overlay
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-dark">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but doesn't have required role -> redirect to their default home dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "donor") {
      return <Navigate to="/donor-dashboard" replace />;
    }
    if (user.role === "recipient") {
      return <Navigate to="/recipient-dashboard" replace />;
    }
    if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
