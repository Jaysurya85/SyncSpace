package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthCheckHandler_WithoutDB(t *testing.T) {
	handler := NewHealthHandler(nil)

	req := httptest.NewRequest("GET", "/health", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected 200, got %d", rec.Code)
	}

	// Should still return status:ok even without DB
	body := rec.Body.String()
	if body == "" {
		t.Error("Expected non-empty response")
	}
}