import axios from "axios";
import { api } from "../../services/api";
import type {
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  WorkspaceRecord,
  WorkspaceSummary,
} from "./workspaceTypes";

interface WorkspaceApiRecord {
  id?: string | number;
  _id?: string | number;
  name?: string | null;
  title?: string | null;
  owner_name?: string | null;
  ownerName?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  document_count?: number | null;
  documentCount?: number | null;
}

interface WorkspaceListResponse {
  workspaces?: WorkspaceApiRecord[];
  data?: WorkspaceApiRecord[];
}

const toDisplayDate = (value?: string | null) => {
  if (!value) {
    return "Recently updated";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
};

const normalizeWorkspace = (workspace: WorkspaceApiRecord): WorkspaceRecord => ({
  id: String(workspace.id ?? workspace._id ?? ""),
  name: workspace.name ?? workspace.title ?? "Untitled workspace",
  ownerName: workspace.owner_name ?? workspace.ownerName ?? "Workspace owner",
  updatedAt: toDisplayDate(
    workspace.updated_at ??
      workspace.updatedAt ??
      workspace.created_at ??
      workspace.createdAt
  ),
});

const normalizeWorkspaceSummary = (
  workspace: WorkspaceApiRecord
): WorkspaceSummary => ({
  ...normalizeWorkspace(workspace),
  documentCount:
    workspace.document_count ?? workspace.documentCount ?? undefined,
});

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    axios.isAxiosError(error) &&
    typeof error.response?.data?.error === "string"
  ) {
    return error.response.data.error;
  }

  return fallbackMessage;
};

export const fetchWorkspaces = async (): Promise<WorkspaceSummary[]> => {
  try {
    const response = await api.get<WorkspaceListResponse | WorkspaceApiRecord[]>(
      "/workspaces"
    );

    if (!response.data) {
      return [];
    }

    const workspaces = Array.isArray(response.data)
      ? response.data
      : response.data.workspaces ?? response.data.data ?? [];

    return workspaces
      .map(normalizeWorkspaceSummary)
      .filter((workspace) => workspace.id);
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 404 || error.response?.status === 204)
    ) {
      return [];
    }

    throw new Error(
      getErrorMessage(error, "Failed to load workspaces. Please try again.")
    );
  }
};

export const fetchWorkspaceById = async (
  workspaceId: string
): Promise<WorkspaceSummary | null> => {
  try {
    const response = await api.get<WorkspaceApiRecord>(`/workspaces/${workspaceId}`);
    const workspace = normalizeWorkspaceSummary(response.data);

    return workspace.id ? workspace : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw new Error(
      getErrorMessage(error, "Failed to load workspace. Please try again.")
    );
  }
};

export const createWorkspace = async (
  payload: CreateWorkspacePayload
): Promise<WorkspaceSummary> => {
  const name = payload.name.trim();

  if (!name) {
    throw new Error("Workspace name is required.");
  }

  try {
    const response = await api.post<
      WorkspaceApiRecord | { workspace: WorkspaceApiRecord }
    >("/workspaces", {
      name,
    });

    const workspaceRecord =
      "workspace" in response.data ? response.data.workspace : response.data;
    const workspace = normalizeWorkspaceSummary(workspaceRecord);

    if (!workspace.id) {
      throw new Error("Workspace creation did not return an ID.");
    }

    return {
      ...workspace,
      documentCount: workspace.documentCount ?? 0,
    };
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to create workspace. Please try again.")
    );
  }
};

export const updateWorkspace = async (
  workspaceId: string,
  payload: UpdateWorkspacePayload
): Promise<WorkspaceSummary> => {
  const name = payload.name.trim();

  if (!name) {
    throw new Error("Workspace name is required.");
  }

  try {
    const response = await api.put<
      WorkspaceApiRecord | { workspace: WorkspaceApiRecord }
    >(`/workspaces/${workspaceId}`, {
      name,
    });

    const workspaceRecord =
      "workspace" in response.data ? response.data.workspace : response.data;
    const workspace = normalizeWorkspaceSummary({
      ...workspaceRecord,
      id: workspaceRecord.id ?? workspaceId,
      name,
    });

    return workspace;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to update workspace. Please try again.")
    );
  }
};

export const deleteWorkspace = async (workspaceId: string): Promise<void> => {
  try {
    await api.delete(`/workspaces/${workspaceId}`);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to delete workspace. Please try again.")
    );
  }
};
