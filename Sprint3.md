# Sprint 3

Sprint 3 focused on expanding the SyncSpace backend with complete workspace management APIs, user CRUD operations, workspace member management, stronger test coverage, and task schema support for future work tracking features.

- [Issues page](https://github.com/Jaysurya85/SyncSpace/issues?q=is%3Aissue)
- [Project Board](https://github.com/users/Jaysurya85/projects/1)

# Backend
## Completed Work

### Workspace API Expansion
- Added full workspace management support beyond basic creation
- Implemented workspace listing for authenticated users
- Implemented workspace fetch by ID for members
- Implemented workspace edit/update for workspace owners
- Implemented workspace deletion for workspace owners

### Workspace Member Management
- Added API to add members into a workspace
- Added API to list all members of a workspace
- Added API to remove members from a workspace
- Supported adding members using either user ID or email
- Enforced access control so only authorized users can manage membership

### User APIs
- Added user creation API
- Added authenticated user profile fetch API (`/api/users/me`)
- Added user fetch by ID API
- Added user update API
- Added user delete API
- Added paginated user list API

### Fetch and Edit Operations
- Added fetch APIs for workspaces and users
- Added edit/update APIs for workspaces, documents, and users
- Preserved authorization checks so users can only edit resources they are allowed to manage

### Database Schema Updates
- Added support for member relationships between users and workspaces
- Added task table for task management groundwork
  - Fields: id (UUID), workspace_id (FK), title, description, status, assigned_to (FK to users), created_by (FK to users), due_date, created_at, updated_at
- Added `updated_at` support for users to track profile updates

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
| GET | `/api/workspaces/{workspace_id}` | Fetch workspace details | Yes |
| PUT | `/api/workspaces/{workspace_id}` | Edit workspace details | Yes |
| DELETE | `/api/workspaces/{workspace_id}` | Delete workspace | Yes |
| POST | `/api/workspaces/{workspace_id}/members` | Add workspace member | Yes |
| GET | `/api/workspaces/{workspace_id}/members` | List workspace members | Yes |
| DELETE | `/api/workspaces/{workspace_id}/members/{user_id}` | Remove workspace member | Yes |
| POST | `/api/workspaces/{workspace_id}/documents` | Create document | Yes |
| GET | `/api/workspaces/{workspace_id}/documents` | List workspace documents | Yes |
| GET | `/api/documents/{document_id}` | Fetch document | Yes |
| PUT | `/api/documents/{document_id}` | Edit document | Yes |
| DELETE | `/api/documents/{document_id}` | Delete document | Yes |

### Backend Testing

| Test Category | Test Cases | Status |
|---------------|------------|--------|
| **User Handlers** | Create user, Conflict handling, Get current user, Unauthorized access, Update forbidden, Update success, Delete success, List users | ✅ Passing |
| **Workspace Handlers** | Create workspace, List workspaces, Get workspace, Update workspace, Delete workspace, Add member, List members, Remove member, Validation errors | ✅ Passing |
| **Document Handlers** | Create document, List documents, Get document, Update validation, Delete unauthorized, Forbidden access | ✅ Passing |
| **Authentication Middleware** | Valid token acceptance, Invalid token rejection, Missing token rejection | ✅ Passing |
| **JWT Authentication** | Generate valid token, Validate valid token, Reject invalid token | ✅ Passing |
| **Google OAuth** | Missing token, Invalid JSON, Invalid Google token | ✅ Passing |

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

### Sprint 3 Status: ✅ **COMPLETE**

All planned Sprint 3 backend enhancements have been implemented, including workspace APIs, user APIs, member management, fetch and edit flows, database task table creation, and additional unit test coverage.
