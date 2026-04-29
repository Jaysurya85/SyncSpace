package auth

import (
	"context"
	"os"
	"testing"
)

func TestVerifyGoogleTokenNoClientID(t *testing.T) {
	os.Unsetenv("GOOGLE_CLIENT_ID")

	_, err := VerifyGoogleToken(context.Background(), "any-token")
	if err == nil {
		t.Fatal("expected error when GOOGLE_CLIENT_ID is not set")
	}
}

func TestVerifyGoogleTokenInvalidToken(t *testing.T) {
	os.Setenv("GOOGLE_CLIENT_ID", "test-client-id")
	defer os.Unsetenv("GOOGLE_CLIENT_ID")

	_, err := VerifyGoogleToken(context.Background(), "not-a-valid-jwt")
	if err == nil {
		t.Fatal("expected error for invalid Google token")
	}
}
