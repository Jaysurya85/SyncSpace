import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";

const TopNavigation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Team Workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold text-text-primary">
            SyncSpace Collaboration Hub
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Stay aligned across documents, tasks, and conversations.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 md:justify-end">
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
                {user.email || "Signed in with Google"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-background"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
