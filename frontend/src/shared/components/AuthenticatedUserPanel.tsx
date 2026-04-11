import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { isGoogleAuthEnabled } from "../../features/auth/authConfig";

interface AuthenticatedUserPanelProps {
  showLogout?: boolean;
  compact?: boolean;
}

const AuthenticatedUserPanel = ({
  showLogout = true,
  compact = false,
}: AuthenticatedUserPanelProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div
      className={[
        "flex items-center gap-3",
        compact ? "justify-end" : "justify-between",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || "User avatar"}
            className="h-11 w-11 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {userInitial}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {user.name || "SyncSpace Member"}
          </p>
          <p className="truncate text-xs text-text-secondary">
            {user.email ||
              (isGoogleAuthEnabled
                ? "Signed in with Google"
                : "Authentication disabled")}
          </p>
        </div>
      </div>

      {showLogout && isGoogleAuthEnabled ? (
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-background"
        >
          Logout
        </button>
      ) : null}
    </div>
  );
};

export default AuthenticatedUserPanel;
