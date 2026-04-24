export type TaskStatus = "open" | "in_progress" | "closed";

export interface TaskRecord {
  id: string;
  number: number;
  workspaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeUserId?: string;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  assigneeUserId?: string;
  assigneeName?: string;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
}

export interface UpdateTaskPayload {
  title: string;
  description: string;
  status: TaskStatus;
  assigneeUserId?: string;
  assigneeName?: string;
}
