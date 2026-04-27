import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteDocument,
  fetchWorkspaceDocuments,
} from "../../documents/documentApi";
import type { DocumentSummary } from "../../documents/documentTypes";
import { useWorkspaceShell } from "../workspaceShellContext";

const WorkspaceHomePage = () => {
  const { currentWorkspace } = useWorkspaceShell();
  const [recentDocuments, setRecentDocuments] = useState<DocumentSummary[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!currentWorkspace) {
      return;
    }

    let isMounted = true;

    const loadRecentDocuments = async () => {
      setDeleteError(null);
      const documents = await fetchWorkspaceDocuments(currentWorkspace.id);

      if (isMounted) {
        setRecentDocuments(documents.slice(0, 3));
      }
    };

    void loadRecentDocuments();

    return () => {
      isMounted = false;
    };
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return null;
  }

  const workspaceDocumentCount =
    currentWorkspace.documentCount ?? recentDocuments.length;

  const handleDeleteDocument = async (document: DocumentSummary) => {
    try {
      setDeletingDocumentId(document.id);
      setDeleteError(null);
      await deleteDocument(document.id);
      setRecentDocuments((currentDocuments) =>
        currentDocuments.filter(
          (currentDocument) => currentDocument.id !== document.id
        )
      );
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete document. Please try again."
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  return (
    <section className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Documents
              </p>
              <p className="mt-3 text-3xl font-semibold text-text-primary">
                {workspaceDocumentCount}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Files in this workspace
              </p>
            </div>

            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Owner
              </p>
              <p className="mt-3 text-lg font-semibold text-text-primary">
                {currentWorkspace.ownerName}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Primary coordinator
              </p>
            </div>

            <div className="rounded-2xl bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Updated
              </p>
              <p className="mt-3 text-lg font-semibold text-text-primary">
                {currentWorkspace.updatedAt}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Last workspace activity
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-border bg-background p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Current focus
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-text-primary">
              Move through this workspace from the sidebar.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
              Documents, teams, and tasks are now scoped to this workspace. The
              global workspace hub is separate and available through the app
              branding link.
            </p>
          </div>
        </div>

        <section className="grid gap-5">
          <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Quick links
            </p>
            <div className="mt-4 grid gap-3">
              <Link
                to={`/workspaces/${currentWorkspace.id}/documents`}
                className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/25 hover:bg-primary-light/40"
              >
                <p className="text-sm font-semibold text-text-primary">
                  Open documents
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Browse and create documents for this workspace.
                </p>
              </Link>
              <Link
                to={`/workspaces/${currentWorkspace.id}/teams`}
                className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/25 hover:bg-primary-light/40"
              >
                <p className="text-sm font-semibold text-text-primary">
                  Open teams
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  View people, roles, and workspace responsibilities.
                </p>
              </Link>
              <Link
                to={`/workspaces/${currentWorkspace.id}/tasks`}
                className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/25 hover:bg-primary-light/40"
              >
                <p className="text-sm font-semibold text-text-primary">
                  Open tasks
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Review placeholder task coordination inside this workspace.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </section>

      <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Recent documents
            </p>
            <h2 className="mt-2 text-xl font-semibold text-text-primary">
              Workspace document activity
            </h2>
          </div>

          <Link
            to={`/workspaces/${currentWorkspace.id}/documents`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Go to documents
          </Link>
        </div>

        <div className="mt-5 grid gap-4">
          {deleteError ? (
            <div className="rounded-2xl border border-danger-border bg-danger-light p-4">
              <p className="text-sm font-medium text-danger">{deleteError}</p>
            </div>
          ) : null}

          {recentDocuments.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-background p-8 text-center">
              <h3 className="text-xl font-semibold text-text-primary">
                No documents yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Create the first document from the documents section inside this
                workspace.
              </p>
            </div>
          ) : (
            recentDocuments.map((document) => (
              <div
                key={document.id}
                className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/25"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/workspaces/${currentWorkspace.id}/documents/${document.id}`}
                        className="group"
                      >
                        <h3 className="text-base font-semibold text-text-primary group-hover:text-primary">
                          {document.title}
                        </h3>
                      </Link>
                      <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                        {document.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-secondary">
                      Updated {document.updatedAt}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(document)}
                      disabled={deletingDocumentId === document.id}
                      className="rounded-full border border-danger-border bg-danger-light px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Delete ${document.title}`}
                      title={`Delete ${document.title}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
};

export default WorkspaceHomePage;
