package tasks

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrForbidden         = errors.New("forbidden")
	ErrWorkspaceNotFound = errors.New("workspace not found")
	ErrTaskNotFound      = errors.New("task not found")
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

type PostgresStore struct {
	DB *pgxpool.Pool
}

func NewPostgresStore(db *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{DB: db}
}

func (s *PostgresStore) CreateTask(
	ctx context.Context,
	workspaceID, userID, title, description, priority string,
	assignedTo *string,
	deadline *time.Time,
) (*Task, error) {
	const query = `
		INSERT INTO tasks (
			workspace_id,
			title,
			description,
			priority,
			assigned_to,
			created_by,
			deadline
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, workspace_id, title, description, status, priority,
		          assigned_to, created_by, deadline, created_at, updated_at
	`

	var task Task

	err := s.DB.QueryRow(
		ctx,
		query,
		workspaceID,
		title,
		description,
		priority,
		assignedTo,
		userID,
		deadline,
	).Scan(
		&task.ID,
		&task.WorkspaceID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Priority,
		&task.AssignedTo,
		&task.CreatedBy,
		&task.Deadline,
		&task.CreatedAt,
		&task.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &task, nil
}

func (s *PostgresStore) ListTasks(
	ctx context.Context,
	workspaceID, userID string,
) ([]Task, error) {
	const query = `
		SELECT id, workspace_id, title, description, status, priority,
		       assigned_to, created_by, deadline, created_at, updated_at
		FROM tasks
		WHERE workspace_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.DB.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []Task

	for rows.Next() {
		var task Task
		if err := rows.Scan(
			&task.ID,
			&task.WorkspaceID,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.Priority,
			&task.AssignedTo,
			&task.CreatedBy,
			&task.Deadline,
			&task.CreatedAt,
			&task.UpdatedAt,
		); err != nil {
			return nil, err
		}

		tasks = append(tasks, task)
	}

	return tasks, rows.Err()
}

func (s *PostgresStore) GetTask(
	ctx context.Context,
	taskID, userID string,
) (*Task, error) {
	const query = `
		SELECT id, workspace_id, title, description, status, priority,
		       assigned_to, created_by, deadline, created_at, updated_at
		FROM tasks
		WHERE id = $1
	`

	var task Task

	err := s.DB.QueryRow(ctx, query, taskID).Scan(
		&task.ID,
		&task.WorkspaceID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Priority,
		&task.AssignedTo,
		&task.CreatedBy,
		&task.Deadline,
		&task.CreatedAt,
		&task.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrTaskNotFound
	}
	if err != nil {
		return nil, err
	}

	return &task, nil
}

func (s *PostgresStore) UpdateTask(
	ctx context.Context,
	taskID, userID, title, description, status, priority string,
	assignedTo *string,
	deadline *time.Time,
) (*Task, error) {
	const query = `
		UPDATE tasks
		SET title = $2,
		    description = $3,
		    status = $4,
		    priority = $5,
		    assigned_to = $6,
		    deadline = $7,
		    updated_at = NOW()
		WHERE id = $1
		RETURNING id, workspace_id, title, description, status, priority,
		          assigned_to, created_by, deadline, created_at, updated_at
	`

	var task Task

	err := s.DB.QueryRow(
		ctx,
		query,
		taskID,
		title,
		description,
		status,
		priority,
		assignedTo,
		deadline,
	).Scan(
		&task.ID,
		&task.WorkspaceID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Priority,
		&task.AssignedTo,
		&task.CreatedBy,
		&task.Deadline,
		&task.CreatedAt,
		&task.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrTaskNotFound
	}
	if err != nil {
		return nil, err
	}

	return &task, nil
}

func (s *PostgresStore) DeleteTask(
	ctx context.Context,
	taskID, userID string,
) error {
	tag, err := s.DB.Exec(ctx, `DELETE FROM tasks WHERE id = $1`, taskID)
	if err != nil {
		return err
	}

	if tag.RowsAffected() == 0 {
		return ErrTaskNotFound
	}

	return nil
}