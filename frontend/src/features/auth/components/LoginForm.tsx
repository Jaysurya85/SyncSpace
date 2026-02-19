import React, { useState } from "react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { login } from "../authApi";
import { useNavigate } from "react-router-dom";
import SocialLoginButton from "./SocialLoginButtonProps";

const LoginForm: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const validate = () => {
		if (!email || !password) {
			return "Email and password are required.";
		}

		if (!/\S+@\S+\.\S+/.test(email)) {
			return "Enter a valid email address.";
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

			await login({ email, password });

			// TODO: Redirect to dashboard after success
			console.log("Login successful");
			navigate("/home");

		} catch (err: any) {
			setError(
				err?.response?.data?.message || "Something went wrong."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold text-text-primary">
					Welcome back
				</h2>
				<p className="text-sm text-text-secondary mt-1">
					Sign in to your workspace
				</p>
			</div>

			{error && (
				<div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600">
					{error}
				</div>
			)}

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

			<div className="flex justify-end">
				<button
					type="button"
					className="text-sm text-primary hover:underline"
				>
					Forgot password?
				</button>
			</div>

			<Button type="submit" fullWidth loading={loading}>
				Sign in
			</Button>
			<div className="flex items-center gap-3">
				<div className="flex-1 h-px bg-border" />
				<span className="text-xs text-text-secondary uppercase tracking-wide">
					OR
				</span>
				<div className="flex-1 h-px bg-border" />
			</div>

			<SocialLoginButton
				provider="google"
				onClick={() => console.log("Google login clicked")}
			/>
		</form>
	);
};

export default LoginForm;
