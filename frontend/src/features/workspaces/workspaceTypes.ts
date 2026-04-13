export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerName: string;
  updatedAt: string;
}

export interface WorkspaceSummary extends WorkspaceRecord {
  documentCount?: number;
}

export interface CreateWorkspacePayload {
  name: string;
}

export interface UpdateWorkspacePayload {
  name: string;
}
