import type { DocumentRecord } from "../documents/documentTypes";
import type { WorkspaceRecord } from "./workspaceTypes";
import {
  initialWorkspaceDocuments,
  initialWorkspaces,
} from "./workspacesDummyData";

let workspacesStore = [...initialWorkspaces];
let documentsStore = [...initialWorkspaceDocuments];

export const getWorkspacesStore = () => workspacesStore;

export const setWorkspacesStore = (nextWorkspaces: WorkspaceRecord[]) => {
  workspacesStore = nextWorkspaces;
};

export const getDocumentsStore = () => documentsStore;

export const setDocumentsStore = (nextDocuments: DocumentRecord[]) => {
  documentsStore = nextDocuments;
};
