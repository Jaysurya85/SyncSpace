import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

interface User {
	id: string;
	name: string;
	email: string;
	avatar: string;
	provider: "google" | "";
}

interface AuthContextType {
	user: User;
	isAuthenticated: boolean;
	loginWithGoogle: () => void;
	logout: () => void;
}

const EMPTY_USER: User = {
	id: "",
	name: "",
	email: "",
	avatar: "",
	provider: "",
};

const AuthContext = createContext<AuthContextType>({
	user: EMPTY_USER,
	isAuthenticated: false,
	loginWithGoogle: () => { },
	logout: () => { },
});

const AUTH_STORAGE_KEY = "syncspace-auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User>(EMPTY_USER);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
		if (storedAuth) {
			try {
				const parsedUser = JSON.parse(storedAuth) as User;
				setUser(parsedUser);
				setIsAuthenticated(true);
			} catch {
				localStorage.removeItem(AUTH_STORAGE_KEY);
				setUser(EMPTY_USER);
				setIsAuthenticated(false);
			}
		}
	}, []);

	const loginWithGoogle = () => {
		const mockUser: User = {
			id: "1",
			name: "Jaysurya Ray",
			email: "jaysurya@example.com",
			avatar: "https://i.pravatar.cc/100?img=12",
			provider: "google",
		};

		setUser(mockUser);
		setIsAuthenticated(true);
		localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
	};

	const logout = () => {
		setUser(EMPTY_USER);
		setIsAuthenticated(false);
		localStorage.removeItem(AUTH_STORAGE_KEY);
	};

	const value = useMemo(
		() => ({
			user,
			isAuthenticated,
			loginWithGoogle,
			logout,
		}),
		[user, isAuthenticated]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
