package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"syncspace-backend/internal/auth"
)

type AuthHandler struct {
	DB *pgxpool.Pool
}

func NewAuthHandler(db *pgxpool.Pool) *AuthHandler {
	return &AuthHandler{DB: db}
}

// GoogleLoginRequest represents the request body for Google login
type GoogleLoginRequest struct {
	GoogleToken string `json:"google_token"`
}

// AuthResponse represents the response after successful authentication
type AuthResponse struct {
	Token string   `json:"token"`
	User  UserInfo `json:"user"`
}

// UserInfo represents user information in the response
type UserInfo struct {
	ID         string `json:"id"`
	Email      string `json:"email"`
	Name       string `json:"name"`
	ProfilePic string `json:"profile_pic,omitempty"`
}

// GoogleLogin handles Google OAuth login
// @Summary      Google OAuth Login
// @Description  Authenticate user with Google ID token
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body GoogleLoginRequest true "Google Token"
// @Success      200  {object}  AuthResponse
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/auth/google [post]
func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	var req GoogleLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.GoogleToken == "" {
		http.Error(w, `{"error":"google_token is required"}`, http.StatusBadRequest)
		return
	}

	// Verify Google token
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	googleUser, err := auth.VerifyGoogleToken(ctx, req.GoogleToken)
	if err != nil {
		http.Error(w, `{"error":"invalid Google token"}`, http.StatusUnauthorized)
		return
	}

	// Check if user exists in database
	var userID, name, profilePic string
	query := `SELECT id, name, profile_pic FROM users WHERE google_id = $1`
	err = h.DB.QueryRow(ctx, query, googleUser.GoogleID).Scan(&userID, &name, &profilePic)

	if err == pgx.ErrNoRows {
		// User doesn't exist, create new user
		insertQuery := `
			INSERT INTO users (email, name, google_id, profile_pic, created_at)
			VALUES ($1, $2, $3, $4, NOW())
			RETURNING id
		`
		err = h.DB.QueryRow(ctx, insertQuery, googleUser.Email, googleUser.Name, googleUser.GoogleID, googleUser.ProfilePic).Scan(&userID)
		if err != nil {
			http.Error(w, `{"error":"failed to create user"}`, http.StatusInternalServerError)
			return
		}
		name = googleUser.Name
		profilePic = googleUser.ProfilePic
	} else if err != nil {
		http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(userID, googleUser.Email)
	if err != nil {
		http.Error(w, `{"error":"failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	// Return response
	response := AuthResponse{
		Token: token,
		User: UserInfo{
			ID:         userID,
			Email:      googleUser.Email,
			Name:       name,
			ProfilePic: profilePic,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
