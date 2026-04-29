type WorkspaceFixture = {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string;
  role: string;
  created_at: string;
  updated_at: string;
  document_count: number;
};

type WorkspaceMemberFixture = {
  workspace_id: string;
  user_id: string;
  email: string;
  name: string;
  role: string;
  joined_at: string;
};

type TaskFixture = {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assigned_to?: string;
  created_by: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
};

const WORKSPACE_ID = "ws-sprint-4";
const USER_ID = "e2e-user-1";
const OTHER_USER_ID = "e2e-user-2";

const workspace: WorkspaceFixture = {
  id: WORKSPACE_ID,
  name: "Sprint 4 Workspace",
  owner_id: USER_ID,
  owner_name: "Cypress User",
  role: "owner",
  created_at: "2026-04-26T10:00:00.000Z",
  updated_at: "2026-04-26T10:00:00.000Z",
  document_count: 0,
};

const members: WorkspaceMemberFixture[] = [
  {
    workspace_id: WORKSPACE_ID,
    user_id: USER_ID,
    email: "cypress@example.com",
    name: "Cypress User",
    role: "owner",
    joined_at: "2026-04-26T10:00:00.000Z",
  },
  {
    workspace_id: WORKSPACE_ID,
    user_id: OTHER_USER_ID,
    email: "teammate@example.com",
    name: "Team Mate",
    role: "member",
    joined_at: "2026-04-26T10:05:00.000Z",
  },
];

const createTask = (
  id: string,
  title: string,
  status: TaskFixture["status"],
  assignedTo?: string
): TaskFixture => ({
  id,
  workspace_id: WORKSPACE_ID,
  title,
  description: `${title} description`,
  status,
  priority: "medium",
  assigned_to: assignedTo,
  created_by: USER_ID,
  deadline: "2026-04-30T12:00:00.000Z",
  created_at: "2026-04-26T10:00:00.000Z",
  updated_at: "2026-04-26T10:00:00.000Z",
});

const seedSession = (path: string, theme?: "light" | "dark") => {
  cy.visit(path, {
    onBeforeLoad(window) {
      window.localStorage.setItem(
        "syncspace-auth",
        JSON.stringify({
          id: USER_ID,
          name: "Cypress User",
          email: "cypress@example.com",
          avatar: "",
          provider: "google",
        })
      );
      window.localStorage.setItem("syncspace-token", "e2e-jwt-token");

      if (theme) {
        window.localStorage.setItem("syncspace-theme", theme);
      } else {
        window.localStorage.removeItem("syncspace-theme");
      }
    },
  });
};

const stubSprint4Api = (initialTasks: TaskFixture[]) => {
  let tasks = [...initialTasks];

  const findTask = (taskId: string) =>
    tasks.find((task) => task.id === taskId);

  cy.intercept("GET", "**/api/workspaces", [workspace]).as("getWorkspaces");
  cy.intercept("GET", `**/api/workspaces/${WORKSPACE_ID}`, workspace).as(
    "getWorkspaceById"
  );
  cy.intercept("GET", `**/api/workspaces/${WORKSPACE_ID}/members`, members).as(
    "getWorkspaceMembers"
  );
  cy.intercept("GET", `**/api/workspaces/${WORKSPACE_ID}/documents`, []).as(
    "getWorkspaceDocuments"
  );

  cy.intercept("GET", `**/api/workspaces/${WORKSPACE_ID}/tasks`, (request) => {
    request.reply(tasks);
  }).as("getWorkspaceTasks");

  cy.intercept(
    "GET",
    `**/api/workspaces/${WORKSPACE_ID}/tasks/assignees/${USER_ID}`,
    (request) => {
      request.reply(tasks.filter((task) => task.assigned_to === USER_ID));
    }
  ).as("getAssignedTasks");

  cy.intercept("POST", `**/api/workspaces/${WORKSPACE_ID}/tasks`, (request) => {
    const createdTask: TaskFixture = {
      id: `task-created-${tasks.length + 1}`,
      workspace_id: WORKSPACE_ID,
      title: String(request.body.title),
      description: String(request.body.description),
      status: "todo",
      priority: request.body.priority,
      assigned_to: request.body.assigned_to,
      created_by: USER_ID,
      deadline: request.body.deadline,
      created_at: "2026-04-26T13:00:00.000Z",
      updated_at: "2026-04-26T13:00:00.000Z",
    };

    tasks = [createdTask, ...tasks];
    request.reply({ statusCode: 201, body: createdTask });
  }).as("createTask");

  cy.intercept("GET", /.*\/api\/tasks\/[^/]+$/, (request) => {
    const taskId = request.url.split("/").pop() ?? "";
    const task = findTask(taskId);

    if (!task) {
      request.reply({ statusCode: 404, body: { error: "task not found" } });
      return;
    }

    request.reply(task);
  }).as("getTaskById");

  cy.intercept("PUT", /.*\/api\/tasks\/[^/]+$/, (request) => {
    const taskId = request.url.split("/").pop() ?? "";
    const task = findTask(taskId);

    if (!task) {
      request.reply({ statusCode: 404, body: { error: "task not found" } });
      return;
    }

    const updatedTask: TaskFixture = {
      ...task,
      title: String(request.body.title),
      description: String(request.body.description),
      status: request.body.status,
      priority: request.body.priority,
      assigned_to: request.body.assigned_to,
      deadline: request.body.deadline,
      updated_at: "2026-04-26T14:00:00.000Z",
    };

    tasks = tasks.map((entry) => (entry.id === taskId ? updatedTask : entry));
    request.reply(updatedTask);
  }).as("updateTask");
};

const visitTasksPage = () => {
  seedSession(`/workspaces/${WORKSPACE_ID}/tasks`);
  cy.wait("@getWorkspaces");
  cy.wait("@getWorkspaceById");
  cy.wait("@getWorkspaceMembers");
  cy.wait("@getWorkspaceDocuments");
  cy.wait("@getWorkspaceTasks");
};

const getBoardColumn = (title: string) =>
  cy.contains("h3", title).parents("section").first();

describe("sprint 4 task board and theme flows", () => {
  it("defaults to dark mode and persists the manual light toggle", () => {
    stubSprint4Api([]);
    visitTasksPage();

    cy.get("html").should("have.attr", "data-theme", "dark");
    cy.get('button[title="Switch to light mode"]').click();
    cy.get("html").should("have.attr", "data-theme", "light");
    cy.window()
      .its("localStorage")
      .invoke("getItem", "syncspace-theme")
      .should("equal", "light");

    cy.reload();
    cy.wait("@getWorkspaces");
    cy.wait("@getWorkspaceById");
    cy.wait("@getWorkspaceMembers");
    cy.wait("@getWorkspaceDocuments");
    cy.wait("@getWorkspaceTasks");
    cy.get("html").should("have.attr", "data-theme", "light");
  });

  it("renders tasks in status columns and filters to tasks assigned to me", () => {
    stubSprint4Api([
      createTask("task-mine", "My implementation task", "todo", USER_ID),
      createTask("task-team", "Team review task", "in_progress", OTHER_USER_ID),
      createTask("task-done", "Closed release task", "done"),
    ]);

    visitTasksPage();

    getBoardColumn("Todo").within(() => {
      cy.contains("My implementation task").should("be.visible");
    });
    getBoardColumn("In Progress").within(() => {
      cy.contains("Team review task").should("be.visible");
    });
    getBoardColumn("Done").within(() => {
      cy.contains("Closed release task").should("be.visible");
    });

    cy.contains("button", "Assigned to me").click();
    cy.wait("@getAssignedTasks")
      .its("request.url")
      .should("include", `/tasks/assignees/${USER_ID}`);
    cy.contains("My implementation task").should("be.visible");
    cy.contains("Team review task").should("not.exist");
    cy.contains("Closed release task").should("not.exist");
  });

  it("creates and edits a backend task from the modal forms", () => {
    stubSprint4Api([createTask("task-1", "Existing task", "todo", USER_ID)]);
    visitTasksPage();

    cy.contains("button", "+ New task").click();
    cy.get('input[placeholder="Add keyboard shortcuts to documents"]').type(
      "Write Sprint 4 QA notes"
    );
    cy.get("textarea").first().type("Document the Cypress coverage for Sprint 4.");
    cy.contains("label", "Assignee").parent().find("select").select(USER_ID);
    cy.contains("label", "Priority").parent().find("select").select("high");
    cy.contains("button", "Create task").click();

    cy.wait("@createTask").then((interception) => {
      expect(interception.request.body).to.include({
        title: "Write Sprint 4 QA notes",
        description: "Document the Cypress coverage for Sprint 4.",
        priority: "high",
        assigned_to: USER_ID,
      });
    });
    cy.contains("Write Sprint 4 QA notes").should("be.visible");

    cy.contains("Existing task").click();
    cy.get('input[value="Existing task"]').clear().type("Existing task updated");
    cy.get("textarea").clear().type("Updated task details.");
    cy.contains("label", "Status").parent().find("select").select("done");
    cy.contains("label", "Assignee").parent().find("select").select(OTHER_USER_ID);
    cy.contains("label", "Priority").parent().find("select").select("low");
    cy.contains("button", "Save changes").click();

    cy.wait("@updateTask").then((interception) => {
      expect(interception.request.body).to.include({
        title: "Existing task updated",
        description: "Updated task details.",
        status: "done",
        priority: "low",
        assigned_to: OTHER_USER_ID,
      });
    });
    cy.contains("Existing task updated").should("be.visible");
  });

  it("moves a task between board columns with drag and drop", () => {
    stubSprint4Api([createTask("task-drag", "Drag me to done", "todo", USER_ID)]);
    visitTasksPage();

    cy.window().then((window) => {
      const dataTransfer = new window.DataTransfer();

      cy.contains("article", "Drag me to done").trigger("dragstart", {
        dataTransfer,
        force: true,
      });
      getBoardColumn("Done").trigger("dragover", { dataTransfer, force: true });
      getBoardColumn("Done").trigger("drop", { dataTransfer, force: true });
    });

    cy.wait("@getTaskById");
    cy.wait("@updateTask").then((interception) => {
      expect(interception.request.body.status).to.equal("done");
    });

    getBoardColumn("Done").within(() => {
      cy.contains("Drag me to done").should("be.visible");
    });
  });
});
