import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import WorkspaceCard from "../../workspaces/components/WorkspaceCard";
import {
  createWorkspace,
  deleteWorkspace,
  fetchWorkspaces,
} from "../../workspaces/workspacesApi";
import type { WorkspaceSummary } from "../../workspaces/workspaceTypes";
const HomePage = () => {
  const navigate = useNavigate();
  const nameInputRef = useRef<HTMLDivElement | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    const loadWorkspaces = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        setDeleteError(null);
        const nextWorkspaces = await fetchWorkspaces();

        if (isMounted) {
          setWorkspaces(nextWorkspaces);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load workspaces. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadWorkspaces();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateWorkspace = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      setCreateError("Workspace name is required.");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      setDeleteError(null);

      const newWorkspace = await createWorkspace({
        name: name.trim(),
      });

      setWorkspaces((currentWorkspaces) => [newWorkspace, ...currentWorkspaces]);
      setName("");
      navigate(`/workspaces/${newWorkspace.id}/home`);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Failed to create workspace. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWorkspace = async (workspace: WorkspaceSummary) => {
    try {
      setDeletingWorkspaceId(workspace.id);
      setDeleteError(null);
      await deleteWorkspace(workspace.id);
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.filter(
          (currentWorkspace) => currentWorkspace.id !== workspace.id
        )
      );
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete workspace. Please try again."
      );
    } finally {
      setDeletingWorkspaceId(null);
    }
  };

  return (
    <section className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <section className="space-y-5">
          <div className="overflow-hidden rounded-[30px] border border-primary/15 bg-gradient-to-br from-primary-light via-surface to-background shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Workspace hub
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight text-text-primary">
                  Select a workspace before moving into the scoped app.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
                  The global authenticated home is intentionally outside any
                  workspace. It exists to manage entry into workspace-level
                  documents, teams, and tasks.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Available workspaces
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-text-primary">
                    {workspaces.length}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Available from the backend workspace list
                  </p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Next step
                  </p>
                  <p className="mt-3 text-sm font-semibold text-text-primary">
                    Enter a workspace
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    The sidebar only appears once a workspace is selected.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Workspaces
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                  Choose where to work
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Clicking a workspace enters its scoped home page and activates
                  the workspace layout with the left sidebar.
                </p>
              </div>

              <div className="rounded-2xl bg-background px-4 py-3 text-sm text-text-secondary">
                {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}
              </div>
            </div>

            {isLoading ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-text-secondary">
                Loading workspaces...
              </div>
            ) : null}

            {!isLoading && loadError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="text-sm font-medium text-red-700">{loadError}</p>
              </div>
            ) : null}

            {!isLoading && !loadError && workspaces.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-border bg-background p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Empty state
                </p>
                <h3 className="mt-3 text-xl font-semibold text-text-primary">
                  No workspaces yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Create the first workspace to begin using the scoped app
                  experience.
                </p>
                <Button
                  type="button"
                  className="mt-5"
                  onClick={() =>
                    nameInputRef.current?.querySelector("input")?.focus()
                  }
                >
                  + Create your first workspace
                </Button>
              </div>
            ) : null}

            {!isLoading && !loadError && deleteError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="text-sm font-medium text-red-700">{deleteError}</p>
              </div>
            ) : null}

            {!isLoading && !loadError && workspaces.length > 0 ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {workspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    isDeleting={deletingWorkspaceId === workspace.id}
                    onDelete={handleDeleteWorkspace}
                  />
                ))}
              </div>
            ) : null}
          </section>
        </section>

        <form
          onSubmit={handleCreateWorkspace}
          className="rounded-[28px] border border-border bg-surface p-6 shadow-sm xl:sticky xl:top-24"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Create workspace
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-text-primary">
            Start a new workspace
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            This is the app-level creation flow. Create a workspace here, then
            enter it to access workspace-scoped documents, teams, and tasks.
          </p>

          <div className="mt-6 space-y-4">
            <div ref={nameInputRef}>
              <Input
                label="Workspace name"
                placeholder="Marketing launch"
                value={name}
                onChange={(event) => setName(event.target.value)}
                error={
                  createError?.includes("name") ? createError : undefined
                }
              />
            </div>
          </div>

          {createError && !createError.includes("name") ? (
            <p className="mt-4 text-sm text-red-600">{createError}</p>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
              Global workspace flow
            </p>
            <Button type="submit" loading={isCreating}>
              + Create workspace
            </Button>
          </div>
        </form>
      </section>
    </section>
  );
};

export default HomePage;
