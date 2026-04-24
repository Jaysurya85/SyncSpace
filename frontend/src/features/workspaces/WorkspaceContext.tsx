import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import {
  addWorkspaceMember,
  createWorkspace,
  fetchWorkspaceMembers,
  fetchWorkspaceById,
  fetchWorkspaces,
  removeWorkspaceMember,
  updateWorkspace,
} from "./workspacesApi";
import { fetchWorkspaceDocuments } from "../documents/documentApi";
import type {
  AddWorkspaceMemberPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  WorkspaceMember,
  WorkspaceSummary,
} from "./workspaceTypes";
import { WorkspaceContext } from "./workspaceShellContext";

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { workspaceId } = useParams();
  const [currentWorkspace, setCurrentWorkspace] =
    useState<WorkspaceSummary | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);

  const loadWorkspaceMembers = useCallback(async () => {
    if (!workspaceId) {
      setWorkspaceMembers([]);
      setMembersError("Workspace ID is missing.");
      setIsMembersLoading(false);
      return;
    }

    try {
      setIsMembersLoading(true);
      setMembersError(null);
      const nextMembers = await fetchWorkspaceMembers(workspaceId);
      setWorkspaceMembers(nextMembers);
    } catch (membersLoadError) {
      setWorkspaceMembers([]);
      setMembersError(
        membersLoadError instanceof Error
          ? membersLoadError.message
          : "Failed to load workspace members."
      );
    } finally {
      setIsMembersLoading(false);
    }
  }, [workspaceId]);

  const loadWorkspaceData = useCallback(async () => {
    if (!workspaceId) {
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setWorkspaceMembers([]);
      setError("Workspace ID is missing.");
      setMembersError("Workspace ID is missing.");
      setIsLoading(false);
      setIsMembersLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsMembersLoading(true);
      setError(null);
      setMembersError(null);

      const [nextWorkspaces, nextWorkspace, nextMembers] = await Promise.all([
        fetchWorkspaces(),
        fetchWorkspaceById(workspaceId),
        fetchWorkspaceMembers(workspaceId),
      ]);

      setWorkspaces(nextWorkspaces);
      setWorkspaceMembers(nextMembers);

      if (!nextWorkspace) {
        setCurrentWorkspace(null);
        setError("Workspace not found.");
        return;
      }

      const workspaceDocuments = await fetchWorkspaceDocuments(workspaceId);

      setCurrentWorkspace({
        ...nextWorkspace,
        documentCount: workspaceDocuments.length,
      });
    } catch (workspaceError) {
      setCurrentWorkspace(null);
      setWorkspaceMembers([]);
      setError(
        workspaceError instanceof Error
          ? workspaceError.message
          : "Failed to load the workspace."
      );
    } finally {
      setIsLoading(false);
      setIsMembersLoading(false);
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

  const updateWorkspaceFromShell = useCallback(
    async (targetWorkspaceId: string, payload: UpdateWorkspacePayload) => {
      const updatedWorkspace = await updateWorkspace(targetWorkspaceId, payload);

      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === targetWorkspaceId
            ? {
                ...workspace,
                ...updatedWorkspace,
                documentCount:
                  updatedWorkspace.documentCount ?? workspace.documentCount,
              }
            : workspace
        )
      );

      setCurrentWorkspace((currentWorkspaceValue) =>
        currentWorkspaceValue?.id === targetWorkspaceId
          ? {
              ...currentWorkspaceValue,
              ...updatedWorkspace,
              documentCount:
                updatedWorkspace.documentCount ??
                currentWorkspaceValue.documentCount,
            }
          : currentWorkspaceValue
      );

      return updatedWorkspace;
    },
    []
  );

  const addWorkspaceMemberFromShell = useCallback(
    async (targetWorkspaceId: string, payload: AddWorkspaceMemberPayload) => {
      const createdMember = await addWorkspaceMember(targetWorkspaceId, payload);

      setWorkspaceMembers((currentMembers) => {
        const memberAlreadyExists = currentMembers.some(
          (member) => member.userId === createdMember.userId
        );

        if (memberAlreadyExists) {
          return currentMembers.map((member) =>
            member.userId === createdMember.userId ? createdMember : member
          );
        }

        return [...currentMembers, createdMember];
      });

      return createdMember;
    },
    []
  );

  const removeWorkspaceMemberFromShell = useCallback(
    async (targetWorkspaceId: string, userId: string) => {
      await removeWorkspaceMember(targetWorkspaceId, userId);
      setWorkspaceMembers((currentMembers) =>
        currentMembers.filter((member) => member.userId !== userId)
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      currentWorkspace,
      workspaces,
      workspaceMembers,
      isLoading,
      isMembersLoading,
      error,
      membersError,
      refreshWorkspaces: loadWorkspaceData,
      refreshWorkspaceMembers: loadWorkspaceMembers,
      createWorkspaceFromShell,
      updateWorkspaceFromShell,
      addWorkspaceMemberFromShell,
      removeWorkspaceMemberFromShell,
    }),
    [
      currentWorkspace,
      workspaces,
      workspaceMembers,
      isLoading,
      isMembersLoading,
      error,
      membersError,
      loadWorkspaceData,
      loadWorkspaceMembers,
      createWorkspaceFromShell,
      updateWorkspaceFromShell,
      addWorkspaceMemberFromShell,
      removeWorkspaceMemberFromShell,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
