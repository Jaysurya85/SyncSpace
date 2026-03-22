import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

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
					<div className="flex items-center gap-4">
						{user.avatar && (
							<img
								src={user.avatar}
								alt={user.name || "Google profile"}
								className="w-12 h-12 rounded-full border border-border"
							/>
						)}

						<div>
							<h1 className="text-2xl font-semibold text-text-primary">
								Welcome, {user.name || "there"}
							</h1>
							<p className="text-sm text-text-secondary mt-1">
								Signed in as {user.email || "your Google account"} via {user.provider}.
							</p>
						</div>
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
