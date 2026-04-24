import axios from "axios";
import { api } from "../../services/api";
import type {
  AddWorkspaceMemberPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  WorkspaceMember,
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
  owner_id?: string | null;
  ownerId?: string | null;
  role?: string | null;
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

interface WorkspaceMemberApiRecord {
  workspace_id?: string | null;
  workspaceId?: string | null;
  user_id?: string | null;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  joined_at?: string | null;
  joinedAt?: string | null;
}

interface WorkspaceMemberListResponse {
  members?: WorkspaceMemberApiRecord[];
  data?: WorkspaceMemberApiRecord[];
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
  ownerId: workspace.owner_id ?? workspace.ownerId ?? undefined,
  role: workspace.role ?? undefined,
  updatedAt: toDisplayDate(
    workspace.updated_at ??
      workspace.updatedAt ??
      workspace.created_at ??
      workspace.createdAt
  ),
  createdAt: workspace.created_at ?? workspace.createdAt ?? undefined,
});

const normalizeWorkspaceSummary = (
  workspace: WorkspaceApiRecord
): WorkspaceSummary => ({
  ...normalizeWorkspace(workspace),
  documentCount:
    workspace.document_count ?? workspace.documentCount ?? undefined,
});

const normalizeWorkspaceMember = (
  member: WorkspaceMemberApiRecord
): WorkspaceMember => ({
  workspaceId: String(member.workspace_id ?? member.workspaceId ?? ""),
  userId: String(member.user_id ?? member.userId ?? ""),
  email: member.email ?? "",
  name: member.name ?? "Workspace member",
  role: member.role ?? "member",
  joinedAt: toDisplayDate(member.joined_at ?? member.joinedAt),
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

export const fetchWorkspaceMembers = async (
  workspaceId: string
): Promise<WorkspaceMember[]> => {
  try {
    const response = await api.get<
      WorkspaceMemberListResponse | WorkspaceMemberApiRecord[]
    >(`/workspaces/${workspaceId}/members`);

    if (!response.data) {
      return [];
    }

    const members = Array.isArray(response.data)
      ? response.data
      : response.data.members ?? response.data.data ?? [];

    return members
      .map(normalizeWorkspaceMember)
      .filter((member) => member.userId && member.workspaceId);
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 404 || error.response?.status === 204)
    ) {
      return [];
    }

    throw new Error(
      getErrorMessage(
        error,
        "Failed to load workspace members. Please try again."
      )
    );
  }
};

export const addWorkspaceMember = async (
  workspaceId: string,
  payload: AddWorkspaceMemberPayload
): Promise<WorkspaceMember> => {
  const userId = payload.userId?.trim();
  const email = payload.email?.trim();

  if (!userId && !email) {
    throw new Error("A user ID or email is required.");
  }

  try {
    const response = await api.post<
      WorkspaceMemberApiRecord | { member: WorkspaceMemberApiRecord }
    >(`/workspaces/${workspaceId}/members`, userId ? { user_id: userId } : { email });

    const memberRecord =
      "member" in response.data ? response.data.member : response.data;
    const member = normalizeWorkspaceMember(memberRecord);

    if (!member.userId) {
      throw new Error("Member creation did not return a user ID.");
    }

    return member;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to add workspace member. Please try again.")
    );
  }
};

export const removeWorkspaceMember = async (
  workspaceId: string,
  userId: string
): Promise<void> => {
  try {
    await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Failed to remove workspace member. Please try again."
      )
    );
  }
};
