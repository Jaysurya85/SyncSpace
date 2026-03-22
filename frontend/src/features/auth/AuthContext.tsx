import { useMemo, useState, type ReactNode } from "react";
import { AuthContext, EMPTY_USER } from "./authContext";
import type { User } from "./authTypes";
import { parseGoogleCredential } from "./googleIdentity";

const AUTH_STORAGE_KEY = "syncspace-auth";

const readStoredUser = () => {
  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedAuth) {
    return EMPTY_USER;
  }

  try {
    return JSON.parse(storedAuth) as User;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return EMPTY_USER;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(() => readStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => readStoredUser().provider !== ""
  );

  const loginWithGoogle = (credential: string) => {
    const payload = parseGoogleCredential(credential);
    const googleUser: User = {
      id: payload.sub,
      name: payload.name ?? "",
      email: payload.email ?? "",
      avatar: payload.picture ?? "",
      provider: "google",
    };

    setUser(googleUser);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(googleUser));
  };

  const logout = () => {
    window.google?.accounts.id.disableAutoSelect();
    setUser(EMPTY_USER);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
