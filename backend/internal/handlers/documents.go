package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"syncspace-backend/internal/documents"
	"syncspace-backend/internal/middleware"
)

type DocumentHandler struct {
	Store documents.Store
}

type CreateDocumentRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type UpdateDocumentRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

func NewDocumentHandler(store documents.Store) *DocumentHandler {
	return &DocumentHandler{Store: store}
}

// CreateDocument creates a new document in a workspace.
// @Summary      Create document
// @Description  Create a new document inside a workspace. Only workspace members can create documents.
// @Tags         documents
// @Accept       json
// @Produce      json
// @Param        workspace_id path string true "Workspace ID"
// @Param        request body CreateDocumentRequest true "Document payload"
// @Success      201  {object}  documents.Document
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces/{workspace_id}/documents [post]
func (h *DocumentHandler) CreateDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	workspaceID := r.PathValue("workspace_id")
	if workspaceID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "workspace_id is required"})
		return
	}

	var req CreateDocumentRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "title is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	doc, err := h.Store.CreateDocument(ctx, workspaceID, claims.UserID, req.Title, req.Content)
	if err != nil {
		h.writeStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, doc)
}

// ListDocuments lists all documents in a workspace.
// @Summary      List workspace documents
// @Description  List all documents in a workspace. Only workspace members can view documents.
// @Tags         documents
// @Produce      json
// @Param        workspace_id path string true "Workspace ID"
// @Success      200  {array}   documents.Document
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces/{workspace_id}/documents [get]
func (h *DocumentHandler) ListDocuments(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	workspaceID := r.PathValue("workspace_id")
	if workspaceID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "workspace_id is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	docs, err := h.Store.ListDocuments(ctx, workspaceID, claims.UserID)
	if err != nil {
		h.writeStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, docs)
}

// GetDocument fetches one document by ID.
// @Summary      Get document
// @Description  Get a single document by ID. Only workspace members can access documents.
// @Tags         documents
// @Produce      json
// @Param        document_id path string true "Document ID"
// @Success      200  {object}  documents.Document
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/documents/{document_id} [get]
func (h *DocumentHandler) GetDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	documentID := r.PathValue("document_id")
	if documentID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "document_id is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	doc, err := h.Store.GetDocument(ctx, documentID, claims.UserID)
	if err != nil {
		h.writeStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, doc)
}

// UpdateDocument updates document title and content.
// @Summary      Update document
// @Description  Update document content. Only workspace members can update documents.
// @Tags         documents
// @Accept       json
// @Produce      json
// @Param        document_id path string true "Document ID"
// @Param        request body UpdateDocumentRequest true "Updated document payload"
// @Success      200  {object}  documents.Document
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/documents/{document_id} [put]
func (h *DocumentHandler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	documentID := r.PathValue("document_id")
	if documentID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "document_id is required"})
		return
	}

	var req UpdateDocumentRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid request body"})
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "title is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	doc, err := h.Store.UpdateDocument(ctx, documentID, claims.UserID, req.Title, req.Content)
	if err != nil {
		h.writeStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, doc)
}

// DeleteDocument deletes a document by ID.
// @Summary      Delete document
// @Description  Delete a document by ID. Only workspace members can delete documents.
// @Tags         documents
// @Produce      json
// @Param        document_id path string true "Document ID"
// @Success      204
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/documents/{document_id} [delete]
func (h *DocumentHandler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	documentID := r.PathValue("document_id")
	if documentID == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "document_id is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := h.Store.DeleteDocument(ctx, documentID, claims.UserID); err != nil {
		h.writeStoreError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *DocumentHandler) writeStoreError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, documents.ErrForbidden):
		writeJSON(w, http.StatusForbidden, ErrorResponse{Error: "access denied"})
	case errors.Is(err, documents.ErrWorkspaceNotFound):
		writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "workspace not found"})
	case errors.Is(err, documents.ErrDocumentNotFound):
		writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "document not found"})
	default:
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
	}
}
