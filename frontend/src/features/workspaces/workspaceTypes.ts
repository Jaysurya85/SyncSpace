export interface WorkspaceRecord {
  id: string;
  name: string;
  description: string;
  ownerName: string;
  updatedAt: string;
}

export interface WorkspaceSummary extends WorkspaceRecord {
  documentCount: number;
}

export interface CreateWorkspacePayload {
  name: string;
  description: string;
}
