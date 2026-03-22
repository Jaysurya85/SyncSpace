import { createContext } from "react";
import type { User } from "./authTypes";

export interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  loginWithGoogle: (credential: string) => void;
  logout: () => void;
}

const EMPTY_USER: User = {
  id: "",
  name: "",
  email: "",
  avatar: "",
  provider: "",
};

export const AuthContext = createContext<AuthContextType>({
  user: EMPTY_USER,
  isAuthenticated: false,
  isAuthLoading: false,
  loginWithGoogle: () => {},
  logout: () => {},
});

export { EMPTY_USER };
