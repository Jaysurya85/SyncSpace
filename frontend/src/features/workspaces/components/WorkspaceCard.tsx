import { Link } from "react-router-dom";
import type { WorkspaceSummary } from "../workspaceTypes";

interface WorkspaceCardProps {
  workspace: WorkspaceSummary;
}

const WorkspaceCard = ({ workspace }: WorkspaceCardProps) => {
  return (
    <Link
      to={`/workspaces/${workspace.id}/home`}
      className="group rounded-[26px] border border-border bg-surface p-5 shadow-sm transition hover:border-primary/25 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Workspace
          </p>
          <h2 className="mt-3 text-lg font-semibold text-text-primary group-hover:text-primary">
            {workspace.name}
          </h2>
        </div>

        <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
          Open
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-secondary">
        {workspace.description || "No description added yet."}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
        <span>{workspace.ownerName}</span>
        <span>{workspace.documentCount} docs</span>
        <span>{workspace.updatedAt}</span>
      </div>
    </Link>
  );
};

export default WorkspaceCard;
