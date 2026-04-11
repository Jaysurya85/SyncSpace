import { Link, Outlet } from "react-router-dom";
import AuthenticatedUserPanel from "./AuthenticatedUserPanel";

const GlobalAuthenticatedLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/home" className="inline-block">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                SyncSpace
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-text-primary">
                Workspace Hub
              </h1>
            </Link>
            <p className="mt-1 text-sm text-text-secondary">
              Choose a workspace, create a new one, and enter the scoped app
              experience only when a workspace is selected.
            </p>
          </div>

          <AuthenticatedUserPanel />
        </div>
      </header>

      <main className="px-5 py-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default GlobalAuthenticatedLayout;
