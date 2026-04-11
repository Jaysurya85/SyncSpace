import type {
  CreateWorkspacePayload,
  WorkspaceRecord,
  WorkspaceSummary,
} from "./workspaceTypes";
import {
  getDocumentsStore,
  getWorkspacesStore,
  setWorkspacesStore,
} from "./workspaceStore";

const MOCK_DELAY_MS = 250;

const wait = (durationMs: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

const formatCurrentDate = () =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

const createWorkspaceId = (name: string) => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `ws-${slug || "untitled"}-${Date.now()}`;
};

const mapToSummary = (workspace: WorkspaceRecord): WorkspaceSummary => ({
  ...workspace,
  documentCount: getDocumentsStore().filter(
    (document) => document.workspaceId === workspace.id
  ).length,
});

export const fetchWorkspaces = async (): Promise<WorkspaceSummary[]> => {
  await wait(MOCK_DELAY_MS);
  return getWorkspacesStore().map(mapToSummary);
};

export const fetchWorkspaceById = async (
  workspaceId: string
): Promise<WorkspaceSummary | null> => {
  await wait(MOCK_DELAY_MS);

  const workspace = getWorkspacesStore().find(
    (currentWorkspace) => currentWorkspace.id === workspaceId
  );

  return workspace ? mapToSummary(workspace) : null;
};

export const createWorkspace = async (
  payload: CreateWorkspacePayload
): Promise<WorkspaceSummary> => {
  const name = payload.name.trim();

  if (!name) {
    throw new Error("Workspace name is required.");
  }

  const newWorkspace: WorkspaceRecord = {
    id: createWorkspaceId(name),
    name,
    description: payload.description.trim(),
    ownerName: "Workspace Guest",
    updatedAt: formatCurrentDate(),
  };

  setWorkspacesStore([newWorkspace, ...getWorkspacesStore()]);
  await wait(MOCK_DELAY_MS);

  return mapToSummary(newWorkspace);
};
