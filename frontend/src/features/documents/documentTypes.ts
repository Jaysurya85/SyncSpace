export interface DocumentSummary {
  id: string;
  title: string;
  description: string;
  ownerName: string;
  status: string;
  updatedAt: string;
}

export interface CreateDocumentPayload {
  title: string;
  description: string;
}
