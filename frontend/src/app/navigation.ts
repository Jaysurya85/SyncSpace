export interface AppNavigationItem {
  label: string;
  path: string;
  shortLabel: string;
  description: string;
}

export const appNavigation: AppNavigationItem[] = [
  {
    label: "Home",
    path: "/home",
    shortLabel: "HM",
    description: "Workspace overview",
  },
  {
    label: "Documents",
    path: "/documents",
    shortLabel: "DC",
    description: "Drafts and files",
  },
  {
    label: "Tasks",
    path: "/tasks",
    shortLabel: "TS",
    description: "Assigned work",
  },
  {
    label: "Team",
    path: "/team",
    shortLabel: "TM",
    description: "People and roles",
  },
  {
    label: "Chat",
    path: "/chat",
    shortLabel: "CH",
    description: "Project conversations",
  },
  {
    label: "Settings",
    path: "/settings",
    shortLabel: "ST",
    description: "Workspace preferences",
  },
];
