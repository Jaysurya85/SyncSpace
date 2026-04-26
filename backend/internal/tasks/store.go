package tasks

import (
	"context"
	"time"
)

type Task struct {
	ID          string     `json:"id"`
	WorkspaceID string     `json:"workspace_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	Priority    string     `json:"priority"`
	AssignedTo  *string    `json:"assigned_to,omitempty"`
	CreatedBy   string     `json:"created_by"`
	Deadline    *time.Time `json:"deadline,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Store interface {
	CreateTask(ctx context.Context, workspaceID, userID, title, description, priority string, assignedTo *string, deadline *time.Time) (*Task, error)
	ListTasks(ctx context.Context, workspaceID, userID string) ([]Task, error)
	GetTask(ctx context.Context, taskID, userID string) (*Task, error)
	UpdateTask(ctx context.Context, taskID, userID, title, description, status, priority string, assignedTo *string, deadline *time.Time) (*Task, error)
	DeleteTask(ctx context.Context, taskID, userID string) error
}