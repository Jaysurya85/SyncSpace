import { useState } from "react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { useNavigate } from "react-router-dom";
import { signup } from "../authApi";

const SignUpForm = () => {
	const navigate = useNavigate();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const validate = () => {
		if (!name || !email || !password || !confirmPassword) {
			return "All fields are required.";
		}

		if (!/\S+@\S+\.\S+/.test(email)) {
			return "Enter a valid email address.";
		}

		if (password.length < 6) {
			return "Password must be at least 6 characters.";
		}

		if (password !== confirmPassword) {
			return "Passwords do not match.";
		}

		return null;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			await signup({ name, email, password, confirmPassword });

			navigate("/home");
		} catch {
			setError("Something went wrong.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold text-text-primary">
					Create your account
				</h2>
				<p className="text-sm text-text-secondary mt-1">
					Start collaborating today
				</p>
			</div>

			{error && (
				<div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600">
					{error}
				</div>
			)}

			<Input
				label="Full Name"
				value={name}
				onChange={(e) => setName(e.target.value)}
			/>

			<Input
				label="Email"
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
			/>

			<Input
				label="Password"
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			/>

			<Input
				label="Confirm Password"
				type="password"
				value={confirmPassword}
				onChange={(e) => setConfirmPassword(e.target.value)}
			/>

			<Button type="submit" fullWidth loading={loading}>
				Sign Up
			</Button>
		</form>
	);
};

export default SignUpForm;
