import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext"; // Change path if needed

interface ProtectedRouteProps {
  children: React.ReactNode;
  allow: boolean;
}

const ProtectedRoute = ({
  children,
  allow,
}: ProtectedRouteProps) => {
  const { loading } = useAuth();

  // Wait until auth is loaded
  if (loading) {
    return <div>Loading...</div>;
  }

  // User has permission
  if (allow) {
    return <>{children}</>;
  }

  // User doesn't have permission
  return <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;