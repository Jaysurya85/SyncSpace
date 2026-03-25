package documents

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
	ErrDocumentNotFound  = errors.New("document not found")
)

type Document struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspace_id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	CreatedBy   string    `json:"created_by"`
	UpdatedBy   string    `json:"updated_by,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Store interface {
	CreateDocument(ctx context.Context, workspaceID, userID, title, content string) (*Document, error)
	ListDocuments(ctx context.Context, workspaceID, userID string) ([]Document, error)
	GetDocument(ctx context.Context, documentID, userID string) (*Document, error)
	UpdateDocument(ctx context.Context, documentID, userID, title, content string) (*Document, error)
	DeleteDocument(ctx context.Context, documentID, userID string) error
}

type PostgresStore struct {
	DB *pgxpool.Pool
}

func NewPostgresStore(db *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{DB: db}
}

func (s *PostgresStore) CreateDocument(ctx context.Context, workspaceID, userID, title, content string) (*Document, error) {
	if err := s.ensureWorkspaceAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	const query = `
		INSERT INTO documents (workspace_id, title, content, created_by, updated_by)
		VALUES ($1, $2, $3, $4, $4)
		RETURNING id, workspace_id, title, content, created_by, COALESCE(updated_by::text, ''), created_at, updated_at
	`

	var doc Document
	if err := s.DB.QueryRow(ctx, query, workspaceID, title, content, userID).Scan(
		&doc.ID,
		&doc.WorkspaceID,
		&doc.Title,
		&doc.Content,
		&doc.CreatedBy,
		&doc.UpdatedBy,
		&doc.CreatedAt,
		&doc.UpdatedAt,
	); err != nil {
		return nil, err
	}

	return &doc, nil
}

func (s *PostgresStore) ListDocuments(ctx context.Context, workspaceID, userID string) ([]Document, error) {
	if err := s.ensureWorkspaceAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	const query = `
		SELECT id, workspace_id, title, content, created_by, COALESCE(updated_by::text, ''), created_at, updated_at
		FROM documents
		WHERE workspace_id = $1
		ORDER BY updated_at DESC, created_at DESC
	`

	rows, err := s.DB.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []Document
	for rows.Next() {
		var doc Document
		if err := rows.Scan(
			&doc.ID,
			&doc.WorkspaceID,
			&doc.Title,
			&doc.Content,
			&doc.CreatedBy,
			&doc.UpdatedBy,
			&doc.CreatedAt,
			&doc.UpdatedAt,
		); err != nil {
			return nil, err
		}
		documents = append(documents, doc)
	}

	return documents, rows.Err()
}

func (s *PostgresStore) GetDocument(ctx context.Context, documentID, userID string) (*Document, error) {
	if err := s.ensureDocumentAccess(ctx, documentID, userID); err != nil {
		return nil, err
	}

	return s.lookupDocument(ctx, documentID)
}

func (s *PostgresStore) UpdateDocument(ctx context.Context, documentID, userID, title, content string) (*Document, error) {
	if err := s.ensureDocumentAccess(ctx, documentID, userID); err != nil {
		return nil, err
	}

	const query = `
		UPDATE documents
		SET title = $2, content = $3, updated_by = $4, updated_at = NOW()
		WHERE id = $1
		RETURNING id, workspace_id, title, content, created_by, COALESCE(updated_by::text, ''), created_at, updated_at
	`

	var doc Document
	if err := s.DB.QueryRow(ctx, query, documentID, title, content, userID).Scan(
		&doc.ID,
		&doc.WorkspaceID,
		&doc.Title,
		&doc.Content,
		&doc.CreatedBy,
		&doc.UpdatedBy,
		&doc.CreatedAt,
		&doc.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDocumentNotFound
		}
		return nil, err
	}

	return &doc, nil
}

func (s *PostgresStore) DeleteDocument(ctx context.Context, documentID, userID string) error {
	if err := s.ensureDocumentAccess(ctx, documentID, userID); err != nil {
		return err
	}

	tag, err := s.DB.Exec(ctx, `DELETE FROM documents WHERE id = $1`, documentID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrDocumentNotFound
	}

	return nil
}

func (s *PostgresStore) lookupDocument(ctx context.Context, documentID string) (*Document, error) {
	const query = `
		SELECT id, workspace_id, title, content, created_by, COALESCE(updated_by::text, ''), created_at, updated_at
		FROM documents
		WHERE id = $1
	`

	var doc Document
	if err := s.DB.QueryRow(ctx, query, documentID).Scan(
		&doc.ID,
		&doc.WorkspaceID,
		&doc.Title,
		&doc.Content,
		&doc.CreatedBy,
		&doc.UpdatedBy,
		&doc.CreatedAt,
		&doc.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDocumentNotFound
		}
		return nil, err
	}

	return &doc, nil
}

func (s *PostgresStore) ensureWorkspaceAccess(ctx context.Context, workspaceID, userID string) error {
	exists, err := s.workspaceExists(ctx, workspaceID)
	if err != nil {
		return err
	}
	if !exists {
		return ErrWorkspaceNotFound
	}

	member, err := s.isWorkspaceMember(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if !member {
		return ErrForbidden
	}

	return nil
}

func (s *PostgresStore) ensureDocumentAccess(ctx context.Context, documentID, userID string) error {
	workspaceID, err := s.documentWorkspace(ctx, documentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrDocumentNotFound
		}
		return err
	}

	member, err := s.isWorkspaceMember(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if !member {
		return ErrForbidden
	}

	return nil
}

func (s *PostgresStore) workspaceExists(ctx context.Context, workspaceID string) (bool, error) {
	var exists bool
	err := s.DB.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM workspaces WHERE id = $1)`, workspaceID).Scan(&exists)
	return exists, err
}

func (s *PostgresStore) isWorkspaceMember(ctx context.Context, workspaceID, userID string) (bool, error) {
	var exists bool
	err := s.DB.QueryRow(
		ctx,
		`SELECT EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2)`,
		workspaceID,
		userID,
	).Scan(&exists)
	return exists, err
}

func (s *PostgresStore) documentWorkspace(ctx context.Context, documentID string) (string, error) {
	var workspaceID string
	err := s.DB.QueryRow(ctx, `SELECT workspace_id FROM documents WHERE id = $1`, documentID).Scan(&workspaceID)
	return workspaceID, err
}
