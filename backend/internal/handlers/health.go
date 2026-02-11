package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthHandler struct {
	DB *pgxpool.Pool
}

func NewHealthHandler(db *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{DB: db}
}

func (h *HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	type resp struct {
		Status string `json:"status"`
		DB     string `json:"db,omitempty"`
	}

	out := resp{Status: "ok"}

	// If DB is available, try a quick ping.
	if h.DB != nil {
		ctx, cancel := context.WithTimeout(r.Context(), 700*time.Millisecond)
		defer cancel()

		if err := h.DB.Ping(ctx); err != nil {
			out.Status = "degraded"
			out.DB = "down"
		} else {
			out.DB = "up"
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}
