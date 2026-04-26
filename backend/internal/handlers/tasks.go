package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"syncspace-backend/internal/middleware"
	"syncspace-backend/internal/tasks"
)

type TaskHandler struct {
	Store tasks.Store
}

type CreateTaskRequest struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Priority    string     `json:"priority"`
	AssignedTo  *string    `json:"assigned_to,omitempty"`
	Deadline    *time.Time `json:"deadline,omitempty"`
}

type UpdateTaskRequest struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	Priority    string     `json:"priority"`
	AssignedTo  *string    `json:"assigned_to,omitempty"`
	Deadline    *time.Time `json:"deadline,omitempty"`
}

type AssignTaskRequest struct {
	AssignedTo string `json:"assigned_to"`
}

func NewTaskHandler(store tasks.Store) *TaskHandler {
	return &TaskHandler{Store: store}
}

// CreateTask creates a new task in a workspace.
// @Summary      Create task
// @Description  Create a new task inside a workspace. Only workspace members can create tasks.
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        workspace_id path string true "Workspace ID"
// @Param        request body CreateTaskRequest true "Task payload"
// @Success      201  {object}  tasks.Task
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces/{workspace_id}/tasks [post]
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	workspaceID := r.PathValue("workspace_id")
	if workspaceID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "workspace_id is required"})
		return
	}

	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "title is required"})
		return
	}

	if req.Priority == "" {
		req.Priority = "medium"
	}
	req.AssignedTo = normalizeOptionalString(req.AssignedTo)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	task, err := h.Store.CreateTask(
		ctx,
		workspaceID,
		claims.UserID,
		req.Title,
		req.Description,
		req.Priority,
		req.AssignedTo,
		req.Deadline,
	)
	if err != nil {
		h.writeTaskStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, task)
}

// ListTasks lists all tasks in a workspace.
// @Summary      List workspace tasks
// @Description  List all tasks in a workspace. Only workspace members can view tasks.
// @Tags         tasks
// @Produce      json
// @Security     BearerAuth
// @Param        workspace_id path string true "Workspace ID"
// @Success      200  {array}   tasks.Task
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces/{workspace_id}/tasks [get]
func (h *TaskHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	workspaceID := r.PathValue("workspace_id")
	if workspaceID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "workspace_id is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	tasksList, err := h.Store.ListTasks(ctx, workspaceID, claims.UserID)
	if err != nil {
		h.writeTaskStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, tasksList)
}

// ListTasksByAssignee lists workspace tasks assigned to a user.
// @Summary      List tasks by assignee
// @Description  List tasks in a workspace assigned to a specific workspace member. Only workspace members can view tasks.
// @Tags         tasks
// @Produce      json
// @Security     BearerAuth
// @Param        workspace_id path string true "Workspace ID"
// @Param        assignee_id path string true "Assignee user ID"
// @Success      200  {array}   tasks.Task
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces/{workspace_id}/tasks/assignees/{assignee_id} [get]
func (h *TaskHandler) ListTasksByAssignee(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	workspaceID := r.PathValue("workspace_id")
	if workspaceID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "workspace_id is required"})
		return
	}

	assigneeID := strings.TrimSpace(r.PathValue("assignee_id"))
	if assigneeID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "assignee_id is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	tasksList, err := h.Store.ListTasksByAssignee(ctx, workspaceID, assigneeID, claims.UserID)
	if err != nil {
		h.writeTaskStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, tasksList)
}

// GetTask fetches a task by ID.
// @Summary      Get task
// @Description  Get a single task by ID. Only workspace members can access tasks.
// @Tags         tasks
// @Produce      json
// @Security     BearerAuth
// @Param        task_id path string true "Task ID"
// @Success      200  {object}  tasks.Task
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/tasks/{task_id} [get]
func (h *TaskHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	taskID := r.PathValue("task_id")
	if taskID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "task_id is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	task, err := h.Store.GetTask(ctx, taskID, claims.UserID)
	if err != nil {
		h.writeTaskStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, task)
}

// UpdateTask updates an existing task.
// @Summary      Update task
// @Description  Update task details. Only workspace members can update tasks.
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        task_id path string true "Task ID"
// @Param        request body UpdateTaskRequest true "Updated task payload"
// @Success      200  {object}  tasks.Task
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/tasks/{task_id} [put]
func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	taskID := r.PathValue("task_id")
	if taskID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "task_id is required"})
		return
	}

	var req UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "title is required"})
		return
	}
	req.AssignedTo = normalizeOptionalString(req.AssignedTo)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	task, err := h.Store.UpdateTask(
		ctx,
		taskID,
		claims.UserID,
		req.Title,
		req.Description,
		req.Status,
		req.Priority,
		req.AssignedTo,
		req.Deadline,
	)
	if err != nil {
		h.writeTaskStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, task)
}

// AssignTask assigns a task to a workspace member.
// @Summary      Assign task
// @Description  Assign a task to a workspace member. Only workspace members can assign tasks.
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        task_id path string true "Task ID"
// @Param        request body AssignTaskRequest true "Assignee payload"
// @Success      200  {object}  tasks.Task
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/tasks/{task_id}/assign [put]
func (h *TaskHandler) AssignTask(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	taskID := r.PathValue("task_id")
	if taskID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "task_id is required"})
		return
	}

	var req AssignTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid request body"})
		return
	}

	req.AssignedTo = strings.TrimSpace(req.AssignedTo)
	if req.AssignedTo == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "assigned_to is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	task, err := h.Store.AssignTask(ctx, taskID, claims.UserID, req.AssignedTo)
	if err != nil {
		h.writeTaskStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, task)
}

// DeleteTask deletes a task by ID.
// @Summary      Delete task
// @Description  Delete a task by ID. Only workspace members can delete tasks.
// @Tags         tasks
// @Produce      json
// @Security     BearerAuth
// @Param        task_id path string true "Task ID"
// @Success      204
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/tasks/{task_id} [delete]
func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	taskID := r.PathValue("task_id")
	if taskID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "task_id is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := h.Store.DeleteTask(ctx, taskID, claims.UserID); err != nil {
		h.writeTaskStoreError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *TaskHandler) writeTaskStoreError(w http.ResponseWriter, err error) {
	log.Printf("Task store error: %v", err)

	switch {
	case errors.Is(err, tasks.ErrForbidden):
		writeJSON(w, http.StatusForbidden, ErrorResponse{Error: "access denied"})
	case errors.Is(err, tasks.ErrWorkspaceNotFound):
		writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "workspace not found"})
	case errors.Is(err, tasks.ErrTaskNotFound):
		writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "task not found"})
	case errors.Is(err, tasks.ErrAssigneeNotFound):
		writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "assignee not found"})
	default:
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
	}
}

func normalizeOptionalString(value *string) *string {
	if value == nil {
		return nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}

	return &trimmed
}
