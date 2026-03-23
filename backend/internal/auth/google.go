package auth

import (
	"context"
	"fmt"
	"os"

	"google.golang.org/api/idtoken"
)

// GoogleUserInfo represents the user info from Google
type GoogleUserInfo struct {
	GoogleID   string
	Email      string
	Name       string
	ProfilePic string
}

// VerifyGoogleToken verifies a Google ID token and returns user info
func VerifyGoogleToken(ctx context.Context, token string) (*GoogleUserInfo, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	if clientID == "" {
		return nil, fmt.Errorf("GOOGLE_CLIENT_ID not set")
	}

	payload, err := idtoken.Validate(ctx, token, clientID)
	if err != nil {
		return nil, fmt.Errorf("invalid Google token: %w", err)
	}

	email, _ := payload.Claims["email"].(string)
	name, _ := payload.Claims["name"].(string)
	picture, _ := payload.Claims["picture"].(string)
	sub, _ := payload.Claims["sub"].(string) // Google user ID

	if email == "" || sub == "" {
		return nil, fmt.Errorf("missing required claims in Google token")
	}

	return &GoogleUserInfo{
		GoogleID:   sub,
		Email:      email,
		Name:       name,
		ProfilePic: picture,
	}, nil
}