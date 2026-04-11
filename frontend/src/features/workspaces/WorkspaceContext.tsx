import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import {
  createWorkspace,
  fetchWorkspaceById,
  fetchWorkspaces,
} from "./workspacesApi";
import type { CreateWorkspacePayload, WorkspaceSummary } from "./workspaceTypes";
import { WorkspaceContext } from "./workspaceShellContext";

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { workspaceId } = useParams();
  const [currentWorkspace, setCurrentWorkspace] =
    useState<WorkspaceSummary | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaceData = useCallback(async () => {
    if (!workspaceId) {
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setError("Workspace ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [nextWorkspaces, nextWorkspace] = await Promise.all([
        fetchWorkspaces(),
        fetchWorkspaceById(workspaceId),
      ]);

      setWorkspaces(nextWorkspaces);

      if (!nextWorkspace) {
        setCurrentWorkspace(null);
        setError("Workspace not found.");
        return;
      }

      setCurrentWorkspace(nextWorkspace);
    } catch (workspaceError) {
      setCurrentWorkspace(null);
      setError(
        workspaceError instanceof Error
          ? workspaceError.message
          : "Failed to load the workspace."
      );
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadWorkspaceData();
  }, [loadWorkspaceData]);

  const createWorkspaceFromShell = useCallback(
    async (payload: CreateWorkspacePayload) => {
      const createdWorkspace = await createWorkspace(payload);
      setWorkspaces((currentWorkspaces) => [createdWorkspace, ...currentWorkspaces]);
      return createdWorkspace;
    },
    []
  );

  const value = useMemo(
    () => ({
      currentWorkspace,
      workspaces,
      isLoading,
      error,
      refreshWorkspaces: loadWorkspaceData,
      createWorkspaceFromShell,
    }),
    [currentWorkspace, workspaces, isLoading, error, loadWorkspaceData, createWorkspaceFromShell]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
