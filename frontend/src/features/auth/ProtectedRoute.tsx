import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { ReactNode } from "react";
import { isGoogleAuthEnabled } from "./authConfig";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (!isGoogleAuthEnabled) {
    return <>{children}</>;
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-text-secondary">
        Restoring your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
