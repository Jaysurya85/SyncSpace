import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeaturePageShell from "../../../shared/components/FeaturePageShell";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import { createDocument, fetchDocuments } from "../documentsApi";
import DocumentCard from "../components/DocumentCard";
import type { DocumentSummary } from "../documentTypes";

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const nextDocuments = await fetchDocuments();

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
  }, []);

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

      const newDocument = await createDocument({
        title: title.trim(),
        description: description.trim(),
      });

      setDocuments((currentDocuments) => [newDocument, ...currentDocuments]);
      setTitle("");
      setDescription("");
      navigate(`/documents/${newDocument.id}`);
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

  return (
    <FeaturePageShell
      eyebrow="Documents"
      title="Shared documents"
      description="Browse the document library, create a new workspace draft, and jump directly into any document from one entry point."
    >
      <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <form
          onSubmit={handleCreateDocument}
          className="rounded-[28px] border border-border bg-surface p-6 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Create document
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-text-primary">
            Start a new draft
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            New documents are created through the frontend document data layer
            for now, then the user is routed into the document workspace.
          </p>

          <div className="mt-6 space-y-4">
            <Input
              label="Title"
              placeholder="Quarterly planning brief"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              error={createError?.includes("title") ? createError : undefined}
            />

            <div className="w-full">
              <label
                htmlFor="document-description"
                className="block text-sm font-medium text-text-primary"
              >
                Description
              </label>
              <textarea
                id="document-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add a short summary so the team knows what this document is for."
                rows={5}
                className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-text-primary transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {createError && !createError.includes("title") ? (
            <p className="mt-4 text-sm text-red-600">{createError}</p>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
              Frontend dummy data
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
                All documents
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                Document library
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                This list is the entry point into the document system and routes
                each item into an individual document view.
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
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-medium text-red-700">{loadError}</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : null}

          {!isLoading && !loadError && documents.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-border bg-background p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Empty state
              </p>
              <h3 className="mt-3 text-xl font-semibold text-text-primary">
                No documents yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Create the first document to open the workspace and start the
                document system.
              </p>
              <Button
                type="button"
                className="mt-5"
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>('input[type="text"]')
                    ?.focus()
                }
              >
                Create your first document
              </Button>
            </div>
          ) : null}

          {!isLoading && !loadError && documents.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {documents.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </FeaturePageShell>
  );
};

export default DocumentsPage;
