import AuthCard from "../components/AuthCard";
import SignUpForm from "../components/SignupForm";

const SignUpPage = () => {
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
				<SignUpForm />
			</AuthCard>

			<p className="mt-6 text-sm text-text-secondary">
				Already have an account?{" "}
				<span
					onClick={() => window.location.href = "/"}
					className="text-primary hover:underline cursor-pointer"
				>
					Login
				</span>
			</p>

		</div>
	);
};

export default SignUpPage;
