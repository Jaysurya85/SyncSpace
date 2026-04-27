import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { WorkspaceProvider } from "../../features/workspaces/WorkspaceContext";
import { useWorkspaceShell } from "../../features/workspaces/workspaceShellContext";
import AuthenticatedUserPanel from "./AuthenticatedUserPanel";
import WorkspaceSidebar from "./WorkspaceSidebar";

const WorkspaceLayoutShell = () => {
  const {
    currentWorkspace,
    isLoading,
    error,
    updateWorkspaceFromShell,
  } = useWorkspaceShell();
  const [isEditingName, setIsEditingName] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name);
      setRenameError(null);
      setIsEditingName(false);
    }
  }, [currentWorkspace]);

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
        <div className="mx-auto max-w-3xl rounded-3xl border border-danger-border bg-danger-light p-6 shadow-sm">
          <p className="text-sm font-medium text-danger">
            {error ?? "Workspace not found."}
          </p>
        </div>
      </div>
    );
  }

  const handleRenameWorkspace = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setIsRenaming(true);
      setRenameError(null);
      const updatedWorkspace = await updateWorkspaceFromShell(currentWorkspace.id, {
        name: workspaceName,
      });
      setWorkspaceName(updatedWorkspace.name);
      setIsEditingName(false);
    } catch (renameWorkspaceError) {
      setRenameError(
        renameWorkspaceError instanceof Error
          ? renameWorkspaceError.message
          : "Failed to rename workspace."
      );
    } finally {
      setIsRenaming(false);
    }
  };

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
              {isEditingName ? (
                <form
                  onSubmit={handleRenameWorkspace}
                  className="mt-2 flex flex-wrap items-center gap-2"
                >
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    className="min-w-[220px] rounded-xl border border-border bg-background px-3 py-2 text-base font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Workspace name"
                  />
                  <button
                    type="submit"
                    disabled={isRenaming}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRenaming ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={isRenaming}
                    onClick={() => {
                      setWorkspaceName(currentWorkspace.name);
                      setRenameError(null);
                      setIsEditingName(false);
                    }}
                    className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-text-primary">
                    {currentWorkspace.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceName(currentWorkspace.name);
                      setRenameError(null);
                      setIsEditingName(true);
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary transition hover:border-primary/20 hover:text-primary"
                  >
                    Edit name
                  </button>
                </div>
              )}
              {renameError ? (
                <p className="mt-2 text-sm text-danger">{renameError}</p>
              ) : null}
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
