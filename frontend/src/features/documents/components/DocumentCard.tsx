import { Link } from "react-router-dom";
import type { DocumentSummary } from "../documentTypes";

interface DocumentCardProps {
  document: DocumentSummary;
  isDeleting?: boolean;
  onDelete?: (document: DocumentSummary) => void;
}

const DocumentCard = ({
  document,
  isDeleting = false,
  onDelete,
}: DocumentCardProps) => {
  return (
    <div className="rounded-[26px] border border-border bg-surface p-5 shadow-sm transition hover:border-primary/25 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {document.status}
          </p>
          <Link
            to={`/workspaces/${document.workspaceId}/documents/${document.id}`}
            className="group inline-block"
          >
            <h2 className="mt-3 text-lg font-semibold text-text-primary group-hover:text-primary">
              {document.title}
            </h2>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/workspaces/${document.workspaceId}/documents/${document.id}`}
            className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary"
          >
            Open
          </Link>
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(document)}
              disabled={isDeleting}
              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`Delete ${document.title}`}
              title={`Delete ${document.title}`}
            >
              🗑️
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
        <span>{document.ownerName}</span>
        <span>{document.updatedAt}</span>
      </div>
    </div>
  );
};

export default DocumentCard;
