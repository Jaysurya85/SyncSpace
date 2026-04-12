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
	listFn   func(ctx context.Context, userID string) ([]workspaces.Workspace, error)
	getFn    func(ctx context.Context, workspaceID, userID string) (*workspaces.Workspace, error)
	updateFn func(ctx context.Context, workspaceID, ownerUserID, name string) (*workspaces.Workspace, error)
	addFn    func(ctx context.Context, workspaceID, ownerUserID, memberUserID, memberEmail string) (*workspaces.WorkspaceMember, error)
	deleteFn func(ctx context.Context, workspaceID, ownerUserID string) error
}

func (f *fakeWorkspaceStore) CreateWorkspace(ctx context.Context, userID, name string) (*workspaces.Workspace, error) {
	return f.createFn(ctx, userID, name)
}

func (f *fakeWorkspaceStore) ListWorkspaces(ctx context.Context, userID string) ([]workspaces.Workspace, error) {
	return f.listFn(ctx, userID)
}

func (f *fakeWorkspaceStore) GetWorkspace(ctx context.Context, workspaceID, userID string) (*workspaces.Workspace, error) {
	return f.getFn(ctx, workspaceID, userID)
}

func (f *fakeWorkspaceStore) UpdateWorkspace(ctx context.Context, workspaceID, ownerUserID, name string) (*workspaces.Workspace, error) {
	return f.updateFn(ctx, workspaceID, ownerUserID, name)
}

func (f *fakeWorkspaceStore) AddMember(ctx context.Context, workspaceID, ownerUserID, memberUserID, memberEmail string) (*workspaces.WorkspaceMember, error) {
	return f.addFn(ctx, workspaceID, ownerUserID, memberUserID, memberEmail)
}

func (f *fakeWorkspaceStore) DeleteWorkspace(ctx context.Context, workspaceID, ownerUserID string) error {
	return f.deleteFn(ctx, workspaceID, ownerUserID)
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

func TestListWorkspaces(t *testing.T) {
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		listFn: func(ctx context.Context, userID string) ([]workspaces.Workspace, error) {
			if userID != "user-1" {
				t.Fatalf("unexpected user id: %s", userID)
			}
			return []workspaces.Workspace{
				{
					ID:        "ws-1",
					Name:      "Engineering",
					OwnerID:   "owner-1",
					Role:      "member",
					CreatedAt: time.Now(),
				},
				{
					ID:        "ws-2",
					Name:      "Design",
					OwnerID:   "user-1",
					Role:      "owner",
					CreatedAt: time.Now(),
				},
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/workspaces", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.ListWorkspaces(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var got []workspaces.Workspace
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("expected 2 workspaces, got %d", len(got))
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

func TestUpdateWorkspace(t *testing.T) {
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		updateFn: func(ctx context.Context, workspaceID, ownerUserID, name string) (*workspaces.Workspace, error) {
			if workspaceID != "ws-1" || ownerUserID != "owner-1" || name != "Platform" {
				t.Fatalf("unexpected update args: %s %s %s", workspaceID, ownerUserID, name)
			}
			return &workspaces.Workspace{
				ID:        workspaceID,
				Name:      name,
				OwnerID:   ownerUserID,
				Role:      "owner",
				CreatedAt: time.Now(),
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodPut, "/api/workspaces/ws-1", strings.NewReader(`{"name":"Platform"}`))
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "owner-1"}))
	rec := httptest.NewRecorder()

	handler.UpdateWorkspace(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var got workspaces.Workspace
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.Name != "Platform" || got.Role != "owner" {
		t.Fatalf("unexpected response: %+v", got)
	}
}

func TestUpdateWorkspaceRequiresName(t *testing.T) {
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		updateFn: func(ctx context.Context, workspaceID, ownerUserID, name string) (*workspaces.Workspace, error) {
			return nil, errors.New("should not be called")
		},
	})

	req := httptest.NewRequest(http.MethodPut, "/api/workspaces/ws-1", strings.NewReader(`{"name":"   "}`))
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "owner-1"}))
	rec := httptest.NewRecorder()

	handler.UpdateWorkspace(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestAddMemberByEmail(t *testing.T) {
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		addFn: func(ctx context.Context, workspaceID, ownerUserID, memberUserID, memberEmail string) (*workspaces.WorkspaceMember, error) {
			if workspaceID != "ws-1" || ownerUserID != "owner-1" || memberUserID != "" || memberEmail != "member@example.com" {
				t.Fatalf("unexpected add member args: %s %s %s %s", workspaceID, ownerUserID, memberUserID, memberEmail)
			}
			return &workspaces.WorkspaceMember{
				WorkspaceID: workspaceID,
				UserID:      "user-2",
				Email:       memberEmail,
				Name:        "Member User",
				Role:        "member",
				JoinedAt:    time.Now(),
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-1/members", strings.NewReader(`{"email":"member@example.com"}`))
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "owner-1"}))
	rec := httptest.NewRecorder()

	handler.AddMember(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	var got workspaces.WorkspaceMember
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.UserID != "user-2" || got.Email != "member@example.com" || got.Role != "member" {
		t.Fatalf("unexpected response: %+v", got)
	}
}

func TestAddMemberRequiresSingleIdentifier(t *testing.T) {
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		addFn: func(ctx context.Context, workspaceID, ownerUserID, memberUserID, memberEmail string) (*workspaces.WorkspaceMember, error) {
			return nil, errors.New("should not be called")
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-1/members", strings.NewReader(`{"email":"member@example.com","user_id":"user-2"}`))
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "owner-1"}))
	rec := httptest.NewRecorder()

	handler.AddMember(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestDeleteWorkspaceForbidden(t *testing.T) {
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		deleteFn: func(ctx context.Context, workspaceID, ownerUserID string) error {
			return workspaces.ErrForbidden
		},
	})

	req := httptest.NewRequest(http.MethodDelete, "/api/workspaces/ws-1", nil)
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-2"}))
	rec := httptest.NewRecorder()

	handler.DeleteWorkspace(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}

func TestDeleteWorkspace(t *testing.T) {
	called := false
	handler := NewWorkspaceHandler(&fakeWorkspaceStore{
		deleteFn: func(ctx context.Context, workspaceID, ownerUserID string) error {
			called = true
			if workspaceID != "ws-1" || ownerUserID != "owner-1" {
				t.Fatalf("unexpected delete args: %s %s", workspaceID, ownerUserID)
			}
			return nil
		},
	})

	req := httptest.NewRequest(http.MethodDelete, "/api/workspaces/ws-1", nil)
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "owner-1"}))
	rec := httptest.NewRecorder()

	handler.DeleteWorkspace(rec, req)

	if !called {
		t.Fatal("expected delete store call")
	}
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
}
