import { createContext, useContext } from "react";
import type {
  AddWorkspaceMemberPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  WorkspaceMember,
  WorkspaceSummary,
} from "./workspaceTypes";

export interface WorkspaceContextValue {
  currentWorkspace: WorkspaceSummary | null;
  workspaces: WorkspaceSummary[];
  workspaceMembers: WorkspaceMember[];
  isLoading: boolean;
  isMembersLoading: boolean;
  error: string | null;
  membersError: string | null;
  refreshWorkspaces: () => Promise<void>;
  refreshWorkspaceMembers: () => Promise<void>;
  createWorkspaceFromShell: (
    payload: CreateWorkspacePayload
  ) => Promise<WorkspaceSummary>;
  updateWorkspaceFromShell: (
    workspaceId: string,
    payload: UpdateWorkspacePayload
  ) => Promise<WorkspaceSummary>;
  addWorkspaceMemberFromShell: (
    workspaceId: string,
    payload: AddWorkspaceMemberPayload
  ) => Promise<WorkspaceMember>;
  removeWorkspaceMemberFromShell: (
    workspaceId: string,
    userId: string
  ) => Promise<void>;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null
);

export const useWorkspaceShell = () => {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspaceShell must be used within a WorkspaceProvider.");
  }

  return context;
};
