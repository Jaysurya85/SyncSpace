export interface WorkspaceNavigationItem {
  label: string;
  segment: string;
  shortLabel: string;
  description: string;
}

export const workspaceNavigation: WorkspaceNavigationItem[] = [
  {
    label: "Home",
    segment: "home",
    shortLabel: "HM",
    description: "Workspace overview",
  },
  {
    label: "Documents",
    segment: "documents",
    shortLabel: "DC",
    description: "Docs in this workspace",
  },
  {
    label: "Teams",
    segment: "teams",
    shortLabel: "TM",
    description: "People and roles",
  },
  {
    label: "Tasks",
    segment: "tasks",
    shortLabel: "TS",
    description: "Assigned work",
  },
];
