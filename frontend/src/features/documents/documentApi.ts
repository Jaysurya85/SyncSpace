import type {
  CreateDocumentPayload,
  DocumentRecord,
  DocumentSummary,
  SaveDocumentPayload,
} from "./documentTypes";
import {
  getDocumentsStore,
  getWorkspacesStore,
  setDocumentsStore,
  setWorkspacesStore,
} from "../workspaces/workspaceStore";

const MOCK_DELAY_MS = 250;

const wait = (durationMs: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

const formatCurrentDate = () =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

const createDocumentId = (title: string) => {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `doc-${slug || "untitled"}-${Date.now()}`;
};

const touchWorkspace = (workspaceId: string, updatedAt: string) => {
  setWorkspacesStore(
    getWorkspacesStore().map((workspace) =>
      workspace.id === workspaceId ? { ...workspace, updatedAt } : workspace
    )
  );
};

const mapToSummary = (document: DocumentRecord): DocumentSummary => ({
  id: document.id,
  workspaceId: document.workspaceId,
  title: document.title,
  description: document.description,
  ownerName: document.ownerName,
  status: document.status,
  updatedAt: document.updatedAt,
});

export const fetchWorkspaceDocuments = async (
  workspaceId: string
): Promise<DocumentSummary[]> => {
  await wait(MOCK_DELAY_MS);
  return getDocumentsStore()
    .filter((document) => document.workspaceId === workspaceId)
    .map(mapToSummary);
};

export const fetchDocumentById = async (
  documentId: string
): Promise<DocumentRecord | null> => {
  await wait(MOCK_DELAY_MS);
  return (
    getDocumentsStore().find((document) => document.id === documentId) ?? null
  );
};

export const createWorkspaceDocument = async (
  workspaceId: string,
  payload: CreateDocumentPayload
): Promise<DocumentSummary> => {
  const title = payload.title.trim();

  if (!title) {
    throw new Error("Document title is required.");
  }

  const workspaceExists = getWorkspacesStore().some(
    (workspace) => workspace.id === workspaceId
  );

  if (!workspaceExists) {
    throw new Error("Workspace not found.");
  }

  const updatedAt = formatCurrentDate();
  const newDocument: DocumentRecord = {
    id: createDocumentId(title),
    workspaceId,
    title,
    description: payload.description.trim(),
    ownerName: "Workspace Guest",
    status: "Draft",
    updatedAt,
    content: `# ${title}\n\n`,
  };

  setDocumentsStore([newDocument, ...getDocumentsStore()]);
  touchWorkspace(workspaceId, updatedAt);
  await wait(MOCK_DELAY_MS);
  return mapToSummary(newDocument);
};

export const saveDocument = async (
  payload: SaveDocumentPayload
): Promise<DocumentRecord> => {
  const title = payload.title.trim();
  const content = payload.content.trim();

  if (!title) {
    throw new Error("Document title is required.");
  }

  if (!content) {
    throw new Error("Document content cannot be empty.");
  }

  await wait(MOCK_DELAY_MS);

  const existingDocument = getDocumentsStore().find(
    (document) => document.id === payload.id
  );

  if (!existingDocument) {
    throw new Error("Document not found.");
  }

  const updatedAt = formatCurrentDate();
  const updatedDocument: DocumentRecord = {
    ...existingDocument,
    title,
    content,
    updatedAt,
    description:
      content
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[`*_>#-]/g, "")
        .trim()
        .slice(0, 140) || "No description added yet.",
  };

  setDocumentsStore(
    getDocumentsStore().map((document) =>
      document.id === payload.id ? updatedDocument : document
    )
  );
  touchWorkspace(existingDocument.workspaceId, updatedAt);

  return updatedDocument;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await wait(MOCK_DELAY_MS);

  const documentToDelete = getDocumentsStore().find(
    (document) => document.id === documentId
  );

  if (!documentToDelete) {
    throw new Error("Document not found.");
  }

  setDocumentsStore(
    getDocumentsStore().filter((document) => document.id !== documentId)
  );
  touchWorkspace(documentToDelete.workspaceId, formatCurrentDate());
};
