export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskRecord {
  id: string;
  reference: string;
  workspaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeUserId?: string;
  createdBy: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  assigneeUserId?: string;
  priority: TaskPriority;
  deadline?: string;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
}

export interface UpdateTaskPayload {
  title: string;
  description: string;
  status: TaskStatus;
  assigneeUserId?: string;
  priority: TaskPriority;
  deadline?: string;
}
