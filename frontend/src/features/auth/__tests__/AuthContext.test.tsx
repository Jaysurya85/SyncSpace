import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../useAuth";
import { authenticateWithGoogle } from "../authApi";

vi.mock("../authApi", () => ({
  authenticateWithGoogle: vi.fn(),
}));

vi.mock("../authConfig", () => ({
  isGoogleAuthEnabled: true,
}));

const TestConsumer = () => {
  const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();

  return (
    <div>
      <p>{isAuthenticated ? "authenticated" : "anonymous"}</p>
      <p>{user.email || "no-email"}</p>
      <button
        type="button"
        onClick={() => void loginWithGoogle("google-id-token")}
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
  const mockedAuthenticateWithGoogle = vi.mocked(authenticateWithGoogle);

  beforeEach(() => {
    localStorage.clear();
    mockedAuthenticateWithGoogle.mockResolvedValue({
      token: "backend-jwt-token",
      user: {
        id: "google-user-1",
        name: "Test User",
        email: "test@example.com",
        avatar: "https://example.com/avatar.png",
        provider: "google",
      },
    });
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
    expect(localStorage.getItem("syncspace-token")).toBe("backend-jwt-token");
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
    expect(localStorage.getItem("syncspace-token")).toBeNull();
    expect(window.google?.accounts.id.disableAutoSelect).toHaveBeenCalledTimes(
      1
    );
  });
});
