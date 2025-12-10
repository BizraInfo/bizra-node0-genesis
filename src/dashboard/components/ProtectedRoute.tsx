import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types/user.types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requiredPermissions,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = user && requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission-based access
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      user?.permissions.includes(permission),
    );
    if (!hasAllPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
