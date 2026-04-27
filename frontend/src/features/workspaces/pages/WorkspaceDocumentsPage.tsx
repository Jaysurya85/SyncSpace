import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import DocumentCard from "../../documents/components/DocumentCard";
import {
  createWorkspaceDocument,
  deleteDocument,
  fetchWorkspaceDocuments,
} from "../../documents/documentApi";
import type { DocumentSummary } from "../../documents/documentTypes";
import { useWorkspaceShell } from "../workspaceShellContext";

const WorkspaceDocumentsPage = () => {
  const navigate = useNavigate();
  const titleInputRef = useRef<HTMLDivElement | null>(null);
  const { currentWorkspace } = useWorkspaceShell();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!currentWorkspace) {
      return;
    }

    let isMounted = true;

    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        setDeleteError(null);
        const nextDocuments = await fetchWorkspaceDocuments(currentWorkspace.id);

        if (isMounted) {
          setDocuments(nextDocuments);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load documents. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDocuments();

    return () => {
      isMounted = false;
    };
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return null;
  }

  const handleCreateDocument = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      setCreateError("Document title is required.");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      setDeleteError(null);

      const newDocument = await createWorkspaceDocument(currentWorkspace.id, {
        title: title.trim(),
      });

      setDocuments((currentDocuments) => [newDocument, ...currentDocuments]);
      setTitle("");
      navigate(`/workspaces/${currentWorkspace.id}/documents/${newDocument.id}`);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Failed to create document. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async (document: DocumentSummary) => {
    try {
      setDeletingDocumentId(document.id);
      setDeleteError(null);
      await deleteDocument(document.id);
      setDocuments((currentDocuments) =>
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
      <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <form
          onSubmit={handleCreateDocument}
          className="rounded-[28px] border border-primary/15 bg-primary-light/60 p-6 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Create document
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-text-primary">
            Add a document to this workspace
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Document creation now happens only in workspace context, matching
            the intended backend contract and route structure.
          </p>

          <div className="mt-6 space-y-4">
            <div ref={titleInputRef}>
              <Input
                label="Document title"
                placeholder="Weekly retro notes"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                error={
                  createError?.includes("title") ? createError : undefined
                }
              />
            </div>
          </div>

          {createError && !createError.includes("title") ? (
            <p className="mt-4 text-sm text-danger">{createError}</p>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
              Workspace-scoped documents
            </p>
            <Button type="submit" loading={isCreating}>
              Create document
            </Button>
          </div>
        </form>

        <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Document library
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                Documents in this workspace
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Open a document to edit markdown-backed content within this
                workspace context.
              </p>
            </div>

            <div className="rounded-2xl bg-background px-4 py-3 text-sm text-text-secondary">
              {documents.length} document{documents.length === 1 ? "" : "s"}
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-text-secondary">
              Loading documents...
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="mt-6 rounded-2xl border border-danger-border bg-danger-light p-6">
              <p className="text-sm font-medium text-danger">{loadError}</p>
            </div>
          ) : null}

          {!isLoading && !loadError && deleteError ? (
            <div className="mt-6 rounded-2xl border border-danger-border bg-danger-light p-6">
              <p className="text-sm font-medium text-danger">{deleteError}</p>
            </div>
          ) : null}

          {!isLoading && !loadError && documents.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-border bg-background p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Empty state
              </p>
              <h3 className="mt-3 text-xl font-semibold text-text-primary">
                No documents in this workspace yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Create the first document to start using this workspace as a
                dedicated container.
              </p>
              <Button
                type="button"
                className="mt-5"
                onClick={() =>
                  titleInputRef.current?.querySelector("input")?.focus()
                }
              >
                Create the first document
              </Button>
            </div>
          ) : null}

          {!isLoading && !loadError && documents.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  isDeleting={deletingDocumentId === document.id}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </section>
  );
};

export default WorkspaceDocumentsPage;
