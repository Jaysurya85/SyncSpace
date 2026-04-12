import axios from "axios";
import { api } from "../../services/api";
import type {
  CreateDocumentPayload,
  DocumentRecord,
  DocumentSummary,
  SaveDocumentPayload,
} from "./documentTypes";

interface DocumentApiRecord {
  id?: string | number;
  _id?: string | number;
  workspace_id?: string | number | null;
  workspaceId?: string | number | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  summary?: string | null;
  owner_name?: string | null;
  ownerName?: string | null;
  status?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  content?: string | null;
  markdown?: string | null;
  body?: string | null;
}

interface DocumentListResponse {
  documents?: DocumentApiRecord[];
  data?: DocumentApiRecord[];
}

const toDisplayDate = (value?: string | null) => {
  if (!value) {
    return "Recently updated";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
};

const normalizeDocument = (document: DocumentApiRecord): DocumentRecord => ({
  id: String(document.id ?? document._id ?? ""),
  workspaceId: String(document.workspace_id ?? document.workspaceId ?? ""),
  title: document.title ?? document.name ?? "Untitled document",
  description: document.description ?? document.summary ?? "",
  ownerName: document.owner_name ?? document.ownerName ?? "Workspace owner",
  status: document.status ?? "Draft",
  updatedAt: toDisplayDate(
    document.updated_at ??
      document.updatedAt ??
      document.created_at ??
      document.createdAt
  ),
  content: document.content ?? document.markdown ?? document.body ?? "",
});

const mapToSummary = (document: DocumentRecord): DocumentSummary => ({
  id: document.id,
  workspaceId: document.workspaceId,
  title: document.title,
  description: document.description,
  ownerName: document.ownerName,
  status: document.status,
  updatedAt: document.updatedAt,
});

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    axios.isAxiosError(error) &&
    typeof error.response?.data?.error === "string"
  ) {
    return error.response.data.error;
  }

  return fallbackMessage;
};

export const fetchWorkspaceDocuments = async (
  workspaceId: string
): Promise<DocumentSummary[]> => {
  try {
    const response = await api.get<DocumentListResponse | DocumentApiRecord[]>(
      `/workspaces/${workspaceId}/documents`
    );

    const documents = Array.isArray(response.data)
      ? response.data
      : response.data.documents ?? response.data.data ?? [];

    return documents
      .map(normalizeDocument)
      .filter((document) => document.id)
      .map((document) => ({
        ...mapToSummary(document),
        workspaceId: document.workspaceId || workspaceId,
      }));
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to load documents. Please try again.")
    );
  }
};

export const fetchDocumentById = async (
  documentId: string
): Promise<DocumentRecord | null> => {
  try {
    const response = await api.get<DocumentApiRecord>(`/documents/${documentId}`);
    const document = normalizeDocument(response.data);

    return document.id ? document : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw new Error(
      getErrorMessage(error, "Failed to load document. Please try again.")
    );
  }
};

export const createWorkspaceDocument = async (
  workspaceId: string,
  payload: CreateDocumentPayload
): Promise<DocumentSummary> => {
  const title = payload.title.trim();

  if (!title) {
    throw new Error("Document title is required.");
  }

  try {
    const response = await api.post<
      DocumentApiRecord | { document: DocumentApiRecord }
    >(`/workspaces/${workspaceId}/documents`, {
      title,
      description: payload.description.trim(),
      content: `# ${title}\n\n`,
    });

    const documentRecord =
      "document" in response.data ? response.data.document : response.data;
    const document = normalizeDocument({
      ...documentRecord,
      workspace_id: documentRecord.workspace_id ?? workspaceId,
      content: documentRecord.content ?? `# ${title}\n\n`,
    });

    return {
      ...mapToSummary(document),
      workspaceId: document.workspaceId || workspaceId,
    };
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to create document. Please try again.")
    );
  }
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

  try {
    const response = await api.put<
      DocumentApiRecord | { document: DocumentApiRecord }
    >(`/documents/${payload.id}`, {
      title,
      content,
    });

    const documentRecord =
      "document" in response.data ? response.data.document : response.data;
    const document = normalizeDocument({
      ...documentRecord,
      title,
      content,
      description:
        documentRecord.description ??
        content
          .replace(/^#{1,6}\s+/gm, "")
          .replace(/[`*_>#-]/g, "")
          .trim()
          .slice(0, 140),
    });

    return document;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to save document. Please try again.")
    );
  }
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    await api.delete(`/documents/${documentId}`);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to delete document. Please try again.")
    );
  }
};
