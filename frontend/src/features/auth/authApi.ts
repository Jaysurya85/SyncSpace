import axios from "axios";
import { api } from "../../services/api";
import type { AuthSession } from "./authTypes";

interface GoogleAuthResponse {
	token: string;
	user: {
		id: string;
		email: string;
		name: string;
		profile_pic: string;
	};
}

export const authenticateWithGoogle = async (
	googleToken: string
): Promise<AuthSession> => {
	try {
		const response = await api.post<GoogleAuthResponse>("/auth/google", {
			google_token: googleToken,
		});

		return {
			token: response.data.token,
			user: {
				id: response.data.user.id,
				email: response.data.user.email,
				name: response.data.user.name,
				avatar: response.data.user.profile_pic,
				provider: "google",
			},
		};
	} catch (error) {
		if (
			axios.isAxiosError(error) &&
			typeof error.response?.data?.error === "string"
		) {
			throw new Error(error.response.data.error);
		}

		throw new Error("Google sign-in failed. Please try again.");
	}
};
