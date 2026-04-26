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
	ErrAssigneeNotFound  = errors.New("assignee not found")
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
	ListTasksByAssignee(ctx context.Context, workspaceID, assigneeID, userID string) ([]Task, error)
	GetTask(ctx context.Context, taskID, userID string) (*Task, error)
	AssignTask(ctx context.Context, taskID, userID, assigneeID string) (*Task, error)
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
	if err := s.ensureMemberAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	if err := s.ensureAssigneeAccess(ctx, workspaceID, assignedTo); err != nil {
		return nil, err
	}

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
		VALUES ($1::uuid, $2, $3, $4, $5::uuid, $6::uuid, $7)
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
	if err := s.ensureMemberAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	const query = `
		SELECT id, workspace_id, title, description, status, priority,
		       assigned_to, created_by, deadline, created_at, updated_at
		FROM tasks
		WHERE workspace_id::text = $1
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

func (s *PostgresStore) ListTasksByAssignee(
	ctx context.Context,
	workspaceID, assigneeID, userID string,
) ([]Task, error) {
	if err := s.ensureMemberAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	if err := s.ensureAssigneeAccess(ctx, workspaceID, &assigneeID); err != nil {
		return nil, err
	}

	const query = `
		SELECT id, workspace_id, title, description, status, priority,
		       assigned_to, created_by, deadline, created_at, updated_at
		FROM tasks
		WHERE workspace_id::text = $1 AND assigned_to::text = $2
		ORDER BY created_at DESC
	`

	rows, err := s.DB.Query(ctx, query, workspaceID, assigneeID)
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
		WHERE id::text = $1
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

	if err := s.ensureMemberAccess(ctx, task.WorkspaceID, userID); err != nil {
		return nil, err
	}

	return &task, nil
}

func (s *PostgresStore) AssignTask(
	ctx context.Context,
	taskID, userID, assigneeID string,
) (*Task, error) {
	workspaceID, err := s.getTaskWorkspaceID(ctx, taskID)
	if err != nil {
		return nil, err
	}

	if err := s.ensureMemberAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	if err := s.ensureAssigneeAccess(ctx, workspaceID, &assigneeID); err != nil {
		return nil, err
	}

	const query = `
		UPDATE tasks
		SET assigned_to = $2::uuid,
		    updated_at = NOW()
		WHERE id::text = $1
		RETURNING id, workspace_id, title, description, status, priority,
		          assigned_to, created_by, deadline, created_at, updated_at
	`

	var task Task

	err = s.DB.QueryRow(ctx, query, taskID, assigneeID).Scan(
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
	workspaceID, err := s.getTaskWorkspaceID(ctx, taskID)
	if err != nil {
		return nil, err
	}

	if err := s.ensureMemberAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	if err := s.ensureAssigneeAccess(ctx, workspaceID, assignedTo); err != nil {
		return nil, err
	}

	const query = `
		UPDATE tasks
		SET title = $2,
		    description = $3,
		    status = $4,
		    priority = $5,
		    assigned_to = $6::uuid,
		    deadline = $7,
		    updated_at = NOW()
		WHERE id::text = $1
		RETURNING id, workspace_id, title, description, status, priority,
		          assigned_to, created_by, deadline, created_at, updated_at
	`

	var task Task

	err = s.DB.QueryRow(
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
	workspaceID, err := s.getTaskWorkspaceID(ctx, taskID)
	if err != nil {
		return err
	}

	if err := s.ensureMemberAccess(ctx, workspaceID, userID); err != nil {
		return err
	}

	tag, err := s.DB.Exec(ctx, `DELETE FROM tasks WHERE id::text = $1`, taskID)
	if err != nil {
		return err
	}

	if tag.RowsAffected() == 0 {
		return ErrTaskNotFound
	}

	return nil
}

func (s *PostgresStore) getTaskWorkspaceID(ctx context.Context, taskID string) (string, error) {
	var workspaceID string
	err := s.DB.QueryRow(ctx, `SELECT workspace_id FROM tasks WHERE id::text = $1`, taskID).Scan(&workspaceID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrTaskNotFound
	}
	if err != nil {
		return "", err
	}
	return workspaceID, nil
}

func (s *PostgresStore) ensureMemberAccess(ctx context.Context, workspaceID, userID string) error {
	var isMember bool
	err := s.DB.QueryRow(
		ctx,
		`SELECT EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id::text = $1 AND user_id::text = $2)`,
		workspaceID,
		userID,
	).Scan(&isMember)
	if err != nil {
		return err
	}
	if isMember {
		return nil
	}

	var workspaceExists bool
	err = s.DB.QueryRow(
		ctx,
		`SELECT EXISTS (SELECT 1 FROM workspaces WHERE id::text = $1)`,
		workspaceID,
	).Scan(&workspaceExists)
	if err != nil {
		return err
	}
	if !workspaceExists {
		return ErrWorkspaceNotFound
	}

	return ErrForbidden
}

func (s *PostgresStore) ensureAssigneeAccess(ctx context.Context, workspaceID string, assigneeID *string) error {
	if assigneeID == nil {
		return nil
	}

	var isMember bool
	err := s.DB.QueryRow(
		ctx,
		`SELECT EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id::text = $1 AND user_id::text = $2)`,
		workspaceID,
		*assigneeID,
	).Scan(&isMember)
	if err != nil {
		return err
	}
	if !isMember {
		return ErrAssigneeNotFound
	}

	return nil
}
