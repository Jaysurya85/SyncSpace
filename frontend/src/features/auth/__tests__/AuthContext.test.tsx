import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../useAuth";

const createGoogleCredential = (payload: Record<string, string>) => {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${body}.signature`;
};

const TestConsumer = () => {
  const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();

  return (
    <div>
      <p>{isAuthenticated ? "authenticated" : "anonymous"}</p>
      <p>{user.email || "no-email"}</p>
      <button
        type="button"
        onClick={() =>
          loginWithGoogle(
            createGoogleCredential({
              sub: "google-user-1",
              name: "Test User",
              email: "test@example.com",
              picture: "https://example.com/avatar.png",
            })
          )
        }
      >
        Login
      </button>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: vi.fn(),
          disableAutoSelect: vi.fn(),
        },
      },
    };
  });

  it("logs in with a Google credential and stores the user", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(localStorage.getItem("syncspace-auth")).toContain(
      "test@example.com"
    );
  });

  it("clears auth state and storage on logout", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "Login" }));
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(screen.getByText("anonymous")).toBeInTheDocument();
    expect(screen.getByText("no-email")).toBeInTheDocument();
    expect(localStorage.getItem("syncspace-auth")).toBeNull();
    expect(window.google?.accounts.id.disableAutoSelect).toHaveBeenCalledTimes(
      1
    );
  });
});
