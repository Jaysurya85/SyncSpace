# SyncSpace Backend

Go backend for the SyncSpace collaboration platform.

## Getting Started

## Prerequisites

- Go 1.21+
- Docker

## Run the Application

1. **Start Database:**
```bash
   docker compose up -d
```

2. **Run Backend:**
```bash
   cd backend
   go run cmd/server/main.go
```

3. **Test:**
   - Health: `curl http://localhost:8080/health`
   - Swagger: `http://localhost:8080/swagger/index.html`

## Stop
```bash
docker compose down
```