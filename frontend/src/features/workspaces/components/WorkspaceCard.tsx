import { Link } from "react-router-dom";
import type { WorkspaceSummary } from "../workspaceTypes";

interface WorkspaceCardProps {
  workspace: WorkspaceSummary;
  isDeleting?: boolean;
  onDelete?: (workspace: WorkspaceSummary) => void;
}

const WorkspaceCard = ({
  workspace,
  isDeleting = false,
  onDelete,
}: WorkspaceCardProps) => {
  const canDelete = onDelete && workspace.role === "owner";
  const workspaceMeta =
    workspace.documentCount !== undefined
      ? `${workspace.documentCount} docs`
      : "Workspace";

  return (
    <div className="rounded-[26px] border border-border bg-surface p-5 shadow-sm transition hover:border-primary/25 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Workspace
          </p>
          <Link
            to={`/workspaces/${workspace.id}/home`}
            className="group inline-block"
          >
            <h2 className="mt-3 text-lg font-semibold text-text-primary group-hover:text-primary">
              {workspace.name}
            </h2>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/workspaces/${workspace.id}/home`}
            className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary"
          >
            Open
          </Link>
          {canDelete ? (
            <button
              type="button"
              onClick={() => onDelete(workspace)}
              disabled={isDeleting}
              className="rounded-full border border-danger-border bg-danger-light px-3 py-1 text-xs font-semibold text-danger transition hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`Delete ${workspace.name}`}
              title={`Delete ${workspace.name}`}
            >
              🗑️
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
        {workspace.role ? <span>{workspace.role}</span> : null}
        <span>{workspace.ownerName}</span>
        <span>{workspaceMeta}</span>
        <span>{workspace.updatedAt}</span>
      </div>
    </div>
  );
};

export default WorkspaceCard;
