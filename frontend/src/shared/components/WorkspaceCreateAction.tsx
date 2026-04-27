import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Input from "./Input";
import { useWorkspaceShell } from "../../features/workspaces/workspaceShellContext";

const WorkspaceCreateAction = () => {
  const navigate = useNavigate();
  const { createWorkspaceFromShell } = useWorkspaceShell();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const closeModal = () => {
    setIsOpen(false);
    setName("");
    setCreateError(null);
  };

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

      const newWorkspace = await createWorkspaceFromShell({
        name: name.trim(),
      });

      closeModal();
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

  return (
    <>
      <Button
        type="button"
        className="mt-3 w-full rounded-2xl"
        onClick={() => setIsOpen(true)}
      >
        + Create Workspace
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-8 backdrop-blur-sm">
          <div className="workspace-create-modal w-full max-w-lg rounded-[28px] border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Create workspace
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                  Add a new workspace
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Create a workspace from anywhere inside the workspace shell,
                  then switch straight into it.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-text-secondary transition hover:text-text-primary"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="mt-6 space-y-4">
              <Input
                label="Workspace name"
                placeholder="New workspace"
                value={name}
                onChange={(event) => setName(event.target.value)}
                error={
                  createError?.includes("name") ? createError : undefined
                }
              />

              {createError && !createError.includes("name") ? (
                <p className="text-sm text-danger">{createError}</p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isCreating}>
                  + Create workspace
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default WorkspaceCreateAction;
