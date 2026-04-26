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
	"syncspace-backend/internal/users"
	"syncspace-backend/internal/workspaces"
	"syncspace-backend/internal/tasks"

	_ "syncspace-backend/docs"

	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

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

	authHandler := handlers.NewAuthHandler(pool)
	documentHandler := handlers.NewDocumentHandler(documents.NewPostgresStore(pool))
	taskHandler := handlers.NewTaskHandler(tasks.NewPostgresStore(pool))
	workspaceHandler := handlers.NewWorkspaceHandler(workspaces.NewPostgresStore(pool))
	userHandler := users.NewUserHandler(users.NewPostgresStore(pool))

	mux := http.NewServeMux()

	mux.Handle("/swagger/", httpSwagger.WrapHandler)

	mux.HandleFunc("POST /api/auth/google", authHandler.GoogleLogin)

	mux.Handle("POST /api/users", http.HandlerFunc(userHandler.CreateUser))
	mux.Handle("GET /api/users", middleware.AuthMiddleware(http.HandlerFunc(userHandler.ListUsers)))
	mux.Handle("GET /api/users/me", middleware.AuthMiddleware(http.HandlerFunc(userHandler.GetCurrentUser)))
	mux.Handle("GET /api/users/{user_id}", middleware.AuthMiddleware(http.HandlerFunc(userHandler.GetUser)))
	mux.Handle("PUT /api/users/{user_id}", middleware.AuthMiddleware(http.HandlerFunc(userHandler.UpdateUser)))
	mux.Handle("DELETE /api/users/{user_id}", middleware.AuthMiddleware(http.HandlerFunc(userHandler.DeleteUser)))

	mux.Handle("POST /api/workspaces", middleware.AuthMiddleware(http.HandlerFunc(workspaceHandler.CreateWorkspace)))
	mux.Handle("GET /api/workspaces", middleware.AuthMiddleware(http.HandlerFunc(workspaceHandler.ListWorkspaces)))
	mux.Handle("GET /api/workspaces/{workspace_id}", middleware.AuthMiddleware(http.HandlerFunc(workspaceHandler.GetWorkspace)))
	mux.Handle("PUT /api/workspaces/{workspace_id}", middleware.AuthMiddleware(http.HandlerFunc(workspaceHandler.UpdateWorkspace)))
	mux.Handle("DELETE /api/workspaces/{workspace_id}", middleware.AuthMiddleware(http.HandlerFunc(workspaceHandler.DeleteWorkspace)))
	mux.Handle("POST /api/workspaces/{workspace_id}/members", middleware.AuthMiddleware(http.HandlerFunc(workspaceHandler.AddMember)))
	mux.Handle("GET /api/workspaces/{workspace_id}/members", middleware.AuthMiddleware(http.HandlerFunc(workspaceHandler.ListMembers)))
	mux.Handle("DELETE /api/workspaces/{workspace_id}/members/{user_id}", middleware.AuthMiddleware(http.HandlerFunc(workspaceHandler.RemoveMember)))
	mux.Handle("POST /api/workspaces/{workspace_id}/documents", middleware.AuthMiddleware(http.HandlerFunc(documentHandler.CreateDocument)))
	mux.Handle("GET /api/workspaces/{workspace_id}/documents", middleware.AuthMiddleware(http.HandlerFunc(documentHandler.ListDocuments)))
	mux.Handle("GET /api/documents/{document_id}", middleware.AuthMiddleware(http.HandlerFunc(documentHandler.GetDocument)))
	mux.Handle("PUT /api/documents/{document_id}", middleware.AuthMiddleware(http.HandlerFunc(documentHandler.UpdateDocument)))
	mux.Handle("DELETE /api/documents/{document_id}", middleware.AuthMiddleware(http.HandlerFunc(documentHandler.DeleteDocument)))

	mux.Handle("POST /api/workspaces/{workspace_id}/tasks", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.CreateTask)))
	mux.Handle("GET /api/workspaces/{workspace_id}/tasks", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.ListTasks)))
	mux.Handle("GET /api/tasks/{task_id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.GetTask)))
	mux.Handle("PUT /api/tasks/{task_id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.UpdateTask)))
	mux.Handle("DELETE /api/tasks/{task_id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.DeleteTask)))

	mux.Handle("GET /api/protected", middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
	})))

	mux.Handle("/health", handlers.NewHealthHandler(pool))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("SyncSpace backend is running\n"))
	})

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           corsMiddleware(mux),
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

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, ngrok-skip-browser-warning")
		w.Header().Set("Vary", "Origin")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
