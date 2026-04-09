import type {
  CreateDocumentPayload,
  DocumentSummary,
} from "./documentTypes";
import { initialDocuments } from "./documentsDummyData";

let documentsStore = [...initialDocuments];

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

export const fetchDocuments = async (): Promise<DocumentSummary[]> => {
  return Promise.resolve([...documentsStore]);
};

export const createDocument = async (
  payload: CreateDocumentPayload
): Promise<DocumentSummary> => {
  const title = payload.title.trim();

  if (!title) {
    throw new Error("Document title is required.");
  }

  const newDocument: DocumentSummary = {
    id: createDocumentId(title),
    title,
    description: payload.description.trim(),
    ownerName: "Workspace Guest",
    status: "Draft",
    updatedAt: formatCurrentDate(),
  };

  documentsStore = [newDocument, ...documentsStore];
  console.log("Document created:", newDocument);
  return Promise.resolve(newDocument);
};
