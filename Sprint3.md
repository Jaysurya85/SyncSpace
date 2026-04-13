# Sprint 3

Sprint 3 focused on expanding the SyncSpace backend with complete user CRUD operations, workspace management APIs beyond basic creation, workspace member management, task schema groundwork, and stronger test coverage across all modules.

- [Issues page](https://github.com/Jaysurya85/SyncSpace/issues?q=is%3Aissue)
- [Project Board](https://github.com/users/Jaysurya85/projects/1)

- [Backend demo video](https://youtu.be/y5qQ0ThmJ0g?si=iW80YYJ4kSZ4SuoR)
- [Frontend demo video](https://youtu.be/k-zPQjfAkaQ?si=otPCJMvznXDlgQwF)

# Backend
## Completed Work

### User APIs
- User creation endpoint
- Fetch the logged in user
- Fetch user by ID
- Update User 
- User account deletion
- Paginated user listing with `limit` and `offset` query parameters

### Workspace API Expansion
- Fetch workspace for authenticated users
- Update workspace (only allowed to workspace owner)
- Delete workspace (only allowed to workspace owner)

### Workspace Member Management
- Add members to a workspace using either user ID or email
- List all members of a workspace
- Remove members from a workspace
- Access control enforcement so only authorized users can manage membership

### Database Schema Updates
- **Workspace Members Table**: New join table for user–workspace membership
  - Fields: workspace_id (FK to workspaces), user_id (FK to users)
- **Tasks Table**: New table for future task management features
  - Fields: id (UUID), workspace_id (FK to workspaces), title, description, status, assigned_to (FK to users), created_by (FK to users), due_date, created_at, updated_at
- **Users Table**: Added `updated_at` field to track profile updates

### Backend API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users` | Create user | No |
| GET | `/api/users` | List users with pagination | Yes |
| GET | `/api/users/me` | Get current authenticated user | Yes |
| GET | `/api/users/{user_id}` | Get user by ID | Yes |
| PUT | `/api/users/{user_id}` | Update user profile | Yes |
| DELETE | `/api/users/{user_id}` | Delete user account | Yes |
| GET | `/api/workspaces` | List user workspaces | Yes |
| PUT | `/api/workspaces/{workspace_id}` | Edit workspace details | Yes |
| DELETE | `/api/workspaces/{workspace_id}` | Delete workspace | Yes |
| POST | `/api/workspaces/{workspace_id}/members` | Add workspace member | Yes |
| GET | `/api/workspaces/{workspace_id}/members` | List workspace members | Yes |
| DELETE | `/api/workspaces/{workspace_id}/members/{user_id}` | Remove workspace member | Yes |

### Backend Testing

| Test Category | Test Cases | Status |
|---------------|------------|--------|
| **User Handlers** | Create user, Conflict handling, Get current user, Unauthorized access, Update forbidden, Update success, Delete success, List users | ✅ Passing |
| **Workspace Handlers** | Create workspace, List workspaces, Get workspace, Update workspace, Delete workspace, Add member, List members, Remove member, Validation errors | ✅ Passing |
| **Document Handlers** | Create document, List documents, Get document, Update validation, Delete unauthorized, Forbidden access | ✅ Passing |
| **Authentication Middleware** | Valid token acceptance, Invalid token rejection, Missing token rejection | ✅ Passing |
| **JWT Authentication** | Generate valid token, Validate valid token, Reject invalid token | ✅ Passing |
| **Google OAuth** | Missing token, Invalid JSON, Invalid Google token | ✅ Passing |

### Test Coverage

| Package | Coverage |
|---------|----------|
| `internal/auth` | 64.5% |
| `internal/handlers` | 76.2% |
| `internal/middleware` | 81.0% |

## API Documentation

### Users

**POST /api/users**
```bash
# Request
{
  "email": "string",
  "name": "string",
  "profile_pic": "string"
}

# Response (201)
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "profile_pic": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**GET /api/users**
```bash
# Headers: Authorization: Bearer <token>
# Query params: limit, offset
# Response (200): Array of users
```

**GET /api/users/me**
```bash
# Headers: Authorization: Bearer <token>
# Response (200): Authenticated user object
```

**GET /api/users/{user_id}**
```bash
# Headers: Authorization: Bearer <token>
# Response (200)
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "profile_pic": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**PUT /api/users/{user_id}**
```bash
# Headers: Authorization: Bearer <token>
# Request
{
  "name": "string",
  "profile_pic": "string"
}

# Response (200): Updated user object
```

**DELETE /api/users/{user_id}**
```bash
# Headers: Authorization: Bearer <token>
# Response (204): No content
```

### Workspaces

**GET /api/workspaces**
```bash
# Headers: Authorization: Bearer <token>
# Response (200): Array of workspaces
```

**PUT /api/workspaces/{workspace_id}**
```bash
# Headers: Authorization: Bearer <token>
# Request
{ "name": "string" }

# Response (200): Updated workspace object
```

**DELETE /api/workspaces/{workspace_id}**
```bash
# Headers: Authorization: Bearer <token>
# Response (204): No content
```

### Workspace Members

**POST /api/workspaces/{workspace_id}/members**
```bash
# Headers: Authorization: Bearer <token>
# Request
{
  "user_id": "uuid",
  "email": "string"
}

# Response (201): Workspace member object
```

**GET /api/workspaces/{workspace_id}/members**
```bash
# Headers: Authorization: Bearer <token>
# Response (200): Array of workspace members
```

**DELETE /api/workspaces/{workspace_id}/members/{user_id}**
```bash
# Headers: Authorization: Bearer <token>
# Response (204): No content
```

### Common Error Responses

| Code | Error Message |
|------|---------------|
| 400 | `{"error": "invalid request body"}` |
| 400 | `{"error": "user_id is required"}` |
| 400 | `{"error": "workspace_id is required"}` |
| 400 | `{"error": "email and name are required"}` |
| 401 | `{"error": "unauthorized"}` |
| 403 | `{"error": "access denied"}` |
| 403 | `{"error": "you can only update your own profile"}` |
| 403 | `{"error": "you can only delete your own account"}` |
| 404 | `{"error": "user not found"}` |
| 404 | `{"error": "workspace not found"}` |
| 409 | `{"error": "user with this email already exists"}` |
| 500 | `{"error": "internal server error"}` |

### Sprint 3 Status: **COMPLETE**

All planned Sprint 3 backend enhancements have been implemented, tested, and documented that includes
- User APIs 
- Workspace management  
- Member management 
- Database schema updates for tasks and members.


# Frontend

## Completed Work

### Workspace-first application architecture
- Replaced the old top-level document model with a workspace-first structure
- Added a global authenticated home page at `/home` for the workspace hub
- Added workspace-scoped routes:
  - `/workspaces/:workspaceId/home`
  - `/workspaces/:workspaceId/documents`
  - `/workspaces/:workspaceId/documents/:documentId`
  - `/workspaces/:workspaceId/teams`
  - `/workspaces/:workspaceId/tasks`
- Removed Chat from the workspace navigation

### Authenticated layouts
- Split authenticated UI into two layouts:
  - global authenticated layout for the workspace hub
  - workspace layout with a left sidebar for workspace-scoped pages
- Added a workspace switcher in the sidebar
- Added a separate create-workspace action in the workspace shell

### Workspace management
- Integrated real workspace APIs for:
  - list workspaces
  - create workspace
  - get one workspace
  - update workspace name
  - delete workspace
- Added inline workspace rename from the selected workspace header
- Added workspace delete from the global workspace hub
- Added proper empty state handling when no workspaces exist

### Document management
- Scoped all documents to a selected workspace
- Integrated real document APIs for:
  - list documents in a workspace
  - create document in a workspace
  - get one document
  - update document
  - delete document
- Added proper empty state handling when a workspace has no documents
- Added document delete from:
  - workspace documents page
  - workspace home recent-documents section
  - document editor page

### Document editor
- Built a rich text document editor with a title input, formatting toolbar, and manual save
- Kept markdown as the saved format
- Added loading, saving, success, and error states
- Improved the editor UI to better match the app theme
- Fixed list marker visibility and editor selection behavior issues

### API integration and frontend behavior
- Replaced temporary frontend-only workspace/document storage with real backend integration
- Added centralized request and response logging in the shared API client
- Added the ngrok header required by the backend environment
- Updated the frontend to match the backend contract changes:
  - workspace uses only `name`
  - document creation uses `title` and `content`
  - removed old description and summary assumptions

### UI refinements
- Removed redundant page header blocks from:
  - global home
  - workspace home
  - workspace documents page
  - document editor page
- Improved workspace switcher behavior with outside-click close
- Added lightweight animations for workspace shell interactions

### Testing
- Added Cypress end-to-end coverage for the main Sprint 3 flows:
  - workspace create and delete
  - workspace switcher and rename
  - empty document state
  - document create, save, and delete
  - document delete from workspace home

### Sprint 3 Status: ✅ **COMPLETE**

The frontend is now organized around workspaces, connected to the backend APIs, and supports the full workspace/document flow required for the current product scope.
