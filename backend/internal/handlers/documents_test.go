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
	"syncspace-backend/internal/documents"
	"syncspace-backend/internal/middleware"
)

type fakeDocumentStore struct {
	createFn func(ctx context.Context, workspaceID, userID, title, content string) (*documents.Document, error)
	listFn   func(ctx context.Context, workspaceID, userID string) ([]documents.Document, error)
	getFn    func(ctx context.Context, documentID, userID string) (*documents.Document, error)
	updateFn func(ctx context.Context, documentID, userID, title, content string) (*documents.Document, error)
	deleteFn func(ctx context.Context, documentID, userID string) error
}

func (f *fakeDocumentStore) CreateDocument(ctx context.Context, workspaceID, userID, title, content string) (*documents.Document, error) {
	return f.createFn(ctx, workspaceID, userID, title, content)
}

func (f *fakeDocumentStore) ListDocuments(ctx context.Context, workspaceID, userID string) ([]documents.Document, error) {
	return f.listFn(ctx, workspaceID, userID)
}

func (f *fakeDocumentStore) GetDocument(ctx context.Context, documentID, userID string) (*documents.Document, error) {
	return f.getFn(ctx, documentID, userID)
}

func (f *fakeDocumentStore) UpdateDocument(ctx context.Context, documentID, userID, title, content string) (*documents.Document, error) {
	return f.updateFn(ctx, documentID, userID, title, content)
}

func (f *fakeDocumentStore) DeleteDocument(ctx context.Context, documentID, userID string) error {
	return f.deleteFn(ctx, documentID, userID)
}

func TestCreateDocument(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		createFn: func(ctx context.Context, workspaceID, userID, title, content string) (*documents.Document, error) {
			return &documents.Document{
				ID:          "doc-1",
				WorkspaceID: workspaceID,
				Title:       title,
				Content:     content,
				CreatedBy:   userID,
				UpdatedBy:   userID,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-1/documents", strings.NewReader(`{"title":"Spec","content":"draft"}`))
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.CreateDocument(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	var got documents.Document
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.WorkspaceID != "ws-1" || got.CreatedBy != "user-1" {
		t.Fatalf("unexpected response: %+v", got)
	}
}

func TestListDocumentsForbidden(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		listFn: func(ctx context.Context, workspaceID, userID string) ([]documents.Document, error) {
			return nil, documents.ErrForbidden
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/workspaces/ws-1/documents", nil)
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-2"}))
	rec := httptest.NewRecorder()

	handler.ListDocuments(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}

func TestGetDocumentNotFound(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		getFn: func(ctx context.Context, documentID, userID string) (*documents.Document, error) {
			return nil, documents.ErrDocumentNotFound
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/documents/doc-404", nil)
	req.SetPathValue("document_id", "doc-404")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.GetDocument(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
}

func TestUpdateDocumentRequiresTitle(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		updateFn: func(ctx context.Context, documentID, userID, title, content string) (*documents.Document, error) {
			return nil, errors.New("should not be called")
		},
	})

	req := httptest.NewRequest(http.MethodPut, "/api/documents/doc-1", strings.NewReader(`{"title":"   ","content":"next"}`))
	req.SetPathValue("document_id", "doc-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.UpdateDocument(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestDeleteDocument(t *testing.T) {
	called := false
	handler := NewDocumentHandler(&fakeDocumentStore{
		deleteFn: func(ctx context.Context, documentID, userID string) error {
			called = true
			if documentID != "doc-1" || userID != "user-1" {
				t.Fatalf("unexpected delete args: %s %s", documentID, userID)
			}
			return nil
		},
	})

	req := httptest.NewRequest(http.MethodDelete, "/api/documents/doc-1", nil)
	req.SetPathValue("document_id", "doc-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.DeleteDocument(rec, req)

	if !called {
		t.Fatal("expected delete store call")
	}
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
}
