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

func TestCreateDocumentInvalidJSON(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{})
	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-1/documents", strings.NewReader(`not-json`))
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()
	handler.CreateDocument(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestUpdateDocumentInvalidJSON(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{})
	req := httptest.NewRequest(http.MethodPut, "/api/documents/doc-1", strings.NewReader(`not-json`))
	req.SetPathValue("document_id", "doc-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()
	handler.UpdateDocument(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestCreateDocumentUnauthorized(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{})
	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-1/documents", strings.NewReader(`{"title":"Spec"}`))
	req.SetPathValue("workspace_id", "ws-1")
	rec := httptest.NewRecorder()
	handler.CreateDocument(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestListDocumentsUnauthorized(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{})
	req := httptest.NewRequest(http.MethodGet, "/api/workspaces/ws-1/documents", nil)
	req.SetPathValue("workspace_id", "ws-1")
	rec := httptest.NewRecorder()
	handler.ListDocuments(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestGetDocumentUnauthorized(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{})
	req := httptest.NewRequest(http.MethodGet, "/api/documents/doc-1", nil)
	req.SetPathValue("document_id", "doc-1")
	rec := httptest.NewRecorder()
	handler.GetDocument(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestUpdateDocumentUnauthorized(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{})
	req := httptest.NewRequest(http.MethodPut, "/api/documents/doc-1", strings.NewReader(`{"title":"X"}`))
	req.SetPathValue("document_id", "doc-1")
	rec := httptest.NewRecorder()
	handler.UpdateDocument(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestDeleteDocumentUnauthorized(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{})
	req := httptest.NewRequest(http.MethodDelete, "/api/documents/doc-1", nil)
	req.SetPathValue("document_id", "doc-1")
	rec := httptest.NewRecorder()
	handler.DeleteDocument(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
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

func TestCreateDocumentRequiresTitle(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		createFn: func(ctx context.Context, workspaceID, userID, title, content string) (*documents.Document, error) {
			return nil, errors.New("should not be called")
		},
	})

	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-1/documents", strings.NewReader(`{"title":"   ","content":"draft"}`))
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.CreateDocument(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestListDocuments(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		listFn: func(ctx context.Context, workspaceID, userID string) ([]documents.Document, error) {
			return []documents.Document{
				{ID: "doc-1", WorkspaceID: workspaceID, Title: "Spec", CreatedBy: userID, CreatedAt: time.Now(), UpdatedAt: time.Now()},
				{ID: "doc-2", WorkspaceID: workspaceID, Title: "Design", CreatedBy: userID, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/workspaces/ws-1/documents", nil)
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.ListDocuments(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var got []documents.Document
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("expected 2 documents, got %d", len(got))
	}
}

func TestGetDocument(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		getFn: func(ctx context.Context, documentID, userID string) (*documents.Document, error) {
			return &documents.Document{
				ID:        documentID,
				Title:     "Spec",
				CreatedBy: userID,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/api/documents/doc-1", nil)
	req.SetPathValue("document_id", "doc-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.GetDocument(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var got documents.Document
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.ID != "doc-1" || got.Title != "Spec" {
		t.Fatalf("unexpected response: %+v", got)
	}
}

func TestUpdateDocument(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		updateFn: func(ctx context.Context, documentID, userID, title, content string) (*documents.Document, error) {
			return &documents.Document{
				ID:        documentID,
				Title:     title,
				Content:   content,
				UpdatedBy: userID,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}, nil
		},
	})

	req := httptest.NewRequest(http.MethodPut, "/api/documents/doc-1", strings.NewReader(`{"title":"Updated Spec","content":"new content"}`))
	req.SetPathValue("document_id", "doc-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()

	handler.UpdateDocument(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var got documents.Document
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.Title != "Updated Spec" || got.Content != "new content" {
		t.Fatalf("unexpected response: %+v", got)
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

func TestDeleteDocumentForbidden(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		deleteFn: func(ctx context.Context, documentID, userID string) error {
			return documents.ErrForbidden
		},
	})

	req := httptest.NewRequest(http.MethodDelete, "/api/documents/doc-1", nil)
	req.SetPathValue("document_id", "doc-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-2"}))
	rec := httptest.NewRecorder()

	handler.DeleteDocument(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}

func TestCreateDocumentForbidden(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		createFn: func(ctx context.Context, workspaceID, userID, title, content string) (*documents.Document, error) {
			return nil, documents.ErrForbidden
		},
	})
	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-1/documents", strings.NewReader(`{"title":"Spec"}`))
	req.SetPathValue("workspace_id", "ws-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()
	handler.CreateDocument(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}

func TestCreateDocumentWorkspaceNotFound(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		createFn: func(ctx context.Context, workspaceID, userID, title, content string) (*documents.Document, error) {
			return nil, documents.ErrWorkspaceNotFound
		},
	})
	req := httptest.NewRequest(http.MethodPost, "/api/workspaces/ws-999/documents", strings.NewReader(`{"title":"Spec"}`))
	req.SetPathValue("workspace_id", "ws-999")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()
	handler.CreateDocument(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
}

func TestGetDocumentForbidden(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		getFn: func(ctx context.Context, documentID, userID string) (*documents.Document, error) {
			return nil, documents.ErrForbidden
		},
	})
	req := httptest.NewRequest(http.MethodGet, "/api/documents/doc-1", nil)
	req.SetPathValue("document_id", "doc-1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-2"}))
	rec := httptest.NewRecorder()
	handler.GetDocument(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}

func TestUpdateDocumentNotFound(t *testing.T) {
	handler := NewDocumentHandler(&fakeDocumentStore{
		updateFn: func(ctx context.Context, documentID, userID, title, content string) (*documents.Document, error) {
			return nil, documents.ErrDocumentNotFound
		},
	})
	req := httptest.NewRequest(http.MethodPut, "/api/documents/doc-999", strings.NewReader(`{"title":"Updated"}`))
	req.SetPathValue("document_id", "doc-999")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserContextKey, &auth.Claims{UserID: "user-1"}))
	rec := httptest.NewRecorder()
	handler.UpdateDocument(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
}
