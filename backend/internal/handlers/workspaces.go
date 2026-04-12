package handlers

import (
	"context"
	"errors"
	"log"
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

type UpdateWorkspaceRequest struct {
	Name string `json:"name"`
}

type AddWorkspaceMemberRequest struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
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
// @Security     BearerAuth
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
		log.Printf("CreateWorkspace error: %v", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		return
	}

	writeJSON(w, http.StatusCreated, workspace)
}

// ListWorkspaces fetches all workspaces for the authenticated user.
// @Summary      List workspaces
// @Description  List all workspaces where the authenticated user is a member.
// @Tags         workspaces
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   workspaces.Workspace
// @Failure      401  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces [get]
func (h *WorkspaceHandler) ListWorkspaces(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	workspaces, err := h.Store.ListWorkspaces(ctx, claims.UserID)
	if err != nil {
		log.Printf("ListWorkspaces error: %v", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		return
	}

	writeJSON(w, http.StatusOK, workspaces)
}

// GetWorkspace fetches a workspace by ID for a member.
// @Summary      Get workspace
// @Description  Fetch a workspace by ID. Only workspace members can access it.
// @Tags         workspaces
// @Produce      json
// @Security     BearerAuth
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

// UpdateWorkspace updates a workspace. Only the owner can edit it.
// @Summary      Update workspace
// @Description  Update a workspace by ID. Only the workspace owner can edit it.
// @Tags         workspaces
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        workspace_id path string true "Workspace ID"
// @Param        request body UpdateWorkspaceRequest true "Workspace payload"
// @Success      200  {object}  workspaces.Workspace
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces/{workspace_id} [put]
func (h *WorkspaceHandler) UpdateWorkspace(w http.ResponseWriter, r *http.Request) {
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

	var req UpdateWorkspaceRequest
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

	workspace, err := h.Store.UpdateWorkspace(ctx, workspaceID, claims.UserID, req.Name)
	if err != nil {
		switch {
		case errors.Is(err, workspaces.ErrForbidden):
			writeJSON(w, http.StatusForbidden, ErrorResponse{Error: "access denied"})
		case errors.Is(err, workspaces.ErrWorkspaceNotFound):
			writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "workspace not found"})
		default:
			log.Printf("UpdateWorkspace error: %v", err)
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		}
		return
	}

	writeJSON(w, http.StatusOK, workspace)
}

// AddMember adds a user to a workspace. Only the owner can add members.
// @Summary      Add workspace member
// @Description  Add a member to a workspace using either the user's ID or email. Only the workspace owner can add members.
// @Tags         workspaces
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        workspace_id path string true "Workspace ID"
// @Param        request body AddWorkspaceMemberRequest true "Member lookup payload"
// @Success      201  {object}  workspaces.WorkspaceMember
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces/{workspace_id}/members [post]
func (h *WorkspaceHandler) AddMember(w http.ResponseWriter, r *http.Request) {
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

	var req AddWorkspaceMemberRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid request body"})
		return
	}

	req.UserID = strings.TrimSpace(req.UserID)
	req.Email = strings.TrimSpace(req.Email)
	if req.UserID == "" && req.Email == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "either user_id or email is required"})
		return
	}
	if req.UserID != "" && req.Email != "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "provide either user_id or email, not both"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	member, err := h.Store.AddMember(ctx, workspaceID, claims.UserID, req.UserID, req.Email)
	if err != nil {
		switch {
		case errors.Is(err, workspaces.ErrForbidden):
			writeJSON(w, http.StatusForbidden, ErrorResponse{Error: "access denied"})
		case errors.Is(err, workspaces.ErrWorkspaceNotFound):
			writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "workspace not found"})
		case errors.Is(err, workspaces.ErrUserNotFound):
			writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "user not found"})
		default:
			log.Printf("AddMember error: %v", err)
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		}
		return
	}

	writeJSON(w, http.StatusCreated, member)
}

// DeleteWorkspace deletes a workspace. Only the owner can delete the workspace.
// @Summary      Delete workspace
// @Description  Delete a workspace by ID. Only the workspace owner can delete it.
// @Tags         workspaces
// @Produce      json
// @Security     BearerAuth
// @Param        workspace_id path string true "Workspace ID"
// @Success      204
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /api/workspaces/{workspace_id} [delete]
func (h *WorkspaceHandler) DeleteWorkspace(w http.ResponseWriter, r *http.Request) {
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

	if err := h.Store.DeleteWorkspace(ctx, workspaceID, claims.UserID); err != nil {
		switch {
		case errors.Is(err, workspaces.ErrForbidden):
			writeJSON(w, http.StatusForbidden, ErrorResponse{Error: "access denied"})
		case errors.Is(err, workspaces.ErrWorkspaceNotFound):
			writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "workspace not found"})
		default:
			log.Printf("DeleteWorkspace error: %v", err)
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
