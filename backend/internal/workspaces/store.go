package workspaces

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
)

type Workspace struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	OwnerID   string    `json:"owner_id"`
	Role      string    `json:"role,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type Store interface {
	CreateWorkspace(ctx context.Context, userID, name string) (*Workspace, error)
	GetWorkspace(ctx context.Context, workspaceID, userID string) (*Workspace, error)
}

type PostgresStore struct {
	DB *pgxpool.Pool
}

func NewPostgresStore(db *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{DB: db}
}

func (s *PostgresStore) CreateWorkspace(ctx context.Context, userID, name string) (*Workspace, error) {
	tx, err := s.DB.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var ws Workspace
	if err := tx.QueryRow(
		ctx,
		`INSERT INTO workspaces (name, owner_id) VALUES ($1, $2) RETURNING id, name, owner_id, created_at`,
		name,
		userID,
	).Scan(&ws.ID, &ws.Name, &ws.OwnerID, &ws.CreatedAt); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(
		ctx,
		`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')`,
		ws.ID,
		userID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	ws.Role = "owner"
	return &ws, nil
}

func (s *PostgresStore) GetWorkspace(ctx context.Context, workspaceID, userID string) (*Workspace, error) {
	const query = `
		SELECT w.id, w.name, w.owner_id, wm.role, w.created_at
		FROM workspaces w
		JOIN workspace_members wm ON wm.workspace_id = w.id
		WHERE w.id = $1 AND wm.user_id = $2
	`

	var ws Workspace
	if err := s.DB.QueryRow(ctx, query, workspaceID, userID).Scan(
		&ws.ID,
		&ws.Name,
		&ws.OwnerID,
		&ws.Role,
		&ws.CreatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			exists, existsErr := s.workspaceExists(ctx, workspaceID)
			if existsErr != nil {
				return nil, existsErr
			}
			if !exists {
				return nil, ErrWorkspaceNotFound
			}
			return nil, ErrForbidden
		}
		return nil, err
	}

	return &ws, nil
}

func (s *PostgresStore) workspaceExists(ctx context.Context, workspaceID string) (bool, error) {
	var exists bool
	err := s.DB.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM workspaces WHERE id = $1)`, workspaceID).Scan(&exists)
	return exists, err
}
