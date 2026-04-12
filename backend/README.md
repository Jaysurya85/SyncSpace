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

The server now applies all `migrations/*.up.sql` files on startup.

3. **Test:**
   - Health: `curl http://localhost:8080/health`
   - Swagger: `http://localhost:8080/swagger/index.html`

## Document API

All protected endpoints require `Authorization: Bearer <jwt>`.

## Workspace API

- `POST /api/workspaces`
- `GET /api/workspaces`
- `GET /api/workspaces/{workspace_id}`
- `PUT /api/workspaces/{workspace_id}`
- `POST /api/workspaces/{workspace_id}/members`
- `DELETE /api/workspaces/{workspace_id}`

`POST /api/workspaces/{workspace_id}/members` is owner-only and accepts either:

```json
{"email":"member@example.com"}
```

or

```json
{"user_id":"uuid"}
```

## Document API

- `POST /api/workspaces/{workspace_id}/documents`
- `GET /api/workspaces/{workspace_id}/documents`
- `GET /api/documents/{document_id}`
- `PUT /api/documents/{document_id}`
- `DELETE /api/documents/{document_id}`

## Stop
```bash
docker compose down
```
