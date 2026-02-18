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

// HealthResponse represents the health check response
type HealthResponse struct {
	Status string `json:"status" example:"ok"`
	DB     string `json:"db,omitempty" example:"up"`
}

func NewHealthHandler(db *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{DB: db}
}

// ServeHTTP handles health check requests
// @Summary      Health Check
// @Description  Check if the API and database are healthy
// @Tags         health
// @Produce      json
// @Success      200  {object}  HealthResponse
// @Router       /health [get]
func (h *HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	out := HealthResponse{Status: "ok"}

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