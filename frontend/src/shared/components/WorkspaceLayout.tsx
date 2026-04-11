import { Outlet } from "react-router-dom";
import { WorkspaceProvider } from "../../features/workspaces/WorkspaceContext";
import { useWorkspaceShell } from "../../features/workspaces/workspaceShellContext";
import AuthenticatedUserPanel from "./AuthenticatedUserPanel";
import WorkspaceSidebar from "./WorkspaceSidebar";

const WorkspaceLayoutShell = () => {
  const { currentWorkspace, isLoading, error } = useWorkspaceShell();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-text-secondary">
        Loading workspace...
      </div>
    );
  }

  if (error || !currentWorkspace) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-red-700">
            {error ?? "Workspace not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <WorkspaceSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Selected Workspace
              </p>
              <h2 className="mt-1 text-xl font-semibold text-text-primary">
                {currentWorkspace.name}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {currentWorkspace.description}
              </p>
            </div>

            <AuthenticatedUserPanel compact />
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const WorkspaceLayout = () => {
  return (
    <WorkspaceProvider>
      <WorkspaceLayoutShell />
    </WorkspaceProvider>
  );
};

export default WorkspaceLayout;
