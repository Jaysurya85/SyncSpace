# Sprint 2

Sprint 2 focused on implementing a backend REST API for the SyncSpace collaboration platform. We successfully delivered a production-ready authentication system, workspace management, document CRUD operations, comprehensive testing suite, and interactive API documentation.

- [Issues page](https://github.com/Jaysurya85/SyncSpace/issues?q=is%3Aissue)
- [Project Board](https://github.com/users/Jaysurya85/projects/1)

# Backend
## Completed Work

### Backend Authentication & Authorization
- Google OAuth 2.0 authentication integration
- JWT token generation and validation system
- Authentication middleware for protected routes
- 24-hour token expiration with secure signing
- User creation on first login via Google OAuth

### Database Schema
- **Users Table**: Stores user information with Google OAuth integration
  - Fields: id (UUID), email, name, google_id, profile_pic, created_at
- **Workspaces Table**: Workspace management with ownership tracking
  - Fields: id (UUID), name, owner_id (FK to users), created_at
- **Documents Table**: Document storage with workspace association
  - Fields: id (UUID), workspace_id (FK), title, content, created_by (FK), updated_by (FK), created_at, updated_at

### Backend API Endpoints
 
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/google` | Google OAuth login, returns JWT token | No |
| POST | `/api/workspaces` | Create workspace | Yes |
| GET | `/api/workspaces/{workspace_id}` | Get workspace details | Yes |
| POST | `/api/workspaces/{workspace_id}/documents` | Create document | Yes |
| GET | `/api/workspaces/{workspace_id}/documents` | List workspace documents | Yes |
| GET | `/api/documents/{document_id}` | Get single document | Yes |
| PUT | `/api/documents/{document_id}` | Update document | Yes |
| DELETE | `/api/documents/{document_id}` | Delete document | Yes |
| GET | `/health` | Health check with database status | No |

### Backend Testing
 
| Test Category | Test Cases | Status |
|---------------|------------|--------|
| **JWT Authentication** | Generate valid token, Validate valid token, Reject invalid token | ✅ Passing |
| **Authentication Middleware** | Valid token acceptance, Invalid token rejection, Missing token rejection | ✅ Passing |
| **Workspace Handlers** | Create workspace, Name validation, Forbidden access, Get workspace | ✅ Passing |
| **Document Handlers** | Create document, List documents (forbidden), Get document (not found), Update validation, Delete document | ✅ Passing |
| **Google OAuth** | Missing token, Invalid JSON, Invalid Google token | ✅ Passing |
| **Health Check** | Database connectivity validation | ✅ Passing |

## API Documentation

### Authentication

**POST /api/auth/google**
```bash
# Request
{
  "google_token": "string"
}

# Response (201)
{
  "token": "jwt_token",
  "user": { "id": "uuid", "email": "string", "name": "string" }
}
```

### Workspaces

**POST /api/workspaces**
```bash
# Headers: Authorization: Bearer <token>
# Request
{ "name": "string" }

# Response (201)
{
  "id": "uuid",
  "name": "string",
  "owner_id": "uuid",
  "role": "owner",
  "created_at": "timestamp"
}
```

**GET /api/workspaces/{workspace_id}**
```bash
# Headers: Authorization: Bearer <token>
# Response (200)
{ "id": "uuid", "name": "string", "owner_id": "uuid", "role": "string" }
```

### Documents

**POST /api/workspaces/{workspace_id}/documents**
```bash
# Headers: Authorization: Bearer <token>
# Request
{ "title": "string", "content": "string" }

# Response (201)
{
  "id": "uuid",
  "workspace_id": "uuid",
  "title": "string",
  "content": "string",
  "created_by": "uuid",
  "updated_by": "uuid",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**GET /api/workspaces/{workspace_id}/documents**
```bash
# Headers: Authorization: Bearer <token>
# Response (200): Array of documents
```

**GET /api/documents/{document_id}**
```bash
# Headers: Authorization: Bearer <token>
# Response (200): Single document object
```

**PUT /api/documents/{document_id}**
```bash
# Headers: Authorization: Bearer <token>
# Request
{ "title": "string", "content": "string" }

# Response (200): Updated document object
```

**DELETE /api/documents/{document_id}**
```bash
# Headers: Authorization: Bearer <token>
# Response (204): No content
```

### Common Error Responses

| Code | Error Message |
|------|---------------|
| 400 | `{"error": "invalid request body"}` |
| 400 | `{"error": "workspace_id is required"}` |
| 400 | `{"error": "document_id is required"}` |
| 400 | `{"error": "name is required"}` |
| 400 | `{"error": "title is required"}` |
| 401 | `{"error": "unauthorized"}` |
| 403 | `{"error": "access denied"}` |
| 404 | `{"error": "workspace not found"}` |
| 404 | `{"error": "document not found"}` |
| 500 | `{"error": "internal server error"}` |

### API Documentation
- Swagger UI integration at `/swagger/index.html`
- Complete API documentation with request/response schemas
- BearerAuth security scheme configured
- All endpoints documented with parameters, responses, and error codes
- Interactive API testing interface

### Sprint 2 Status: ✅ **COMPLETE**

All planned features for Sprint 2 have been successfully implemented, tested, and documented. The backend API is fully functional and ready for frontend integration in Sprint 3.


# Frontend

## Overview
This sprint focused on improving the frontend structure of SyncSpace by implementing Google sign-in on the UI side, building the authenticated application layout, creating the main dashboard, setting up testing, and cleaning up unused code.

## 1. Google Authentication

### Implemented Google Identity Services
- Added the Google Identity Services script loader
- Replaced the old mock Google login button with the official Google-rendered button
- Added safer Google initialization logic to reduce duplicate initialization warnings in development

### Session persistence
- Persisted authenticated user data in local storage using `syncspace-auth`
- Persisted the auth token in local storage using `syncspace-token`
- Restored user session from local storage on refresh
- Cleared both user and token during logout

### Auth UX improvements
- Added error handling for Google login failures on the login page
- Added sign-in loading feedback while authentication is in progress

## 2. Authenticated App Layout

### Created main authenticated shell
- Replaced the placeholder layout with a persistent authenticated layout
- Added:
  - sidebar
  - top navigation bar
  - main content area using nested routing

### Added navigation structure
- Added centralized navigation configuration
- Added sidebar component
- Added top navigation component

### Connected authenticated pages to shared layout
- Updated routing to use nested protected routes
- Connected these pages to the shared authenticated shell:
  - `/home`
  - `/documents`
  - `/tasks`
  - `/team`
  - `/chat`
  - `/settings`

## 3. Dashboard / Home Page

### Built the main dashboard
- Upgraded the home page into the post-login dashboard
- Added:
  - welcome section
  - workspace overview
  - signed-in user summary
  - quick action cards
  - recent documents preview
  - placeholder cards for future modules

### Reusable page shell
- Added a reusable feature page shell for consistent authenticated page headers and descriptions

### Placeholder feature pages
- Added initial placeholder pages for:
  - Documents
  - Tasks
  - Team
  - Chat
  - Settings

## 4. Testing Foundation

### Added unit testing with Vitest
- Configured Vitest for the Vite project
- Added a shared test setup file
- Added unit tests for:
  - Button component
  - Input component
  - auth login/logout flow

### Added end-to-end testing with Cypress
- Configured Cypress for the project
- Added an initial end-to-end test covering:
  - restored authenticated session
  - navigation through the authenticated sidebar

### Added test scripts
- Added scripts for:
  - running all tests
  - running unit tests
  - running unit tests in watch mode
  - running end-to-end tests
  - opening Cypress interactively

## 5. Cleanup and Refactoring

### Removed old unused auth flow
- Deleted unused email/password auth pages and forms
- Removed the unused social login component
- Removed the unused auth header component

### Removed old mock logic
- Removed old mock login and signup logic
- Removed unused frontend Google JWT decode logic

### Removed leftover Vite starter scaffold
- Deleted unused starter files from the default Vite template
- Removed the old favicon reference from the HTML entry file

## 6. Accessibility and DX Improvements

### Improved input accessibility
- Connected labels to inputs using `useId()`

### Fixed declared dependency gap
- Added the missing `clsx` dependency

### Dev server stability
- Fixed the Vite dev server to use a stable port:
  - `5173`
- Enabled strict port handling so the app does not silently switch to a different port

This was done to avoid origin-related issues during development.

## 7. Validation Performed
- `npm run lint`
- `npm run build`
- `npm run test:unit`
- `npm run test:e2e`

These checks were run during implementation to confirm the frontend setup is working after the changes.
