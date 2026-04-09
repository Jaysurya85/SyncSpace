export interface DocumentSummary {
  id: string;
  title: string;
  description: string;
  ownerName: string;
  status: string;
  updatedAt: string;
}

export interface DocumentRecord extends DocumentSummary {
  content: string;
}

export interface CreateDocumentPayload {
  title: string;
  description: string;
}

export interface SaveDocumentPayload {
  id: string;
  title: string;
  content: string;
}
