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
