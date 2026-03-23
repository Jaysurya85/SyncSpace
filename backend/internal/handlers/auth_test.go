package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGoogleLogin_MissingToken(t *testing.T) {
	handler := &AuthHandler{DB: nil}

	// Request with no google_token
	body := `{}`
	req := httptest.NewRequest("POST", "/api/auth/google", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.GoogleLogin(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("Expected 400, got %d", rec.Code)
	}
}

func TestGoogleLogin_InvalidJSON(t *testing.T) {
	handler := &AuthHandler{DB: nil}

	// Invalid JSON
	req := httptest.NewRequest("POST", "/api/auth/google", bytes.NewBufferString("invalid-json"))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.GoogleLogin(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("Expected 400, got %d", rec.Code)
	}
}

func TestGoogleLogin_InvalidGoogleToken(t *testing.T) {
	handler := &AuthHandler{DB: nil}

	// Valid JSON but fake Google token
	body := `{"google_token": "fake-google-token"}`
	req := httptest.NewRequest("POST", "/api/auth/google", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.GoogleLogin(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401, got %d", rec.Code)
	}
}