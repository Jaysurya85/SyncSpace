import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import FeaturePageShell from "../../../shared/components/FeaturePageShell";
import Button from "../../../shared/components/Button";
import {
  fetchDocumentById,
  saveDocument,
} from "../documentApi";
import {
  htmlToMarkdown,
  markdownToHtml,
} from "../documentMarkdown";
import type { DocumentRecord } from "../documentTypes";
import { useWorkspaceShell } from "../../workspaces/workspaceShellContext";

const DocumentEditor = lazy(() => import("../components/DocumentEditor"));

const DocumentDetailsPage = () => {
  const { workspaceId, documentId } = useParams();
  const { currentWorkspace } = useWorkspaceShell();
  const [documentRecord, setDocumentRecord] = useState<DocumentRecord | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!workspaceId || !documentId) {
      setLoadError("Workspace or document ID is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const nextDocument = await fetchDocumentById(documentId);

        if (!isMounted) {
          return;
        }

        if (!nextDocument || nextDocument.workspaceId !== workspaceId) {
          setLoadError("Document not found in this workspace.");
          return;
        }

        setDocumentRecord(nextDocument);
        setTitle(nextDocument.title);
        setEditorContent(markdownToHtml(nextDocument.content));
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load the document."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDocument();

    return () => {
      isMounted = false;
    };
  }, [workspaceId, documentId]);

  const handleSave = async () => {
    if (!documentId) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      const updatedDocument = await saveDocument({
        id: documentId,
        title,
        content: htmlToMarkdown(editorContent),
      });

      setDocumentRecord(updatedDocument);
      setTitle(updatedDocument.title);
      setEditorContent(markdownToHtml(updatedDocument.content));
      setSaveSuccess(`Saved ${updatedDocument.updatedAt}`);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save the document."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <FeaturePageShell
        eyebrow="Document"
        title="Loading document"
        description="Preparing the editor workspace."
      >
        <div className="rounded-3xl border border-dashed border-border bg-surface p-6 text-sm text-text-secondary shadow-sm">
          Loading document...
        </div>
      </FeaturePageShell>
    );
  }

  if (loadError || !documentRecord) {
    return (
      <FeaturePageShell
        eyebrow="Document"
        title="Document unavailable"
        description="The editor could not be opened for this workspace document."
      >
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-red-700">
            {loadError ?? "Document not found."}
          </p>
        </div>
      </FeaturePageShell>
    );
  }

  return (
    <FeaturePageShell
      eyebrow={currentWorkspace ? currentWorkspace.name : "Workspace"}
      title="Writing space"
      description="This document is nested under a workspace route and keeps markdown persistence with a simple manual save flow."
    >
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary shadow-sm">
          <Link
            to="/workspaces"
            className="font-medium text-primary transition hover:underline"
          >
            Workspaces
          </Link>
          {currentWorkspace ? (
            <>
              <span className="text-text-muted">/</span>
              <Link
                to={`/workspaces/${currentWorkspace.id}/documents`}
                className="font-medium text-primary transition hover:underline"
              >
                {currentWorkspace.name}
              </Link>
            </>
          ) : null}
          <span className="text-text-muted">/</span>
          <span>Document</span>
        </div>

        <div className="notion-page-shell rounded-[32px] border border-border bg-surface px-6 py-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.18)] md:px-10 md:py-8">
          <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                Markdown document
              </p>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Untitled"
                className="notion-title-input mt-3 w-full border-0 bg-transparent p-0 text-4xl font-semibold tracking-[-0.04em] text-text-primary placeholder:text-text-muted focus:outline-none md:text-5xl"
              />
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <Button
                type="button"
                loading={isSaving}
                onClick={handleSave}
                className="rounded-full border-0 bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Save
              </Button>
              <p className="text-[11px] uppercase tracking-[0.22em] text-text-muted">
                Manual save
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            {currentWorkspace ? (
              <Link
                to={`/workspaces/${currentWorkspace.id}/documents`}
                className="rounded-full bg-primary-light px-3 py-1.5 text-primary transition hover:bg-primary/15"
              >
                {currentWorkspace.name}
              </Link>
            ) : null}
            <span className="rounded-full bg-background px-3 py-1.5">
              Owner: {documentRecord.ownerName}
            </span>
            <span className="rounded-full bg-background px-3 py-1.5">
              Status: {documentRecord.status}
            </span>
            <span className="rounded-full bg-background px-3 py-1.5">
              Last updated: {documentRecord.updatedAt}
            </span>
          </div>

          {saveError ? (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {saveError}
            </p>
          ) : null}

          {saveSuccess ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {saveSuccess}
            </p>
          ) : null}

          <div className="mt-8">
            <Suspense
              fallback={
                <div className="rounded-[28px] border border-dashed border-border bg-background p-6 text-sm text-text-secondary">
                  Loading editor...
                </div>
              }
            >
              <DocumentEditor value={editorContent} onChange={setEditorContent} />
            </Suspense>
          </div>
        </div>
      </section>
    </FeaturePageShell>
  );
};

export default DocumentDetailsPage;
