package users

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"syncspace-backend/internal/handlers"
	"syncspace-backend/internal/middleware"
)

type UserHandler struct {
	Store Store
}

type CreateUserRequest struct {
	Email      string `json:"email"`
	Name       string `json:"name"`
	ProfilePic string `json:"profile_pic,omitempty"`
}

type UpdateUserRequest struct {
	Name       string `json:"name,omitempty"`
	ProfilePic string `json:"profile_pic,omitempty"`
}

type ListUsersQueryParams struct {
	Limit  int
	Offset int
}

func NewUserHandler(store Store) *UserHandler {
	return &UserHandler{Store: store}
}

// CreateUser creates a new user
// @Summary      Create user
// @Description  Create a new user with email and name
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        request body CreateUserRequest true "User data"
// @Success      201  {object}  User
// @Failure      400  {object}  handlers.ErrorResponse
// @Failure      409  {object}  handlers.ErrorResponse
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /api/users [post]
func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handlers.WriteJSON(w, http.StatusBadRequest, handlers.ErrorResponse{Error: "invalid request body"})
		return
	}

	req.Email = strings.TrimSpace(req.Email)
	req.Name = strings.TrimSpace(req.Name)
	req.ProfilePic = strings.TrimSpace(req.ProfilePic)

	if req.Email == "" || req.Name == "" {
		handlers.WriteJSON(w, http.StatusBadRequest, handlers.ErrorResponse{Error: "email and name are required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	user, err := h.Store.CreateUser(ctx, req.Email, req.Name, req.ProfilePic)
	if err != nil {
		if err == ErrUserExists {
			handlers.WriteJSON(w, http.StatusConflict, handlers.ErrorResponse{Error: "user with this email already exists"})
			return
		}
		if err == ErrInvalidInput {
			handlers.WriteJSON(w, http.StatusBadRequest, handlers.ErrorResponse{Error: "invalid input"})
			return
		}
		handlers.WriteJSON(w, http.StatusInternalServerError, handlers.ErrorResponse{Error: "failed to create user"})
		return
	}

	handlers.WriteJSON(w, http.StatusCreated, user)
}

// GetUser retrieves a user by ID
// @Summary      Get user
// @Description  Retrieve a user by their ID
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Param        user_id path string true "User ID"
// @Success      200  {object}  User
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      404  {object}  handlers.ErrorResponse
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /api/users/{user_id} [get]
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		handlers.WriteJSON(w, http.StatusUnauthorized, handlers.ErrorResponse{Error: "unauthorized"})
		return
	}

	userID := r.PathValue("user_id")
	if userID == "" {
		handlers.WriteJSON(w, http.StatusBadRequest, handlers.ErrorResponse{Error: "user_id is required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	user, err := h.Store.GetUserByID(ctx, userID)
	if err != nil {
		if err == ErrUserNotFound {
			handlers.WriteJSON(w, http.StatusNotFound, handlers.ErrorResponse{Error: "user not found"})
			return
		}
		handlers.WriteJSON(w, http.StatusInternalServerError, handlers.ErrorResponse{Error: "failed to fetch user"})
		return
	}

	handlers.WriteJSON(w, http.StatusOK, user)
}

// GetCurrentUser retrieves the current authenticated user's profile
// @Summary      Get current user profile
// @Description  Retrieve the profile of the currently authenticated user
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  User
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      404  {object}  handlers.ErrorResponse
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /api/users/me [get]
func (h *UserHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		handlers.WriteJSON(w, http.StatusUnauthorized, handlers.ErrorResponse{Error: "unauthorized"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	user, err := h.Store.GetUserByID(ctx, claims.UserID)
	if err != nil {
		if err == ErrUserNotFound {
			handlers.WriteJSON(w, http.StatusNotFound, handlers.ErrorResponse{Error: "user not found"})
			return
		}
		handlers.WriteJSON(w, http.StatusInternalServerError, handlers.ErrorResponse{Error: "failed to fetch user"})
		return
	}

	handlers.WriteJSON(w, http.StatusOK, user)
}

// UpdateUser updates a user's information
// @Summary      Update user
// @Description  Update user information. Users can only update their own profile.
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        user_id path string true "User ID"
// @Param        request body UpdateUserRequest true "User update data"
// @Success      200  {object}  User
// @Failure      400  {object}  handlers.ErrorResponse
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      403  {object}  handlers.ErrorResponse
// @Failure      404  {object}  handlers.ErrorResponse
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /api/users/{user_id} [put]
func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		handlers.WriteJSON(w, http.StatusUnauthorized, handlers.ErrorResponse{Error: "unauthorized"})
		return
	}

	userID := r.PathValue("user_id")
	if userID == "" {
		handlers.WriteJSON(w, http.StatusBadRequest, handlers.ErrorResponse{Error: "user_id is required"})
		return
	}

	// Users can only update their own profile
	if claims.UserID != userID {
		handlers.WriteJSON(w, http.StatusForbidden, handlers.ErrorResponse{Error: "you can only update your own profile"})
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handlers.WriteJSON(w, http.StatusBadRequest, handlers.ErrorResponse{Error: "invalid request body"})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.ProfilePic = strings.TrimSpace(req.ProfilePic)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	user, err := h.Store.UpdateUser(ctx, userID, req.Name, req.ProfilePic)
	if err != nil {
		if err == ErrUserNotFound {
			handlers.WriteJSON(w, http.StatusNotFound, handlers.ErrorResponse{Error: "user not found"})
			return
		}
		if err == ErrInvalidInput {
			handlers.WriteJSON(w, http.StatusBadRequest, handlers.ErrorResponse{Error: "invalid input"})
			return
		}
		handlers.WriteJSON(w, http.StatusInternalServerError, handlers.ErrorResponse{Error: "failed to update user"})
		return
	}

	handlers.WriteJSON(w, http.StatusOK, user)
}

// DeleteUser deletes a user
// @Summary      Delete user
// @Description  Delete a user. Users can only delete their own account.
// @Tags         users
// @Security     BearerAuth
// @Param        user_id path string true "User ID"
// @Success      204
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      403  {object}  handlers.ErrorResponse
// @Failure      404  {object}  handlers.ErrorResponse
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /api/users/{user_id} [delete]
func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		handlers.WriteJSON(w, http.StatusUnauthorized, handlers.ErrorResponse{Error: "unauthorized"})
		return
	}

	userID := r.PathValue("user_id")
	if userID == "" {
		handlers.WriteJSON(w, http.StatusBadRequest, handlers.ErrorResponse{Error: "user_id is required"})
		return
	}

	// Users can only delete their own account
	if claims.UserID != userID {
		handlers.WriteJSON(w, http.StatusForbidden, handlers.ErrorResponse{Error: "you can only delete your own account"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	err := h.Store.DeleteUser(ctx, userID)
	if err != nil {
		if err == ErrUserNotFound {
			handlers.WriteJSON(w, http.StatusNotFound, handlers.ErrorResponse{Error: "user not found"})
			return
		}
		handlers.WriteJSON(w, http.StatusInternalServerError, handlers.ErrorResponse{Error: "failed to delete user"})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ListUsers retrieves a paginated list of all users
// @Summary      List users
// @Description  Retrieve a paginated list of all users
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Param        limit query int false "Number of users to return (default 20)"
// @Param        offset query int false "Number of users to skip (default 0)"
// @Success      200  {array}   User
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      400  {object}  handlers.ErrorResponse
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /api/users [get]
func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		handlers.WriteJSON(w, http.StatusUnauthorized, handlers.ErrorResponse{Error: "unauthorized"})
		return
	}

	limit := 20
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	users, err := h.Store.ListUsers(ctx, limit, offset)
	if err != nil {
		handlers.WriteJSON(w, http.StatusInternalServerError, handlers.ErrorResponse{Error: "failed to fetch users"})
		return
	}

	if users == nil {
		users = []User{}
	}

	handlers.WriteJSON(w, http.StatusOK, users)
}
