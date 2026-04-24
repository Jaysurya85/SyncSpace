export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerName: string;
  ownerId?: string;
  role?: string;
  updatedAt: string;
  createdAt?: string;
}

export interface WorkspaceSummary extends WorkspaceRecord {
  documentCount?: number;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
}

export interface CreateWorkspacePayload {
  name: string;
}

export interface UpdateWorkspacePayload {
  name: string;
}

export interface AddWorkspaceMemberPayload {
  userId?: string;
  email?: string;
}
