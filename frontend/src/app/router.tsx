import { Navigate, createBrowserRouter } from "react-router-dom";
import AuthPage from "../features/auth/pages/AuthPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import HomePage from "../features/auth/pages/HomePage";
import GlobalAuthenticatedLayout from "../shared/components/GlobalAuthenticatedLayout";
import WorkspaceLayout from "../shared/components/WorkspaceLayout";
import WorkspaceHomePage from "../features/workspaces/pages/WorkspaceHomePage";
import WorkspaceDocumentsPage from "../features/workspaces/pages/WorkspaceDocumentsPage";
import TasksPage from "../features/tasks/pages/TasksPage";
import TeamPage from "../features/team/pages/TeamPage";
import SettingsPage from "../features/settings/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <GlobalAuthenticatedLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/home",
        element: <HomePage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "/workspaces/:workspaceId",
    element: (
      <ProtectedRoute>
        <WorkspaceLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="home" replace />,
      },
      {
        path: "home",
        element: <WorkspaceHomePage />,
      },
      {
        path: "documents",
        element: <WorkspaceDocumentsPage />,
      },
      {
        path: "documents/:documentId",
        lazy: async () => {
          const module = await import(
            "../features/documents/pages/DocumentDetailsPage"
          );

          return {
            Component: module.default,
          };
        },
      },
      {
        path: "tasks",
        element: <TasksPage />,
      },
      {
        path: "teams",
        element: <TeamPage />,
      },
    ],
  },
]);
