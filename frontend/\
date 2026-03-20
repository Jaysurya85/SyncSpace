import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const HomePage = () => {
	const navigate = useNavigate();
	const { user, logout } = useAuth();

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	return (
		<div className="min-h-screen bg-background p-8">
			<div className="max-w-4xl mx-auto">
				<div className="bg-surface border border-border rounded-lg shadow-sm p-6 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-text-primary">
							Welcome, {user.name}
						</h1>
						<p className="text-sm text-text-secondary mt-1">
							You are signed in with {user.provider}.
						</p>
					</div>

					<button
						onClick={handleLogout}
						className="px-4 py-2 rounded-md border border-border bg-white hover:bg-background text-text-primary transition"
					>
						Logout
					</button>
				</div>
			</div>
		</div>
	);
};

export default HomePage;
