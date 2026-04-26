package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"syncspace-backend/internal/auth"
	"syncspace-backend/internal/middleware"
	"syncspace-backend/internal/tasks"
)

type fakeTaskStore struct {
	createFn func(ctx context.Context, workspaceID, userID, title, description, priority string, assignedTo *string, deadline *time.Time) (*tasks.Task, error)
	listFn   func(ctx context.Context, workspaceID, userID string) ([]tasks.Task, error)
	getFn    func(ctx context.Context, taskID, userID string) (*tasks.Task, error)
	updateFn func(ctx context.Context, taskID, userID, title, description, status, priority string, assignedTo *string, deadline *time.Time) (*tasks.Task, error)
	deleteFn func(ctx context.Context, taskID, userID string) error
}

func (f *fakeTaskStore) CreateTask(ctx context.Context, workspaceID, userID, title, description, priority string, assignedTo *string, deadline *time.Time) (*tasks.Task, error) {
	return f.createFn(ctx, workspaceID, userID, title, description, priority, assignedTo, deadline)
}

func (f *fakeTaskStore) ListTasks(ctx context.Context, workspaceID, userID string) ([]tasks.Task, error) {
	return f.listFn(ctx, workspaceID, userID)
}

func (f *fakeTaskStore) GetTask(ctx context.Context, taskID, userID string) (*tasks.Task, error) {
	return f.getFn(ctx, taskID, userID)
}

func (f *fakeTaskStore) UpdateTask(ctx context.Context, taskID, userID, title, description, status, priority string, assignedTo *string, deadline *time.Time) (*tasks.Task, error) {
	return f.updateFn(ctx, taskID, userID, title, description, status, priority, assignedTo, deadline)
}

func (f *fakeTaskStore) DeleteTask(ctx context.Context, taskID, userID string) error {
	return f.deleteFn(ctx, taskID, userID)
}

func authContext(req *http.Request, userID string) *http.Request {
	return req.WithContext(
		context.WithValue(
			req.Context(),
			middleware.UserContextKey,
			&auth.Claims{UserID: userID},
		),
	)
}

func TestCreateTaskUnauthorized(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{})

	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-1/tasks", nil)
	req.SetPathValue("workspace_id", "ws-1")

	rec := httptest.NewRecorder()
	handler.CreateTask(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestCreateTaskInvalidJSON(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{})

	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-1/tasks", strings.NewReader(`bad-json`))
	req.SetPathValue("workspace_id", "ws-1")
	req = authContext(req, "user-1")

	rec := httptest.NewRecorder()
	handler.CreateTask(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestCreateTaskRequiresTitle(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{})

	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-1/tasks", strings.NewReader(`{"title":"   "}`))
	req.SetPathValue("workspace_id", "ws-1")
	req = authContext(req, "user-1")

	rec := httptest.NewRecorder()
	handler.CreateTask(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestCreateTask(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{
		createFn: func(ctx context.Context, workspaceID, userID, title, description, priority string, assignedTo *string, deadline *time.Time) (*tasks.Task, error) {
			return &tasks.Task{
				ID:          "task-1",
				WorkspaceID: workspaceID,
				Title:       title,
				Description: description,
				Priority:    priority,
				Status:      "todo",
				CreatedBy:   userID,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}, nil
		},
	})

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/workspaces/ws-1/tasks",
		strings.NewReader(`{"title":"Task 1","description":"Do work","priority":"high"}`),
	)
	req.SetPathValue("workspace_id", "ws-1")
	req = authContext(req, "user-1")

	rec := httptest.NewRecorder()
	handler.CreateTask(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	var got tasks.Task
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if got.Title != "Task 1" {
		t.Fatalf("unexpected title: %s", got.Title)
	}
}

func TestListTasksUnauthorized(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{})

	req := httptest.NewRequest(http.MethodGet, "/api/workspaces/ws-1/tasks", nil)
	req.SetPathValue("workspace_id", "ws-1")

	rec := httptest.NewRecorder()
	handler.ListTasks(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestListTasks(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{
		listFn: func(ctx context.Context, workspaceID, userID string) ([]tasks.Task, error) {
			return []tasks.Task{
				{ID: "task-1", Title: "Task 1"},
				{ID: "task-2", Title: "Task 2"},
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/workspaces/ws-1/tasks", nil)
	req.SetPathValue("workspace_id", "ws-1")
	req = authContext(req, "user-1")

	rec := httptest.NewRecorder()
	handler.ListTasks(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var got []tasks.Task
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(got) != 2 {
		t.Fatalf("expected 2 tasks, got %d", len(got))
	}
}

func TestGetTaskNotFound(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{
		getFn: func(ctx context.Context, taskID, userID string) (*tasks.Task, error) {
			return nil, tasks.ErrTaskNotFound
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/task-404", nil)
	req.SetPathValue("task_id", "task-404")
	req = authContext(req, "user-1")

	rec := httptest.NewRecorder()
	handler.GetTask(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
}

func TestGetTask(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{
		getFn: func(ctx context.Context, taskID, userID string) (*tasks.Task, error) {
			return &tasks.Task{
				ID:    taskID,
				Title: "Task 1",
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/task-1", nil)
	req.SetPathValue("task_id", "task-1")
	req = authContext(req, "user-1")

	rec := httptest.NewRecorder()
	handler.GetTask(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestUpdateTaskInvalidJSON(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{})

	req := httptest.NewRequest(http.MethodPut, "/api/tasks/task-1", strings.NewReader(`bad-json`))
	req.SetPathValue("task_id", "task-1")
	req = authContext(req, "user-1")

	rec := httptest.NewRecorder()
	handler.UpdateTask(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestUpdateTask(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{
		updateFn: func(ctx context.Context, taskID, userID, title, description, status, priority string, assignedTo *string, deadline *time.Time) (*tasks.Task, error) {
			return &tasks.Task{
				ID:       taskID,
				Title:    title,
				Status:   status,
				Priority: priority,
			}, nil
		},
	})

	req := httptest.NewRequest(
		http.MethodPut,
		"/api/tasks/task-1",
		strings.NewReader(`{"title":"Updated Task","description":"updated","status":"done","priority":"low"}`),
	)
	req.SetPathValue("task_id", "task-1")
	req = authContext(req, "user-1")

	rec := httptest.NewRecorder()
	handler.UpdateTask(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestDeleteTask(t *testing.T) {
	called := false

	handler := NewTaskHandler(&fakeTaskStore{
		deleteFn: func(ctx context.Context, taskID, userID string) error {
			called = true
			return nil
		},
	})

	req := httptest.NewRequest(http.MethodDelete, "/api/tasks/task-1", nil)
	req.SetPathValue("task_id", "task-1")
	req = authContext(req, "user-1")

	rec := httptest.NewRecorder()
	handler.DeleteTask(rec, req)

	if !called {
		t.Fatal("expected delete store call")
	}

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
}

func TestDeleteTaskForbidden(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{
		deleteFn: func(ctx context.Context, taskID, userID string) error {
			return tasks.ErrForbidden
		},
	})

	req := httptest.NewRequest(http.MethodDelete, "/api/tasks/task-1", nil)
	req.SetPathValue("task_id", "task-1")
	req = authContext(req, "user-2")

	rec := httptest.NewRecorder()
	handler.DeleteTask(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}

func TestCreateTaskInternalError(t *testing.T) {
	handler := NewTaskHandler(&fakeTaskStore{
		createFn: func(ctx context.Context, workspaceID, userID, title, description, priority string, assignedTo *string, deadline *time.Time) (*tasks.Task, error) {
			return nil, errors.New("db failed")
		},
	})

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/workspaces/ws-1/tasks",
		strings.NewReader(`{"title":"Task 1"}`),
	)
	req.SetPathValue("workspace_id", "ws-1")
	req = authContext(req, "user-1")

	rec := httptest.NewRecorder()
	handler.CreateTask(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rec.Code)
	}
}