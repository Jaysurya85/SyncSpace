import axios from "axios";
import { api } from "../../services/api";
import { fetchWorkspaceDocuments } from "../documents/documentApi";
import { forgetWorkspaceId, getKnownWorkspaceIds, rememberWorkspaceId } from "./workspaceRegistry";
import type {
  CreateWorkspacePayload,
  WorkspaceRecord,
  WorkspaceSummary,
} from "./workspaceTypes";

interface WorkspaceApiRecord {
  id?: string | number;
  _id?: string | number;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  summary?: string | null;
  owner_name?: string | null;
  ownerName?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
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
  description: workspace.description ?? workspace.summary ?? "",
  ownerName: workspace.owner_name ?? workspace.ownerName ?? "Workspace owner",
  updatedAt: toDisplayDate(
    workspace.updated_at ??
      workspace.updatedAt ??
      workspace.created_at ??
      workspace.createdAt
  ),
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

const toWorkspaceSummary = async (
  workspace: WorkspaceRecord
): Promise<WorkspaceSummary> => {
  const documents = await fetchWorkspaceDocuments(workspace.id);

  return {
    ...workspace,
    documentCount: documents.length,
  };
};

export const fetchWorkspaceById = async (
  workspaceId: string
): Promise<WorkspaceSummary | null> => {
  try {
    const response = await api.get<WorkspaceApiRecord>(`/workspaces/${workspaceId}`);
    const workspace = normalizeWorkspace(response.data);

    if (!workspace.id) {
      return null;
    }

    rememberWorkspaceId(workspace.id);
    return toWorkspaceSummary(workspace);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      forgetWorkspaceId(workspaceId);
      return null;
    }

    throw new Error(
      getErrorMessage(error, "Failed to load workspace. Please try again.")
    );
  }
};

export const fetchWorkspaces = async (): Promise<WorkspaceSummary[]> => {
  const workspaceIds = getKnownWorkspaceIds();

  if (workspaceIds.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    workspaceIds.map((workspaceId) => fetchWorkspaceById(workspaceId))
  );

  return results.flatMap((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      return [result.value];
    }

    if (result.status === "fulfilled" && !result.value) {
      forgetWorkspaceId(workspaceIds[index]);
    }

    return [];
  });
};

export const createWorkspace = async (
  payload: CreateWorkspacePayload
): Promise<WorkspaceSummary> => {
  const name = payload.name.trim();

  if (!name) {
    throw new Error("Workspace name is required.");
  }

  try {
    const response = await api.post<WorkspaceApiRecord | { workspace: WorkspaceApiRecord }>(
      "/workspaces",
      {
        name,
        description: payload.description.trim(),
      }
    );

    const workspaceRecord =
      "workspace" in response.data ? response.data.workspace : response.data;
    const workspace = normalizeWorkspace(workspaceRecord);

    if (!workspace.id) {
      throw new Error("Workspace creation did not return an ID.");
    }

    rememberWorkspaceId(workspace.id);
    return {
      ...workspace,
      documentCount: 0,
    };
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to create workspace. Please try again.")
    );
  }
};
