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

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"syncspace-backend/internal/db"
	"syncspace-backend/internal/handlers"

	httpSwagger "github.com/swaggo/http-swagger"
	_ "syncspace-backend/docs"  // This will be generated
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	port := getenv("PORT", "8080")

	pool, err := db.Open(ctx)
	if err != nil {
		log.Fatalf("db open failed: %v", err)
	}
	defer pool.Close()

	mux := http.NewServeMux()

	// Swagger UI endpoint
	mux.Handle("/swagger/", httpSwagger.WrapHandler)

	// Health endpoint
	mux.Handle("/health", handlers.NewHealthHandler(pool))

	// Root route
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("SyncSpace backend is running\n"))
	})

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
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