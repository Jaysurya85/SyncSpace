import type {
  CreateTaskPayload,
  TaskRecord,
  TaskStatus,
  UpdateTaskPayload,
  UpdateTaskStatusPayload,
} from "./taskTypes";

const TASKS_STORAGE_KEY = "syncspace-tasks";

const toDisplayDate = (value?: string | null) => {
  if (!value) {
    return "Recently updated";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
};

const readTasks = (): TaskRecord[] => {
  const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);

  if (!storedTasks) {
    return [];
  }

  try {
    return JSON.parse(storedTasks) as TaskRecord[];
  } catch {
    localStorage.removeItem(TASKS_STORAGE_KEY);
    return [];
  }
};

const writeTasks = (tasks: TaskRecord[]) => {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
};

const formatTask = (task: TaskRecord): TaskRecord => ({
  ...task,
  createdAt: toDisplayDate(task.createdAt),
  updatedAt: toDisplayDate(task.updatedAt),
});

const createSeedTasks = (workspaceId: string): TaskRecord[] => {
  const timestamp = new Date().toISOString();

  return [
    {
      id: `${workspaceId}-task-1`,
      number: 1,
      workspaceId,
      title: "Set up workspace task workflow",
      description:
        "Create the first issue-style task flow for this workspace so the team can track work before the backend task APIs are available.",
      status: "open",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: `${workspaceId}-task-2`,
      number: 2,
      workspaceId,
      title: "Review initial priorities",
      description:
        "Capture the first high-priority tasks that should move into active work this week.",
      status: "in_progress",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
};

const ensureWorkspaceSeedTasks = (workspaceId: string) => {
  const tasks = readTasks();
  const workspaceTasks = tasks.filter((task) => task.workspaceId === workspaceId);

  if (workspaceTasks.length > 0) {
    return tasks;
  }

  const seededTasks = [...tasks, ...createSeedTasks(workspaceId)];
  writeTasks(seededTasks);
  return seededTasks;
};

const getNextTaskNumber = (tasks: TaskRecord[], workspaceId: string) =>
  tasks
    .filter((task) => task.workspaceId === workspaceId)
    .reduce((maxNumber, task) => Math.max(maxNumber, task.number), 0) + 1;

export const fetchWorkspaceTasks = async (
  workspaceId: string
): Promise<TaskRecord[]> => {
  const tasks = ensureWorkspaceSeedTasks(workspaceId);

  return tasks
    .filter((task) => task.workspaceId === workspaceId)
    .sort((leftTask, rightTask) => rightTask.number - leftTask.number)
    .map(formatTask);
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

  const tasks = ensureWorkspaceSeedTasks(workspaceId);
  const timestamp = new Date().toISOString();
  const nextTaskNumber = getNextTaskNumber(tasks, workspaceId);
  const task: TaskRecord = {
    id: `${workspaceId}-task-${nextTaskNumber}-${Date.now()}`,
    number: nextTaskNumber,
    workspaceId,
    title,
    description,
    status: "open",
    assigneeUserId: payload.assigneeUserId,
    assigneeName: payload.assigneeName,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  writeTasks([...tasks, task]);

  return formatTask(task);
};

export const updateTaskStatus = async (
  taskId: string,
  payload: UpdateTaskStatusPayload
): Promise<TaskRecord> => {
  const tasks = readTasks();
  const task = tasks.find((currentTask) => currentTask.id === taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  const nextStatus: TaskStatus = payload.status;
  const updatedTask: TaskRecord = {
    ...task,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  writeTasks(
    tasks.map((currentTask) =>
      currentTask.id === taskId ? updatedTask : currentTask
    )
  );

  return formatTask(updatedTask);
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

  const tasks = readTasks();
  const task = tasks.find((currentTask) => currentTask.id === taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  const updatedTask: TaskRecord = {
    ...task,
    title,
    description,
    status: payload.status,
    assigneeUserId: payload.assigneeUserId,
    assigneeName: payload.assigneeName,
    updatedAt: new Date().toISOString(),
  };

  writeTasks(
    tasks.map((currentTask) =>
      currentTask.id === taskId ? updatedTask : currentTask
    )
  );

  return formatTask(updatedTask);
};
