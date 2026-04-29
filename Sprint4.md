# Sprint 4

Sprint 4 focused on completing backend task management support, strengthening task handler test coverage, improving authentication test coverage, and refining backend test commands. Frontend work included connecting the task board to the backend APIs, dark mode support, and Cypress test coverage.

- [Issues page](https://github.com/Jaysurya85/SyncSpace/issues?q=is%3Aissue)
- [Project Board](https://github.com/users/Jaysurya85/projects/1)

# Backend
## Completed Work

### Task Management APIs
- Create task inside a workspace
- List all tasks in a workspace
- List tasks assigned to a specific workspace member
- Fetch task by ID
- Assign task to a workspace member
- Update task details, status, priority, assignee, and deadline
- Delete task by ID
- Access control enforcement so only workspace members can view or modify workspace tasks
- Assignee validation to ensure tasks can only be assigned to workspace members

### Task Handler Validation
- Unauthorized request handling
- Missing `workspace_id` handling
- Missing `task_id` handling
- Invalid JSON request handling
- Required title validation
- Required assignee validation for assignment
- Store error mapping for forbidden, not found, assignee not found, and internal errors

### Backend API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/workspaces/{workspace_id}/tasks` | Create task in workspace | Yes |
| GET | `/api/workspaces/{workspace_id}/tasks` | List workspace tasks | Yes |
| GET | `/api/workspaces/{workspace_id}/tasks/assignees/{assignee_id}` | List tasks by assignee | Yes |
| GET | `/api/tasks/{task_id}` | Get task by ID | Yes |
| PUT | `/api/tasks/{task_id}/assign` | Assign task to workspace member | Yes |
| PUT | `/api/tasks/{task_id}` | Update task | Yes |
| DELETE | `/api/tasks/{task_id}` | Delete task | Yes |

### Backend Testing

| Test Category | Test Cases | Status |
|---------------|------------|--------|
| **Task Handlers** | Create, list, list by assignee, get, assign, update, delete, unauthorized access, validation errors, store errors | Passing |
| **Authentication** | JWT generation, JWT validation, invalid JWT rejection, missing JWT secret, Google OAuth missing client ID, invalid Google token | Passing |
| **Authentication Middleware** | Valid token acceptance, invalid token rejection, missing token rejection | Passing |
| **Coverage Target** | Fresh coverage run using `make test-coverage` with `-count=1` | Passing |

### Test Coverage

| Package | Coverage |
|---------|----------|
| `internal/auth` | 74.2% |
| `internal/handlers` | 81.9% |
| `internal/middleware` | 81.0% |

Coverage command:

```bash
make test-coverage
```

## API Documentation

### Tasks

**POST /api/workspaces/{workspace_id}/tasks**
```bash
# Headers: Authorization: Bearer <token>
# Request
{
  "title": "string",
  "description": "string",
  "priority": "low | medium | high",
  "assigned_to": "uuid",
  "deadline": "timestamp"
}

# Response (201): Created task object
```

**GET /api/workspaces/{workspace_id}/tasks**
```bash
# Headers: Authorization: Bearer <token>
# Response (200): Array of tasks
```

**GET /api/workspaces/{workspace_id}/tasks/assignees/{assignee_id}**
```bash
# Headers: Authorization: Bearer <token>
# Response (200): Array of tasks assigned to the user
```

**GET /api/tasks/{task_id}**
```bash
# Headers: Authorization: Bearer <token>
# Response (200): Single task object
```

**PUT /api/tasks/{task_id}/assign**
```bash
# Headers: Authorization: Bearer <token>
# Request
{
  "assigned_to": "uuid"
}

# Response (200): Updated task object
```

**PUT /api/tasks/{task_id}**
```bash
# Headers: Authorization: Bearer <token>
# Request
{
  "title": "string",
  "description": "string",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "assigned_to": "uuid",
  "deadline": "timestamp"
}

# Response (200): Updated task object
```

**DELETE /api/tasks/{task_id}**
```bash
# Headers: Authorization: Bearer <token>
# Response (204): No content
```

### Common Error Responses

| Code | Error Message |
|------|---------------|
| 400 | `{"error": "invalid request body"}` |
| 400 | `{"error": "workspace_id is required"}` |
| 400 | `{"error": "task_id is required"}` |
| 400 | `{"error": "title is required"}` |
| 400 | `{"error": "assigned_to is required"}` |
| 401 | `{"error": "unauthorized"}` |
| 403 | `{"error": "access denied"}` |
| 404 | `{"error": "workspace not found"}` |
| 404 | `{"error": "task not found"}` |
| 404 | `{"error": "assignee not found"}` |
| 500 | `{"error": "internal server error"}` |

### Sprint 4 Backend Status: **COMPLETE**

All planned Sprint 4 backend enhancements have been implemented, tested, and documented. This includes:
- Task management APIs
- Task authorization and validation
- Task handler test coverage
- Authentication test improvements
- Fresh coverage execution through the Makefile

# Frontend

### Teams

- Integrated workspace member management with the backend workspace member APIs.
- Added support for viewing all members in the selected workspace.
- Added member summary cards for total members, owners, and the current user's role.
- Added remove-member support for removable non-owner members.
- Kept owner and current-user protections in the UI so owners/current user are not shown as removable.
- Updated team loading, empty, and error states.

### Tasks

- Replaced the placeholder Tasks page with a workspace-scoped task board.
- Integrated task APIs with the backend task contract:
  - `GET /api/workspaces/{workspace_id}/tasks`
  - `POST /api/workspaces/{workspace_id}/tasks`
  - `GET /api/workspaces/{workspace_id}/tasks/assignees/{assignee_id}`
  - `GET /api/tasks/{task_id}`
  - `PUT /api/tasks/{task_id}`
- Updated frontend task types to match backend fields:
  - `id`
  - `workspace_id`
  - `title`
  - `description`
  - `status`
  - `priority`
  - `assigned_to`
  - `created_by`
  - `deadline`
  - `created_at`
  - `updated_at`
- Built a Kanban-style board grouped by task status:
  - Todo
  - In Progress
  - Done
- Added compact task cards with title, task reference, status, priority, assignee, deadline, and updated date.
- Added create-task modal with title, description, assignee, priority, and deadline fields.
- Added edit-task modal with title, description, status, assignee, priority, and deadline fields.
- Added modal backdrop behavior so clicking outside the modal closes it.
- Moved task modals into a root-level portal so overlays cover the full viewport.
- Added background scroll locking while task modals are open.
- Added inline status select controls for moving tasks between columns.
- Added drag-and-drop support for moving tasks between Todo, In Progress, and Done.
- Added task scope filtering:
  - All tasks
  - Assigned to me
- Added fallback behavior for Assigned to me:
  - It first calls the backend assignee endpoint.
  - If that returns no tasks, it falls back to all workspace tasks and filters locally by the current user ID.
- Removed the old task mock localStorage implementation after backend integration.

### Dark Mode

- Added manual light/dark theme support.
- Default theme is dark.
- Added top-right theme toggle in the authenticated user panel.
- Used sun/moon emoji for the toggle.
- Persisted theme choice in `localStorage` with `syncspace-theme`.
- Added an early theme script in `index.html` to avoid a light flash before React loads.
- Converted Tailwind theme colors to CSS variables.
- Added dark-mode color tokens for:
  - primary
  - primary hover
  - primary light
  - background
  - surface
  - border
  - text primary
  - text secondary
  - text muted
  - danger states
- Updated shared UI elements to use theme-aware colors:
  - inputs
  - buttons
  - workspace sidebar
  - workspace switcher
  - authenticated user panel
  - cards
  - task board controls
  - error states
- Updated document editor CSS colors so editor text, markers, links, code, and pre blocks adapt to the active theme.

## Frontend Tests

### Unit Tests

Existing Vitest unit tests remain available for shared and auth components:

- `src/shared/components/__tests__/Button.test.tsx`
- `src/shared/components/__tests__/Input.test.tsx`
- `src/features/auth/__tests__/AuthContext.test.tsx`

Run unit tests with:

```bash
npm run test:unit
```

### Cypress Tests

#### Existing Cypress Coverage Updated

Updated:

- `cypress/e2e/authenticated-layout.cy.ts`

Changes made:

- Updated workspace fixtures to include owner metadata and role.
- Added workspace members API stubbing.
- Kept coverage passing for existing workspace and document flows after Sprint 4 workspace member changes.

Covered flows:

- Create and delete workspaces.
- Switch workspaces.
- Close workspace switcher by clicking outside.
- Rename workspace.
- Show empty document state.
- Create document.
- Delete document from list.
- Save document from editor.
- Delete document from editor.
- Delete recent document from workspace home.

#### New Sprint 4 Cypress Spec

Added:

- `cypress/e2e/sprint-4-tasks-and-theme.cy.ts`

Covered flows:

- Dark mode defaults to dark.
- Theme toggle switches to light mode.
- Theme choice persists in `localStorage`.
- Task board renders Todo, In Progress, and Done columns.
- Tasks appear in the correct status columns.
- Assigned to me filter calls the assignee endpoint.
- Assigned to me view only displays tasks assigned to the current user.
- Create task modal sends the expected backend payload.
- Edit task modal sends updated title, description, status, priority, and assignee.
- Drag-and-drop moves a task between board columns and updates task status.

Run only the Sprint 4 Cypress spec with:

```bash
npm run build
npx start-server-and-test preview:test http://127.0.0.1:4173 "cypress run --spec cypress/e2e/sprint-4-tasks-and-theme.cy.ts"
```

Run all Cypress tests with:

```bash
npm run test:e2e
```

Run the full frontend test suite with:

```bash
npm test
```

## Verification

The following checks were run successfully after the Sprint 4 Cypress updates:

```bash
npm run build
npm run lint
npx start-server-and-test preview:test http://127.0.0.1:4173 "cypress run"
```

Final Cypress result:

- `authenticated-layout.cy.ts`: 5 passing
- `sprint-4-tasks-and-theme.cy.ts`: 4 passing
- Total Cypress tests: 9 passing
