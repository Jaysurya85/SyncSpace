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
	ErrUserNotFound      = errors.New("user not found")
)

type Workspace struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	OwnerID   string    `json:"owner_id"`
	Role      string    `json:"role,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type WorkspaceMember struct {
	WorkspaceID string    `json:"workspace_id"`
	UserID      string    `json:"user_id"`
	Email       string    `json:"email"`
	Name        string    `json:"name"`
	Role        string    `json:"role"`
	JoinedAt    time.Time `json:"joined_at"`
}

type Store interface {
	CreateWorkspace(ctx context.Context, userID, name string) (*Workspace, error)
	ListWorkspaces(ctx context.Context, userID string) ([]Workspace, error)
	GetWorkspace(ctx context.Context, workspaceID, userID string) (*Workspace, error)
	UpdateWorkspace(ctx context.Context, workspaceID, ownerUserID, name string) (*Workspace, error)
	AddMember(ctx context.Context, workspaceID, ownerUserID, memberUserID, memberEmail string) (*WorkspaceMember, error)
	DeleteWorkspace(ctx context.Context, workspaceID, ownerUserID string) error
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

func (s *PostgresStore) ListWorkspaces(ctx context.Context, userID string) ([]Workspace, error) {
	const query = `
		SELECT w.id, w.name, w.owner_id, wm.role, w.created_at
		FROM workspace_members wm
		JOIN workspaces w ON w.id = wm.workspace_id
		WHERE wm.user_id = $1
		ORDER BY w.created_at DESC, w.name ASC
	`

	rows, err := s.DB.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workspaces []Workspace
	for rows.Next() {
		var ws Workspace
		if err := rows.Scan(&ws.ID, &ws.Name, &ws.OwnerID, &ws.Role, &ws.CreatedAt); err != nil {
			return nil, err
		}
		workspaces = append(workspaces, ws)
	}

	return workspaces, rows.Err()
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

func (s *PostgresStore) UpdateWorkspace(ctx context.Context, workspaceID, ownerUserID, name string) (*Workspace, error) {
	if err := s.ensureOwnerAccess(ctx, workspaceID, ownerUserID); err != nil {
		return nil, err
	}

	const query = `
		UPDATE workspaces
		SET name = $2
		WHERE id = $1
		RETURNING id, name, owner_id, created_at
	`

	var ws Workspace
	if err := s.DB.QueryRow(ctx, query, workspaceID, name).Scan(&ws.ID, &ws.Name, &ws.OwnerID, &ws.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, err
	}

	ws.Role = "owner"
	return &ws, nil
}

func (s *PostgresStore) AddMember(ctx context.Context, workspaceID, ownerUserID, memberUserID, memberEmail string) (*WorkspaceMember, error) {
	if err := s.ensureOwnerAccess(ctx, workspaceID, ownerUserID); err != nil {
		return nil, err
	}

	memberID, email, name, err := s.lookupUser(ctx, memberUserID, memberEmail)
	if err != nil {
		return nil, err
	}

	const query = `
		WITH upsert AS (
			INSERT INTO workspace_members (workspace_id, user_id, role)
			VALUES ($1, $2, 'member')
			ON CONFLICT (workspace_id, user_id) DO UPDATE
			SET role = workspace_members.role
			RETURNING workspace_id, user_id, role, joined_at
		)
		SELECT upsert.workspace_id, upsert.user_id, $3, $4, upsert.role, upsert.joined_at
		FROM upsert
	`

	var member WorkspaceMember
	if err := s.DB.QueryRow(ctx, query, workspaceID, memberID, email, name).Scan(
		&member.WorkspaceID,
		&member.UserID,
		&member.Email,
		&member.Name,
		&member.Role,
		&member.JoinedAt,
	); err != nil {
		return nil, err
	}

	return &member, nil
}

func (s *PostgresStore) DeleteWorkspace(ctx context.Context, workspaceID, ownerUserID string) error {
	if err := s.ensureOwnerAccess(ctx, workspaceID, ownerUserID); err != nil {
		return err
	}

	tag, err := s.DB.Exec(ctx, `DELETE FROM workspaces WHERE id = $1`, workspaceID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrWorkspaceNotFound
	}

	return nil
}

func (s *PostgresStore) ensureOwnerAccess(ctx context.Context, workspaceID, userID string) error {
	exists, err := s.workspaceExists(ctx, workspaceID)
	if err != nil {
		return err
	}
	if !exists {
		return ErrWorkspaceNotFound
	}

	owner, err := s.isWorkspaceOwner(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if !owner {
		return ErrForbidden
	}

	return nil
}

func (s *PostgresStore) workspaceExists(ctx context.Context, workspaceID string) (bool, error) {
	var exists bool
	err := s.DB.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM workspaces WHERE id = $1)`, workspaceID).Scan(&exists)
	return exists, err
}

func (s *PostgresStore) isWorkspaceOwner(ctx context.Context, workspaceID, userID string) (bool, error) {
	var exists bool
	err := s.DB.QueryRow(
		ctx,
		`SELECT EXISTS (SELECT 1 FROM workspaces WHERE id = $1 AND owner_id = $2)`,
		workspaceID,
		userID,
	).Scan(&exists)
	return exists, err
}

func (s *PostgresStore) lookupUser(ctx context.Context, userID, email string) (string, string, string, error) {
	var (
		id   string
		name string
		mail string
		err  error
	)

	switch {
	case userID != "":
		err = s.DB.QueryRow(ctx, `SELECT id, email, name FROM users WHERE id::text = $1`, userID).Scan(&id, &mail, &name)
	case email != "":
		err = s.DB.QueryRow(ctx, `SELECT id, email, name FROM users WHERE lower(email) = lower($1)`, email).Scan(&id, &mail, &name)
	default:
		return "", "", "", ErrUserNotFound
	}

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", "", "", ErrUserNotFound
		}
		return "", "", "", err
	}

	return id, mail, name, nil
}
