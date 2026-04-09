import { useMemo, useState, type ReactNode } from "react";
import { AuthContext, EMPTY_USER } from "./authContext";
import type { User } from "./authTypes";
import { authenticateWithGoogle } from "./authApi";
import { setAuthToken } from "../../services/api";
import { isGoogleAuthEnabled } from "./authConfig";

const AUTH_STORAGE_KEY = "syncspace-auth";
const AUTH_TOKEN_STORAGE_KEY = "syncspace-token";
const GUEST_USER: User = {
  id: "guest-user",
  name: "Workspace Guest",
  email: "",
  avatar: "",
  provider: "",
};

const clearStoredSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  setAuthToken(null);
};

const readStoredSession = () => {
  if (!isGoogleAuthEnabled) {
    clearStoredSession();
    return {
      user: GUEST_USER,
      isAuthenticated: true,
    };
  }

  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (!storedAuth || !storedToken) {
    clearStoredSession();
    return {
      user: EMPTY_USER,
      isAuthenticated: false,
    };
  }

  try {
    const parsedUser = JSON.parse(storedAuth) as User;
    setAuthToken(storedToken);

    return {
      user: parsedUser,
      isAuthenticated: parsedUser.provider !== "",
    };
  } catch {
    clearStoredSession();
    return {
      user: EMPTY_USER,
      isAuthenticated: false,
    };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initialSession = readStoredSession();
  const [user, setUser] = useState<User>(initialSession.user);
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialSession.isAuthenticated
  );

  const loginWithGoogle = async (credential: string) => {
    if (!isGoogleAuthEnabled) {
      return;
    }

    const session = await authenticateWithGoogle(credential);

    setAuthToken(session.token);
    setUser(session.user);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session.user));
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
  };

  const logout = () => {
    if (!isGoogleAuthEnabled) {
      clearStoredSession();
      return;
    }

    window.google?.accounts.id.disableAutoSelect();
    setUser(EMPTY_USER);
    setIsAuthenticated(false);
    clearStoredSession();
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isAuthLoading: false,
      loginWithGoogle,
      logout,
    }),
    [user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
