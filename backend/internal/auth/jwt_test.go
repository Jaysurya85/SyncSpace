package auth

import (
	"os"
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func TestGenerateAndValidateToken(t *testing.T) {
	// Set test JWT secret
	os.Setenv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production")

	// Test data
	userID := "550e8400-e29b-41d4-a716-446655440000"
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
	os.Setenv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production")

	_, err := ValidateToken("invalid.token.here")
	if err == nil {
		t.Fatal("Expected error for invalid token, got nil")
	}

	t.Logf("Correctly rejected invalid token: %v", err)
}

func TestValidateTokenWrongSigningMethod(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")

	// Create a token signed with None algorithm (not HMAC) to trigger the signing method check
	token := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{"user_id": "u1"})
	tokenString, _ := token.SignedString(jwt.UnsafeAllowNoneSignatureType)

	_, err := ValidateToken(tokenString)
	if err == nil {
		t.Fatal("expected error for wrong signing method")
	}
}

func TestGenerateTokenNoSecret(t *testing.T) {
	os.Unsetenv("JWT_SECRET")

	_, err := GenerateToken("user-1", "test@example.com")
	if err == nil {
		t.Fatal("expected error when JWT_SECRET is not set")
	}
}

func TestValidateTokenNoSecret(t *testing.T) {
	os.Unsetenv("JWT_SECRET")

	_, err := ValidateToken("any.token.here")
	if err == nil {
		t.Fatal("expected error when JWT_SECRET is not set")
	}
}