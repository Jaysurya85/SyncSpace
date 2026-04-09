import { createBrowserRouter } from "react-router-dom";
import AuthPage from "../features/auth/pages/AuthPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import HomePage from "../features/auth/pages/HomePage";
import Layout from "../shared/components/Layout";
import DocumentsPage from "../features/documents/pages/DocumentsPage";
import TasksPage from "../features/tasks/pages/TasksPage";
import TeamPage from "../features/team/pages/TeamPage";
import ChatPage from "../features/chat/pages/ChatPage";
import SettingsPage from "../features/settings/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/home",
        element: <HomePage />,
      },
      {
        path: "/documents",
        element: <DocumentsPage />,
      },
      {
        path: "/documents/:id",
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
        path: "/tasks",
        element: <TasksPage />,
      },
      {
        path: "/team",
        element: <TeamPage />,
      },
      {
        path: "/chat",
        element: <ChatPage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
    ],
  },
]);
