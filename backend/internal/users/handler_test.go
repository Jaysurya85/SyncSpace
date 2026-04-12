package users

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
)

type fakeUserStore struct {
	createFn     func(ctx context.Context, email, name, profilePic string) (*User, error)
	getByIDFn    func(ctx context.Context, userID string) (*User, error)
	getByEmailFn func(ctx context.Context, email string) (*User, error)
	updateFn     func(ctx context.Context, userID, name, profilePic string) (*User, error)
	deleteFn     func(ctx context.Context, userID string) error
	listFn       func(ctx context.Context, limit, offset int) ([]User, error)
}

func (f *fakeUserStore) CreateUser(ctx context.Context, email, name, profilePic string) (*User, error) {
	return f.createFn(ctx, email, name, profilePic)
}

func (f *fakeUserStore) GetUserByID(ctx context.Context, userID string) (*User, error) {
	return f.getByIDFn(ctx, userID)
}

func (f *fakeUserStore) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	return f.getByEmailFn(ctx, email)
}

func (f *fakeUserStore) UpdateUser(ctx context.Context, userID, name, profilePic string) (*User, error) {
	return f.updateFn(ctx, userID, name, profilePic)
}

func (f *fakeUserStore) DeleteUser(ctx context.Context, userID string) error {
	return f.deleteFn(ctx, userID)
}

func (f *fakeUserStore) ListUsers(ctx context.Context, limit, offset int) ([]User, error) {
	return f.listFn(ctx, limit, offset)
}

func testClaimsContext(req *http.Request, userID string) *http.Request {
	return req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: userID}))
}

func TestCreateUser(t *testing.T) {
	handler := NewUserHandler(&fakeUserStore{
		createFn: func(ctx context.Context, email, name, profilePic string) (*User, error) {
			return &User{
				ID:         "user-1",
				Email:      email,
				Name:       name,
				ProfilePic: profilePic,
				CreatedAt:  time.Now(),
				UpdatedAt:  time.Now(),
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/api/users", strings.NewReader(`{"email":"test@example.com","name":"Test User","profile_pic":"https://example.com/pic.png"}`))
	rec := httptest.NewRecorder()

	handler.CreateUser(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	var got User
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.Email != "test@example.com" || got.Name != "Test User" {
		t.Fatalf("unexpected response: %+v", got)
	}
}

func TestCreateUserConflict(t *testing.T) {
	handler := NewUserHandler(&fakeUserStore{
		createFn: func(ctx context.Context, email, name, profilePic string) (*User, error) {
			return nil, ErrUserExists
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/api/users", strings.NewReader(`{"email":"test@example.com","name":"Test User"}`))
	rec := httptest.NewRecorder()

	handler.CreateUser(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", rec.Code)
	}
}

func TestGetCurrentUser(t *testing.T) {
	handler := NewUserHandler(&fakeUserStore{
		getByIDFn: func(ctx context.Context, userID string) (*User, error) {
			return &User{ID: userID, Email: "me@example.com", Name: "Me", CreatedAt: time.Now(), UpdatedAt: time.Now()}, nil
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/users/me", nil)
	req = testClaimsContext(req, "user-1")
	rec := httptest.NewRecorder()

	handler.GetCurrentUser(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestGetUserUnauthorized(t *testing.T) {
	handler := NewUserHandler(&fakeUserStore{})
	req := httptest.NewRequest(http.MethodGet, "/api/users/user-1", nil)
	req.SetPathValue("user_id", "user-1")
	rec := httptest.NewRecorder()

	handler.GetUser(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestUpdateUserForbidden(t *testing.T) {
	handler := NewUserHandler(&fakeUserStore{
		updateFn: func(ctx context.Context, userID, name, profilePic string) (*User, error) {
			return nil, errors.New("should not be called")
		},
	})

	req := httptest.NewRequest(http.MethodPut, "/api/users/user-2", strings.NewReader(`{"name":"Changed"}`))
	req.SetPathValue("user_id", "user-2")
	req = testClaimsContext(req, "user-1")
	rec := httptest.NewRecorder()

	handler.UpdateUser(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}

func TestUpdateUser(t *testing.T) {
	handler := NewUserHandler(&fakeUserStore{
		updateFn: func(ctx context.Context, userID, name, profilePic string) (*User, error) {
			return &User{
				ID:         userID,
				Email:      "test@example.com",
				Name:       name,
				ProfilePic: profilePic,
				CreatedAt:  time.Now(),
				UpdatedAt:  time.Now(),
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodPut, "/api/users/user-1", strings.NewReader(`{"name":"Changed","profile_pic":"https://example.com/new.png"}`))
	req.SetPathValue("user_id", "user-1")
	req = testClaimsContext(req, "user-1")
	rec := httptest.NewRecorder()

	handler.UpdateUser(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestDeleteUser(t *testing.T) {
	handler := NewUserHandler(&fakeUserStore{
		deleteFn: func(ctx context.Context, userID string) error {
			if userID != "user-1" {
				t.Fatalf("unexpected userID: %s", userID)
			}
			return nil
		},
	})

	req := httptest.NewRequest(http.MethodDelete, "/api/users/user-1", nil)
	req.SetPathValue("user_id", "user-1")
	req = testClaimsContext(req, "user-1")
	rec := httptest.NewRecorder()

	handler.DeleteUser(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
}

func TestListUsers(t *testing.T) {
	handler := NewUserHandler(&fakeUserStore{
		listFn: func(ctx context.Context, limit, offset int) ([]User, error) {
			if limit != 10 || offset != 5 {
				t.Fatalf("unexpected pagination: limit=%d offset=%d", limit, offset)
			}
			return []User{
				{ID: "user-1", Email: "one@example.com", Name: "One", CreatedAt: time.Now(), UpdatedAt: time.Now()},
				{ID: "user-2", Email: "two@example.com", Name: "Two", CreatedAt: time.Now(), UpdatedAt: time.Now()},
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/users?limit=10&offset=5", nil)
	req = testClaimsContext(req, "user-1")
	rec := httptest.NewRecorder()

	handler.ListUsers(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestListUsersUnauthorized(t *testing.T) {
	handler := NewUserHandler(&fakeUserStore{})
	req := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	rec := httptest.NewRecorder()

	handler.ListUsers(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}
