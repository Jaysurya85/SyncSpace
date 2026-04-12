package users

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrUserExists   = errors.New("user already exists")
	ErrInvalidInput = errors.New("invalid input")
)

type User struct {
	ID         string    `json:"id"`
	Email      string    `json:"email"`
	Name       string    `json:"name"`
	ProfilePic string    `json:"profile_pic,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Store interface {
	CreateUser(ctx context.Context, email, name, profilePic string) (*User, error)
	GetUserByID(ctx context.Context, userID string) (*User, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	UpdateUser(ctx context.Context, userID, name, profilePic string) (*User, error)
	DeleteUser(ctx context.Context, userID string) error
	ListUsers(ctx context.Context, limit, offset int) ([]User, error)
}

type PostgresStore struct {
	DB *pgxpool.Pool
}

func NewPostgresStore(db *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{DB: db}
}

// CreateUser creates a new user in the database
func (s *PostgresStore) CreateUser(ctx context.Context, email, name, profilePic string) (*User, error) {
	if email == "" || name == "" {
		return nil, ErrInvalidInput
	}

	const query = `
		INSERT INTO users (email, name, profile_pic)
		VALUES ($1, $2, $3)
		RETURNING id, email, name, COALESCE(profile_pic, ''), created_at, COALESCE(updated_at, NOW())
	`

	var user User
	err := s.DB.QueryRow(ctx, query, email, name, profilePic).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.ProfilePic,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrUserExists
		}
		return nil, err
	}

	return &user, nil
}

// GetUserByID retrieves a user by their ID
func (s *PostgresStore) GetUserByID(ctx context.Context, userID string) (*User, error) {
	const query = `
		SELECT id, email, name, COALESCE(profile_pic, ''), created_at, COALESCE(updated_at, NOW())
		FROM users
		WHERE id = $1
	`

	var user User
	err := s.DB.QueryRow(ctx, query, userID).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.ProfilePic,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

// GetUserByEmail retrieves a user by their email
func (s *PostgresStore) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	const query = `
		SELECT id, email, name, COALESCE(profile_pic, ''), created_at, COALESCE(updated_at, NOW())
		FROM users
		WHERE email = $1
	`

	var user User
	err := s.DB.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.ProfilePic,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

// UpdateUser updates a user's information
func (s *PostgresStore) UpdateUser(ctx context.Context, userID, name, profilePic string) (*User, error) {
	if userID == "" {
		return nil, ErrInvalidInput
	}

	// First check if user exists
	_, err := s.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	const query = `
		UPDATE users
		SET name = COALESCE(NULLIF($2, ''), name),
		    profile_pic = COALESCE(NULLIF($3, ''), profile_pic),
		    updated_at = NOW()
		WHERE id = $1
		RETURNING id, email, name, COALESCE(profile_pic, ''), created_at, updated_at
	`

	var user User
	err = s.DB.QueryRow(ctx, query, userID, name, profilePic).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.ProfilePic,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// DeleteUser deletes a user from the database
func (s *PostgresStore) DeleteUser(ctx context.Context, userID string) error {
	if userID == "" {
		return ErrInvalidInput
	}

	const query = `
		DELETE FROM users
		WHERE id = $1
	`

	result, err := s.DB.Exec(ctx, query, userID)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

// ListUsers retrieves a paginated list of users
func (s *PostgresStore) ListUsers(ctx context.Context, limit, offset int) ([]User, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	const query = `
		SELECT id, email, name, COALESCE(profile_pic, ''), created_at, COALESCE(updated_at, NOW())
		FROM users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := s.DB.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Name,
			&user.ProfilePic,
			&user.CreatedAt,
			&user.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}
