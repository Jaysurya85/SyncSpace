export interface DocumentSummary {
  id: string;
  workspaceId: string;
  title: string;
  ownerName: string;
  status: string;
  updatedAt: string;
}

export interface DocumentRecord extends DocumentSummary {
  content: string;
}

export interface CreateDocumentPayload {
  title: string;
}

export interface SaveDocumentPayload {
  id: string;
  title: string;
  content: string;
}
