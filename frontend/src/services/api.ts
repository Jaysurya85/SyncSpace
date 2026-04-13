import axios from "axios";

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	// withCredentials: true,
	headers: {
		"ngrok-skip-browser-warning": "true",
	},
});

api.interceptors.request.use((config) => {
	console.log("[API Request]", {
		method: config.method?.toUpperCase(),
		url: `${config.baseURL ?? ""}${config.url ?? ""}`,
		params: config.params,
		data: config.data,
		headers: config.headers,
	});

	return config;
});

api.interceptors.response.use(
	(response) => {
		console.log("[API Response]", {
			method: response.config.method?.toUpperCase(),
			url: `${response.config.baseURL ?? ""}${response.config.url ?? ""}`,
			status: response.status,
			data: response.data,
		});

		return response;
	},
	(error) => {
		console.log("[API Error]", {
			method: error.config?.method?.toUpperCase(),
			url: `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`,
			status: error.response?.status,
			data: error.response?.data,
			message: error.message,
		});

		return Promise.reject(error);
	}
);

export const setAuthToken = (token: string | null) => {
	if (token) {
		api.defaults.headers.common.Authorization = `Bearer ${token}`;
		return;
	}

	delete api.defaults.headers.common.Authorization;
};
