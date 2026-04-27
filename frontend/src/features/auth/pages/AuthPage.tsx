import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import GoogleAuthButton from "../../../shared/components/GoogleAuthButton";
import { useAuth } from "../useAuth";
import { isGoogleAuthEnabled } from "../authConfig";

const AuthPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, isAuthenticated, isAuthLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-text-secondary">
        Checking your session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  if (!isGoogleAuthEnabled) {
    return <Navigate to="/home" replace />;
  }

  const handleGoogleLogin = async (credential: string) => {
    try {
      setAuthError(null);
      setIsSubmitting(true);
      await loginWithGoogle(credential);
      navigate("/home");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Google sign-in failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-text-primary">
          SyncSpace
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Collaborate. Organize. Deliver.
        </p>
      </div>

      <AuthCard>
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary">
              Welcome to SyncSpace
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Continue with Google to access your workspace.
            </p>
          </div>

          <GoogleAuthButton onSuccess={handleGoogleLogin} />

          {isSubmitting && (
            <p className="text-sm text-center text-text-secondary">
              Completing sign-in...
            </p>
          )}

          {authError && (
            <p className="text-center text-sm text-danger">
              {authError}
            </p>
          )}
        </div>
      </AuthCard>
    </div>
  );
};

export default AuthPage;
