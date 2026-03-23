package auth

import (
	"os"
	"testing"
)

func TestGenerateAndValidateToken(t *testing.T) {
	// Set test JWT secret
	os.Setenv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production")

	// Test data
	userID := "test-user-id-123"
	email := "test@example.com"

	// Generate token
	token, err := GenerateToken(userID, email)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	if token == "" {
		t.Fatal("Generated token is empty")
	}

	t.Logf("Generated token: %s", token)

	// Validate token
	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	// Check claims
	if claims.UserID != userID {
		t.Errorf("Expected UserID %s, got %s", userID, claims.UserID)
	}

	if claims.Email != email {
		t.Errorf("Expected Email %s, got %s", email, claims.Email)
	}

	t.Log("Token validation successful!")
}

func TestValidateInvalidToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")

	// Try to validate a fake token
	_, err := ValidateToken("invalid.token.here")
	if err == nil {
		t.Fatal("Expected error for invalid token, got nil")
	}

	t.Logf("Correctly rejected invalid token: %v", err)
}