const KNOWN_WORKSPACES_STORAGE_KEY = "syncspace-known-workspaces";

const readKnownWorkspaceIds = () => {
  try {
    const rawValue = localStorage.getItem(KNOWN_WORKSPACES_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
};

const writeKnownWorkspaceIds = (workspaceIds: string[]) => {
  localStorage.setItem(
    KNOWN_WORKSPACES_STORAGE_KEY,
    JSON.stringify(Array.from(new Set(workspaceIds)))
  );
};

export const getKnownWorkspaceIds = () => readKnownWorkspaceIds();

export const rememberWorkspaceId = (workspaceId: string) => {
  writeKnownWorkspaceIds([...readKnownWorkspaceIds(), workspaceId]);
};

export const forgetWorkspaceId = (workspaceId: string) => {
  writeKnownWorkspaceIds(
    readKnownWorkspaceIds().filter((knownId) => knownId !== workspaceId)
  );
};
