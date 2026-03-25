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
	"syncspace-backend/internal/workspaces"
)

type fakeWorkspaceStore struct {
	createFn func(ctx context.Context, userID, name string) (*workspaces.Workspace, error)
	getFn    func(ctx context.Context, workspaceID, userID string) (*workspaces.Workspace, error)
}

func (f *fakeWorkspaceStore) CreateWorkspace(ctx context.Context, userID, name string) (*workspaces.Workspace, error) {
	return f.createFn(ctx, userID, name)
}

func (f *fakeWorkspaceStore) GetWorkspace(ctx context.Context, workspaceID, userID string) (*workspaces.Workspace, error) {
	return f.getFn(ctx, workspaceID, userID)
}

func TestCreateWorkspace(t *testing.T) {
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		createFn: func(ctx context.Context, userID, name string) (*workspaces.Workspace, error) {
			return &workspaces.Workspace{
				ID:        "ws-1",
				Name:      name,
				OwnerID:   userID,
				Role:      "owner",
				CreatedAt: time.Now(),
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/api/workspaces", strings.NewReader(`{"name":"Engineering"}`))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.CreateWorkspace(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	var got workspaces.Workspace
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.Name != "Engineering" || got.OwnerID != "user-1" || got.Role != "owner" {
		t.Fatalf("unexpected response: %+v", got)
	}
}

func TestCreateWorkspaceRequiresName(t *testing.T) {
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		createFn: func(ctx context.Context, userID, name string) (*workspaces.Workspace, error) {
			return nil, errors.New("should not be called")
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/api/workspaces", strings.NewReader(`{"name":"   "}`))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.CreateWorkspace(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestGetWorkspaceForbidden(t *testing.T) {
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		getFn: func(ctx context.Context, workspaceID, userID string) (*workspaces.Workspace, error) {
			return nil, workspaces.ErrForbidden
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/workspaces/ws-1", nil)
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-2"}))
	rec := httptest.NewRecorder()

	handler.GetWorkspace(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}

func TestGetWorkspace(t *testing.T) {
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		getFn: func(ctx context.Context, workspaceID, userID string) (*workspaces.Workspace, error) {
			return &workspaces.Workspace{
				ID:        workspaceID,
				Name:      "Engineering",
				OwnerID:   "user-1",
				Role:      "member",
				CreatedAt: time.Now(),
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/workspaces/ws-1", nil)
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.GetWorkspace(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}
