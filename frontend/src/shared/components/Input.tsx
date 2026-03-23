import React, { useId } from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
}

const Input: React.FC<InputProps> = ({
	label,
	error,
	className,
	...props
}) => {
	const inputId = useId();

	return (
		<div className="w-full">
			<label
				htmlFor={inputId}
				className="block text-sm font-medium text-text-primary"
			>
				{label}
			</label>

			<input
				id={inputId}
				className={clsx(
					"w-full mt-1 px-3 py-2 border rounded-md bg-white text-text-primary transition focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
					error ? "border-red-500" : "border-border",
					className
				)}
				{...props}
			/>

			{error && (
				<p className="mt-1 text-sm text-red-500">{error}</p>
			)}
		</div>
	);
};

export default Input;
