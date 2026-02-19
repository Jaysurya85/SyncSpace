interface SocialLoginButtonProps {
	provider: "google";
	onClick?: () => void;
}

const SocialLoginButton = ({ provider, onClick }: SocialLoginButtonProps) => {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-border bg-white rounded-md hover:bg-background transition duration-200"
		>
			{provider === "google" && (
				<img
					src="https://www.svgrepo.com/show/475656/google-color.svg"
					alt="Google"
					className="w-5 h-5"
				/>
			)}

			<span className="text-sm font-medium text-text-primary">
				Continue with Google
			</span>
		</button>
	);
};

export default SocialLoginButton;
