import { createBrowserRouter } from "react-router-dom";
import AuthPage from "../features/auth/pages/AuthPage";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import HomePage from "../features/auth/pages/HomePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthPage />,
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
]);
