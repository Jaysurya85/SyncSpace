package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"syncspace-backend/internal/middleware"
	"syncspace-backend/internal/workspaces"
)

type WorkspaceHandler struct {
	Store workspaces.Store
}

type CreateWorkspaceRequest struct {
	Name string `json:"name"`
}

func NewWorkspaceHandler(store workspaces.Store) *WorkspaceHandler {
	return &WorkspaceHandler{Store: store}
}

// CreateWorkspace creates a new workspace for the authenticated user.
// @Summary      Create workspace
// @Description  Create a workspace and automatically add the authenticated user as the owner.
// @Tags         workspaces
// @Accept       json
// @Produce      json
// @Param        request body CreateWorkspaceRequest true "Workspace payload"
// @Success      201  {object}  workspaces.Workspace
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces [post]
func (h *WorkspaceHandler) CreateWorkspace(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	var req CreateWorkspaceRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid request body"})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "name is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	workspace, err := h.Store.CreateWorkspace(ctx, claims.UserID, req.Name)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		return
	}

	writeJSON(w, http.StatusCreated, workspace)
}

// GetWorkspace fetches a workspace by ID for a member.
// @Summary      Get workspace
// @Description  Fetch a workspace by ID. Only workspace members can access it.
// @Tags         workspaces
// @Produce      json
// @Param        workspace_id path string true "Workspace ID"
// @Success      200  {object}  workspaces.Workspace
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces/{workspace_id} [get]
func (h *WorkspaceHandler) GetWorkspace(w http.ResponseWriter, r *http.Request) {
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

	workspace, err := h.Store.GetWorkspace(ctx, workspaceID, claims.UserID)
	if err != nil {
		switch {
		case errors.Is(err, workspaces.ErrForbidden):
			writeJSON(w, http.StatusForbidden, ErrorResponse{Error: "access denied"})
		case errors.Is(err, workspaces.ErrWorkspaceNotFound):
			writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "workspace not found"})
		default:
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		}
		return
	}

	writeJSON(w, http.StatusOK, workspace)
}
