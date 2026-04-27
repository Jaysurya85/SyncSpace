import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import { useAuth } from "../../auth/useAuth";
import { useWorkspaceShell } from "../../workspaces/workspaceShellContext";
import {
  createWorkspaceTask,
  fetchWorkspaceTasksByAssignee,
  fetchWorkspaceTasks,
  updateTask,
  updateTaskStatus,
} from "../tasksApi";
import type { TaskPriority, TaskRecord, TaskStatus } from "../taskTypes";

const statusOptions: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const statusClasses: Record<TaskStatus, string> = {
  todo: "bg-sky-50 text-sky-700 border-sky-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const priorityClasses: Record<TaskPriority, string> = {
  low: "bg-background text-text-secondary border-border",
  medium: "bg-indigo-50 text-indigo-700 border-indigo-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
};

const boardColumns: {
  status: TaskStatus;
  title: string;
  subtitle: string;
}[] = [
  {
    status: "todo",
    title: "Todo",
    subtitle: "Ready to pick up",
  },
  {
    status: "in_progress",
    title: "In Progress",
    subtitle: "Currently moving",
  },
  {
    status: "done",
    title: "Done",
    subtitle: "Completed work",
  },
];

const formatTaskDate = (value?: string) => {
  if (!value) {
    return "No date";
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

const toDateTimeLocalValue = (value?: string) => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const hours = String(parsedDate.getHours()).padStart(2, "0");
  const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoDateTime = (value: string) => {
  if (!value) {
    return undefined;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate.toISOString();
};

const TaskModalPortal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed left-0 top-0 right-0 bottom-0 z-[80] flex h-screen w-screen items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative z-[81] w-full max-w-2xl rounded-[28px] border border-border bg-surface p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

type TaskScope = "all" | "mine";

const TasksPage = () => {
  const { user } = useAuth();
  const { currentWorkspace, workspaceMembers } = useWorkspaceShell();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [taskScope, setTaskScope] = useState<TaskScope>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [deadline, setDeadline] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("todo");
  const [editAssigneeUserId, setEditAssigneeUserId] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium");
  const [editDeadline, setEditDeadline] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<TaskStatus | null>(
    null
  );
  const isModalOpen = isCreateOpen || editingTask !== null;

  useEffect(() => {
    if (!currentWorkspace) {
      return;
    }

    let isMounted = true;

    const loadTasks = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        let nextTasks: TaskRecord[];

        if (taskScope === "mine") {
          const assignedTasks = await fetchWorkspaceTasksByAssignee(
            currentWorkspace.id,
            user.id
          );

          if (assignedTasks.length > 0) {
            nextTasks = assignedTasks;
          } else {
            const allTasks = await fetchWorkspaceTasks(currentWorkspace.id);
            nextTasks = allTasks.filter((task) => task.assigneeUserId === user.id);
          }
        } else {
          nextTasks = await fetchWorkspaceTasks(currentWorkspace.id);
        }

        if (isMounted) {
          setTasks(nextTasks);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load tasks. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTasks();

    return () => {
      isMounted = false;
    };
  }, [currentWorkspace, taskScope, user.id]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  const filteredTasks = useMemo(
    () =>
      statusFilter === "all"
        ? tasks
        : tasks.filter((task) => task.status === statusFilter),
    [tasks, statusFilter]
  );

  const groupedTasks = useMemo(
    () =>
      boardColumns.map((column) => ({
        ...column,
        tasks: filteredTasks.filter((task) => task.status === column.status),
      })),
    [filteredTasks]
  );

  if (!currentWorkspace) {
    return null;
  }

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const selectedAssignee = workspaceMembers.find(
      (member) => member.userId === assigneeUserId
    );

    if (!trimmedTitle) {
      setFormError("Task title is required.");
      return;
    }

    if (!trimmedDescription) {
      setFormError("Task description is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const createdTask = await createWorkspaceTask(currentWorkspace.id, {
        title: trimmedTitle,
        description: trimmedDescription,
        assigneeUserId: selectedAssignee?.userId,
        priority,
        deadline: toIsoDateTime(deadline),
      });

      setTasks((currentTasks) =>
        taskScope === "mine" && createdTask.assigneeUserId !== user.id
          ? currentTasks
          : [createdTask, ...currentTasks]
      );
      setTitle("");
      setDescription("");
      setAssigneeUserId("");
      setPriority("medium");
      setDeadline("");
      setIsCreateOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create task. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, status: TaskStatus) => {
    try {
      setUpdatingTaskId(taskId);
      setLoadError(null);
      const updatedTask = await updateTaskStatus(taskId, { status });
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Failed to update task status. Please try again."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    taskId: string
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDropTargetStatus(null);
  };

  const handleColumnDragOver = (
    event: React.DragEvent<HTMLElement>,
    status: TaskStatus
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetStatus(status);
  };

  const handleColumnDragLeave = (
    event: React.DragEvent<HTMLElement>,
    status: TaskStatus
  ) => {
    const nextTarget = event.relatedTarget;

    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return;
    }

    if (dropTargetStatus === status) {
      setDropTargetStatus(null);
    }
  };

  const handleColumnDrop = async (
    event: React.DragEvent<HTMLElement>,
    status: TaskStatus
  ) => {
    event.preventDefault();

    const taskId = event.dataTransfer.getData("text/plain") || draggingTaskId;
    setDropTargetStatus(null);
    setDraggingTaskId(null);

    if (!taskId) {
      return;
    }

    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task || task.status === status) {
      return;
    }

    await handleStatusUpdate(taskId, status);
  };

  const openEditModal = (task: TaskRecord) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditStatus(task.status);
    setEditAssigneeUserId(task.assigneeUserId ?? "");
    setEditPriority(task.priority);
    setEditDeadline(toDateTimeLocalValue(task.deadline));
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setEditTitle("");
    setEditDescription("");
    setEditStatus("todo");
    setEditAssigneeUserId("");
    setEditPriority("medium");
    setEditDeadline("");
    setEditError(null);
  };

  const handleEditTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingTask) {
      return;
    }

    const trimmedTitle = editTitle.trim();
    const trimmedDescription = editDescription.trim();
    const selectedAssignee = workspaceMembers.find(
      (member) => member.userId === editAssigneeUserId
    );

    if (!trimmedTitle) {
      setEditError("Task title is required.");
      return;
    }

    if (!trimmedDescription) {
      setEditError("Task description is required.");
      return;
    }

    try {
      setIsEditing(true);
      setEditError(null);

      const updatedTask = await updateTask(editingTask.id, {
        title: trimmedTitle,
        description: trimmedDescription,
        status: editStatus,
        assigneeUserId: selectedAssignee?.userId,
        priority: editPriority,
        deadline: toIsoDateTime(editDeadline),
      });

      setTasks((currentTasks) =>
        taskScope === "mine" && updatedTask.assigneeUserId !== user.id
          ? currentTasks.filter((task) => task.id !== editingTask.id)
          : currentTasks.map((task) =>
              task.id === editingTask.id ? updatedTask : task
            )
      );
      closeEditModal();
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Failed to update task. Please try again."
      );
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Board
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">
              Project board
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
              Organize workspace issues by status. Open a card to edit details,
              change priority, owners, deadlines, or move work through the board.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsCreateOpen(true);
            }}
          >
            + New task
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-background px-4 py-2 text-sm text-text-secondary">
            {tasks.length} total task{tasks.length === 1 ? "" : "s"}
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { value: "all", label: "All tasks" },
              { value: "mine", label: "Assigned to me" },
            ] as { value: TaskScope; label: string }[]).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTaskScope(option.value)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  taskScope === option.value
                    ? "bg-primary text-white"
                    : "border border-border bg-background text-text-secondary hover:border-primary/20 hover:bg-primary-light/40 hover:text-text-primary",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="rounded-full bg-background px-4 py-2 text-sm text-text-secondary">
            {workspaceMembers.length} assignee
            {workspaceMembers.length === 1 ? "" : "s"}
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  statusFilter === option.value
                    ? "bg-primary text-white"
                    : "border border-border bg-background text-text-secondary hover:border-primary/20 hover:bg-primary-light/40 hover:text-text-primary",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loadError ? (
          <div className="mt-5 rounded-2xl border border-danger-border bg-danger-light p-4">
            <p className="text-sm font-medium text-danger">{loadError}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-text-secondary">
            Loading tasks...
          </div>
        ) : null}

        {!isLoading ? (
          <div className="mt-6 overflow-x-auto">
            <div className="grid min-w-[920px] gap-5 xl:min-w-0 xl:grid-cols-3">
              {groupedTasks.map((column) => (
                <section
                  key={column.status}
                  className={[
                    "rounded-[24px] border bg-background/80 p-4 transition",
                    dropTargetStatus === column.status
                      ? "border-primary/40 ring-2 ring-primary/15"
                      : "border-border",
                  ].join(" ")}
                  onDragOver={(event) => handleColumnDragOver(event, column.status)}
                  onDragLeave={(event) =>
                    handleColumnDragLeave(event, column.status)
                  }
                  onDrop={(event) => void handleColumnDrop(event, column.status)}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-text-primary">
                          {column.title}
                        </h3>
                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
                            statusClasses[column.status],
                          ].join(" ")}
                        >
                          {column.tasks.length}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">
                        {column.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setIsCreateOpen(true);
                      }}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary transition hover:border-primary/20 hover:bg-primary-light/40 hover:text-primary"
                    >
                      +
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {column.tasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-6 text-center">
                        <p className="text-sm font-medium text-text-primary">
                          No tasks here
                        </p>
                        <p className="mt-1 text-xs leading-5 text-text-secondary">
                          Move work into {column.title.toLowerCase()} or create a
                          new task.
                        </p>
                      </div>
                    ) : null}

                    {column.tasks.map((task) => (
                      <article
                        key={task.id}
                        className={[
                          "rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/25",
                          draggingTaskId === task.id ? "opacity-55" : "",
                        ].join(" ")}
                        draggable
                        onDragStart={(event) => handleDragStart(event, task.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                          className="block w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="line-clamp-2 text-sm font-semibold text-text-primary">
                                {task.title}
                              </h4>
                              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
                                Issue {task.reference}
                              </p>
                            </div>

                            <span
                              className={[
                                "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
                                statusClasses[task.status],
                              ].join(" ")}
                            >
                              {statusLabels[task.status]}
                            </span>
                          </div>

                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-secondary">
                            {task.description}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-text-secondary">
                            <span
                              className={[
                                "rounded-full border px-3 py-1.5",
                                priorityClasses[task.priority],
                              ].join(" ")}
                            >
                              {priorityLabels[task.priority]}
                            </span>
                            <span className="rounded-full bg-background px-3 py-1.5">
                              {workspaceMembers.find(
                                (member) => member.userId === task.assigneeUserId
                              )?.name ?? "Unassigned"}
                            </span>
                            {task.deadline ? (
                              <span className="rounded-full bg-background px-3 py-1.5">
                                Due {formatTaskDate(task.deadline)}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-background px-3 py-1.5">
                              Updated {formatTaskDate(task.updatedAt)}
                            </span>
                          </div>
                        </button>

                        <div className="mt-4 border-t border-border pt-4">
                          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                            Move card
                          </label>
                          <select
                            value={task.status}
                            onChange={(event) =>
                              void handleStatusUpdate(
                                task.id,
                                event.target.value as TaskStatus
                              )
                            }
                            disabled={updatingTaskId === task.id}
                            className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="todo">Todo</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {isCreateOpen ? (
        <TaskModalPortal
          onClose={() => {
            setIsCreateOpen(false);
            setFormError(null);
          }}
        >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  New task
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                  Create a workspace issue
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setFormError(null);
                }}
                className="rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary transition hover:border-primary/20 hover:bg-background hover:text-text-primary"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-6 space-y-5">
              <Input
                label="Title"
                placeholder="Add keyboard shortcuts to documents"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                error={formError?.toLowerCase().includes("title") ? formError : undefined}
              />

              <div>
                <label className="block text-sm font-medium text-text-primary">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe the task, expected behavior, acceptance notes, or rollout details."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary">
                  Assignee
                </label>
                <select
                  value={assigneeUserId}
                  onChange={(event) => setAssigneeUserId(event.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Unassigned</option>
                  {workspaceMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(event.target.value as TaskPriority)
                    }
                    className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {formError && !formError.toLowerCase().includes("title") ? (
                <p className="text-sm text-danger">{formError}</p>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                  Backend task API
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setFormError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    Create task
                  </Button>
                </div>
              </div>
            </form>
        </TaskModalPortal>
      ) : null}

      {editingTask ? (
        <TaskModalPortal onClose={closeEditModal}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Edit task
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                  Update issue {editingTask.reference}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary transition hover:border-primary/20 hover:bg-background hover:text-text-primary"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditTask} className="mt-6 space-y-5">
              <Input
                label="Title"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                error={editError?.toLowerCase().includes("title") ? editError : undefined}
              />

              <div>
                <label className="block text-sm font-medium text-text-primary">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value as TaskStatus)}
                    className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Assignee
                  </label>
                  <select
                    value={editAssigneeUserId}
                    onChange={(event) => setEditAssigneeUserId(event.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Unassigned</option>
                    {workspaceMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(event) =>
                      setEditPriority(event.target.value as TaskPriority)
                    }
                    className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={editDeadline}
                    onChange={(event) => setEditDeadline(event.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary transition focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {editError && !editError.toLowerCase().includes("title") ? (
                <p className="text-sm text-danger">{editError}</p>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                  Backend task API
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={isEditing}>
                    Save changes
                  </Button>
                </div>
              </div>
            </form>
        </TaskModalPortal>
      ) : null}
    </section>
  );
};

export default TasksPage;
