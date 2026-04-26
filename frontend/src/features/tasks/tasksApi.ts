import axios from "axios";
import { api } from "../../services/api";
import type {
  CreateTaskPayload,
  TaskPriority,
  TaskRecord,
  TaskStatus,
  UpdateTaskPayload,
  UpdateTaskStatusPayload,
} from "./taskTypes";

interface TaskApiRecord {
  id?: string | number;
  workspace_id?: string | number | null;
  workspaceId?: string | number | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  assigned_to?: string | null;
  assignedTo?: string | null;
  created_by?: string | null;
  createdBy?: string | null;
  deadline?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
}

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    axios.isAxiosError(error) &&
    typeof error.response?.data?.error === "string"
  ) {
    return error.response.data.error;
  }

  return fallbackMessage;
};

const normalizeStatus = (status?: string | null): TaskStatus => {
  switch (status) {
    case "in_progress":
      return "in_progress";
    case "done":
      return "done";
    case "todo":
    default:
      return "todo";
  }
};

const normalizePriority = (priority?: string | null): TaskPriority => {
  switch (priority) {
    case "low":
      return "low";
    case "high":
      return "high";
    case "medium":
    default:
      return "medium";
  }
};

const createTaskReference = (taskId: string) =>
  taskId.length > 8 ? taskId.slice(0, 8).toUpperCase() : taskId.toUpperCase();

const normalizeTask = (task: TaskApiRecord): TaskRecord => {
  const id = String(task.id ?? "");

  return {
    id,
    reference: createTaskReference(id),
    workspaceId: String(task.workspace_id ?? task.workspaceId ?? ""),
    title: task.title ?? "Untitled task",
    description: task.description ?? "",
    status: normalizeStatus(task.status),
    priority: normalizePriority(task.priority),
    assigneeUserId: task.assigned_to ?? task.assignedTo ?? undefined,
    createdBy: String(task.created_by ?? task.createdBy ?? ""),
    deadline: task.deadline ?? undefined,
    createdAt: task.created_at ?? task.createdAt ?? "",
    updatedAt: task.updated_at ?? task.updatedAt ?? "",
  };
};

export const fetchWorkspaceTasks = async (
  workspaceId: string
): Promise<TaskRecord[]> => {
  try {
    const response = await api.get<TaskApiRecord[]>(`/workspaces/${workspaceId}/tasks`);

    if (!Array.isArray(response.data)) {
      return [];
    }

    return response.data
      .map(normalizeTask)
      .filter((task) => task.id)
      .sort((leftTask, rightTask) =>
        rightTask.updatedAt.localeCompare(leftTask.updatedAt)
      );
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 404 || error.response?.status === 204)
    ) {
      return [];
    }

    throw new Error(
      getErrorMessage(error, "Failed to load tasks. Please try again.")
    );
  }
};

export const fetchWorkspaceTasksByAssignee = async (
  workspaceId: string,
  assigneeId: string
): Promise<TaskRecord[]> => {
  try {
    const response = await api.get<TaskApiRecord[]>(
      `/workspaces/${workspaceId}/tasks/assignees/${assigneeId}`
    );

    if (!Array.isArray(response.data)) {
      return [];
    }

    return response.data
      .map(normalizeTask)
      .filter((task) => task.id)
      .sort((leftTask, rightTask) =>
        rightTask.updatedAt.localeCompare(leftTask.updatedAt)
      );
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
        "Failed to load assigned tasks. Please try again."
      )
    );
  }
};

export const createWorkspaceTask = async (
  workspaceId: string,
  payload: CreateTaskPayload
): Promise<TaskRecord> => {
  const title = payload.title.trim();
  const description = payload.description.trim();

  if (!title) {
    throw new Error("Task title is required.");
  }

  if (!description) {
    throw new Error("Task description is required.");
  }

  try {
    const response = await api.post<TaskApiRecord>(`/workspaces/${workspaceId}/tasks`, {
      title,
      description,
      priority: payload.priority,
      ...(payload.assigneeUserId ? { assigned_to: payload.assigneeUserId } : {}),
      ...(payload.deadline ? { deadline: payload.deadline } : {}),
    });

    return normalizeTask(response.data);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to create task. Please try again.")
    );
  }
};

export const updateTaskStatus = async (
  taskId: string,
  payload: UpdateTaskStatusPayload
): Promise<TaskRecord> => {
  try {
    const existingTask = await fetchTaskById(taskId);

    if (!existingTask) {
      throw new Error("Task not found.");
    }

    const response = await api.put<TaskApiRecord>(`/tasks/${taskId}`, {
      title: existingTask.title,
      description: existingTask.description,
      status: payload.status,
      priority: existingTask.priority,
      ...(existingTask.assigneeUserId
        ? { assigned_to: existingTask.assigneeUserId }
        : {}),
      ...(existingTask.deadline ? { deadline: existingTask.deadline } : {}),
    });

    return normalizeTask(response.data);
  } catch (error) {
    if (error instanceof Error && error.message === "Task not found.") {
      throw error;
    }

    throw new Error(
      getErrorMessage(error, "Failed to update task status. Please try again.")
    );
  }
};

export const updateTask = async (
  taskId: string,
  payload: UpdateTaskPayload
): Promise<TaskRecord> => {
  const title = payload.title.trim();
  const description = payload.description.trim();

  if (!title) {
    throw new Error("Task title is required.");
  }

  if (!description) {
    throw new Error("Task description is required.");
  }

  try {
    const response = await api.put<TaskApiRecord>(`/tasks/${taskId}`, {
      title,
      description,
      status: payload.status,
      priority: payload.priority,
      ...(payload.assigneeUserId ? { assigned_to: payload.assigneeUserId } : {}),
      ...(payload.deadline ? { deadline: payload.deadline } : {}),
    });

    return normalizeTask(response.data);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to update task. Please try again.")
    );
  }
};

export const fetchTaskById = async (taskId: string): Promise<TaskRecord | null> => {
  try {
    const response = await api.get<TaskApiRecord>(`/tasks/${taskId}`);
    const task = normalizeTask(response.data);

    return task.id ? task : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw new Error(
      getErrorMessage(error, "Failed to load task. Please try again.")
    );
  }
};
