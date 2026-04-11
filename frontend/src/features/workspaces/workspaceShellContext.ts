import { createContext, useContext } from "react";
import type {
  CreateWorkspacePayload,
  WorkspaceSummary,
} from "./workspaceTypes";

export interface WorkspaceContextValue {
  currentWorkspace: WorkspaceSummary | null;
  workspaces: WorkspaceSummary[];
  isLoading: boolean;
  error: string | null;
  refreshWorkspaces: () => Promise<void>;
  createWorkspaceFromShell: (
    payload: CreateWorkspacePayload
  ) => Promise<WorkspaceSummary>;
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
