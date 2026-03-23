export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: "google" | "";
}

export interface AuthSession {
  token: string;
  user: User;
}
