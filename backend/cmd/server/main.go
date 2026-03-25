package main

// @title           SyncSpace API
// @version         1.0
// @description     Real-time collaboration platform API
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.email  support@syncspace.com

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"syncspace-backend/internal/db"
	"syncspace-backend/internal/documents"
	"syncspace-backend/internal/handlers"
	"syncspace-backend/internal/middleware"
	"syncspace-backend/internal/workspaces"

	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger"
	_ "syncspace-backend/docs"

	"github.com/rs/cors"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Load environment variables
	_ = godotenv.Load()

	port := getenv("PORT", "8080")

	pool, err := db.Open(ctx)
	if err != nil {
		log.Fatalf("db open failed: %v", err)
	}
	defer pool.Close()

	if err := db.RunMigrations(ctx, pool, "migrations"); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	// Create handlers
	authHandler := handlers.NewAuthHandler(pool)
	documentHandler := handlers.NewDocumentHandler(documents.NewPostgresStore(pool))
	workspaceHandler := handlers.NewWorkspaceHandler(workspaces.NewPostgresStore(pool))

	mux := http.NewServeMux()

	// Swagger UI endpoint
	mux.Handle("/swagger/", httpSwagger.WrapHandler)

	// Auth endpoints
	mux.HandleFunc("POST /api/auth/google", authHandler.GoogleLogin)
	mux.Handle("POST /api/workspaces", middleware.AuthMiddleware(http.HandlerFunc(workspaceHandler.CreateWorkspace)))
	mux.Handle("GET /api/workspaces/{workspace_id}", middleware.AuthMiddleware(http.HandlerFunc(workspaceHandler.GetWorkspace)))
	mux.Handle("POST /api/workspaces/{workspace_id}/documents", middleware.AuthMiddleware(http.HandlerFunc(documentHandler.CreateDocument)))
	mux.Handle("GET /api/workspaces/{workspace_id}/documents", middleware.AuthMiddleware(http.HandlerFunc(documentHandler.ListDocuments)))
	mux.Handle("GET /api/documents/{document_id}", middleware.AuthMiddleware(http.HandlerFunc(documentHandler.GetDocument)))
	mux.Handle("PUT /api/documents/{document_id}", middleware.AuthMiddleware(http.HandlerFunc(documentHandler.UpdateDocument)))
	mux.Handle("DELETE /api/documents/{document_id}", middleware.AuthMiddleware(http.HandlerFunc(documentHandler.DeleteDocument)))

	// Protected test endpoint
	protectedHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := middleware.GetUserFromContext(r.Context())
		if !ok {
			http.Error(w, `{"error":"no user in context"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "You are authenticated!",
			"user_id": claims.UserID,
			"email":   claims.Email,
		})
	})
	mux.Handle("GET /api/protected", middleware.AuthMiddleware(protectedHandler))

	// Health endpoint
	mux.Handle("/health", handlers.NewHealthHandler(pool))

	// Root route
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("SyncSpace backend is running\n"))
	})

	// Setup CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"}, // Allow all origins (change in production)
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           corsHandler.Handler(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("server listening on http://localhost:%s", port)
		log.Printf("Swagger UI available at http://localhost:%s/swagger/index.html", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
