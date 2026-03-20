import { Navigate, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import GoogleAuthButton from "../../../shared/components/GoogleAuthButton";
import { useAuth } from "../AuthContext";

const AuthPage = () => {
	const navigate = useNavigate();
	const { loginWithGoogle, isAuthenticated } = useAuth();

	if (isAuthenticated) {
		return <Navigate to="/home" replace />;
	}

	const handleGoogleLogin = () => {
		loginWithGoogle();
		navigate("/home");
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

					<GoogleAuthButton onClick={handleGoogleLogin} />
				</div>
			</AuthCard>
		</div>
	);
};

export default AuthPage;
