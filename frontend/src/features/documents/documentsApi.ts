import type {
  CreateDocumentPayload,
  DocumentRecord,
  DocumentSummary,
  SaveDocumentPayload,
} from "./documentTypes";
import { initialDocuments } from "./documentsDummyData";

let documentsStore = [...initialDocuments];

const MOCK_DELAY_MS = 300;

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

const wait = (durationMs: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

const mapToSummary = (document: DocumentRecord): DocumentSummary => ({
  id: document.id,
  title: document.title,
  description: document.description,
  ownerName: document.ownerName,
  status: document.status,
  updatedAt: document.updatedAt,
});

export const fetchDocuments = async (): Promise<DocumentSummary[]> => {
  await wait(MOCK_DELAY_MS);
  return documentsStore.map(mapToSummary);
};

export const fetchDocumentById = async (
  id: string
): Promise<DocumentRecord | null> => {
  await wait(MOCK_DELAY_MS);
  return documentsStore.find((document) => document.id === id) ?? null;
};

export const createDocument = async (
  payload: CreateDocumentPayload
): Promise<DocumentSummary> => {
  const title = payload.title.trim();

  if (!title) {
    throw new Error("Document title is required.");
  }

  const newDocument: DocumentRecord = {
    id: createDocumentId(title),
    title,
    description: payload.description.trim(),
    ownerName: "Workspace Guest",
    status: "Draft",
    updatedAt: formatCurrentDate(),
    content: `# ${title}\n\n`,
  };

  documentsStore = [newDocument, ...documentsStore];
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

  const existingDocument = documentsStore.find(
    (document) => document.id === payload.id
  );

  if (!existingDocument) {
    throw new Error("Document not found.");
  }

  const updatedDocument: DocumentRecord = {
    ...existingDocument,
    title,
    content,
    updatedAt: formatCurrentDate(),
    description:
      content
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[`*_>#-]/g, "")
        .trim()
        .slice(0, 140) || "No description added yet.",
  };
  console.log("Saving document:", updatedDocument);

  documentsStore = documentsStore.map((document) =>
    document.id === payload.id ? updatedDocument : document
  );

  return updatedDocument;
};
