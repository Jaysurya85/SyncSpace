type WorkspaceFixture = {
  id: string;
  name: string;
  owner_name: string;
  updated_at: string;
};

type DocumentFixture = {
  id: string;
  workspace_id: string;
  title: string;
  owner_name: string;
  status: string;
  updated_at: string;
  content: string;
};

const WORKSPACE_ONE_ID = "ws-product-design-sprint";
const WORKSPACE_TWO_ID = "ws-engineering-ops";

const createWorkspace = (
  id: string,
  name: string,
  ownerName = "Cypress User"
): WorkspaceFixture => ({
  id,
  name,
  owner_name: ownerName,
  updated_at: "2026-04-12T10:00:00.000Z",
});

const createDocument = (
  id: string,
  workspaceId: string,
  title: string
): DocumentFixture => ({
  id,
  workspace_id: workspaceId,
  title,
  owner_name: "Cypress User",
  status: "Draft",
  updated_at: "2026-04-12T10:00:00.000Z",
  content: `# ${title}\n\nInitial content.`,
});

const seedSession = () => {
  cy.visit("/home", {
    onBeforeLoad(window) {
      window.localStorage.setItem(
        "syncspace-auth",
        JSON.stringify({
          id: "e2e-user-1",
          name: "Cypress User",
          email: "cypress@example.com",
          avatar: "",
          provider: "google",
        })
      );
      window.localStorage.setItem("syncspace-token", "e2e-jwt-token");
    },
  });
};

const stubWorkspaceAndDocumentApi = ({
  initialWorkspaces,
  initialDocumentsByWorkspace,
}: {
  initialWorkspaces: WorkspaceFixture[];
  initialDocumentsByWorkspace: Record<string, DocumentFixture[]>;
}) => {
  let workspaces = [...initialWorkspaces];
  const documentsByWorkspace = Object.fromEntries(
    Object.entries(initialDocumentsByWorkspace).map(([workspaceId, documents]) => [
      workspaceId,
      [...documents],
    ])
  ) as Record<string, DocumentFixture[]>;

  const getWorkspaceDocuments = (workspaceId: string) =>
    documentsByWorkspace[workspaceId] ?? [];

  const findDocument = (documentId: string) =>
    Object.values(documentsByWorkspace)
      .flat()
      .find((document) => document.id === documentId);

  const getWorkspaceResponse = (workspaceId: string) => {
    const workspace = workspaces.find((entry) => entry.id === workspaceId);

    if (!workspace) {
      return null;
    }

    return {
      ...workspace,
      document_count: getWorkspaceDocuments(workspaceId).length,
    };
  };

  cy.intercept("GET", "**/api/workspaces", (request) => {
    request.reply(
      workspaces.map((workspace) => ({
        ...workspace,
        document_count: getWorkspaceDocuments(workspace.id).length,
      }))
    );
  }).as("getWorkspaces");

  cy.intercept("POST", "**/api/workspaces", (request) => {
    const createdWorkspace = createWorkspace(
      `ws-created-${workspaces.length + 1}`,
      request.body.name as string
    );

    workspaces = [createdWorkspace, ...workspaces];
    documentsByWorkspace[createdWorkspace.id] = [];

    request.reply({
      ...createdWorkspace,
      document_count: 0,
    });
  }).as("createWorkspace");

  cy.intercept("GET", /.*\/api\/workspaces\/[^/]+$/, (request) => {
    const workspaceId = request.url.split("/").pop() ?? "";
    const workspace = getWorkspaceResponse(workspaceId);

    if (!workspace) {
      request.reply({ statusCode: 404, body: { error: "Workspace not found." } });
      return;
    }

    request.reply(workspace);
  }).as("getWorkspaceById");

  cy.intercept("PUT", /.*\/api\/workspaces\/[^/]+$/, (request) => {
    const workspaceId = request.url.split("/").pop() ?? "";
    const nextName = String(request.body.name ?? "");
    const existingWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);

    if (!existingWorkspace) {
      request.reply({ statusCode: 404, body: { error: "Workspace not found." } });
      return;
    }

    const updatedWorkspace = {
      ...existingWorkspace,
      name: nextName,
      updated_at: "2026-04-12T11:00:00.000Z",
    };

    workspaces = workspaces.map((workspace) =>
      workspace.id === workspaceId ? updatedWorkspace : workspace
    );

    request.reply({
      ...updatedWorkspace,
      document_count: getWorkspaceDocuments(workspaceId).length,
    });
  }).as("renameWorkspace");

  cy.intercept("DELETE", /.*\/api\/workspaces\/[^/]+$/, (request) => {
    const workspaceId = request.url.split("/").pop() ?? "";
    workspaces = workspaces.filter((workspace) => workspace.id !== workspaceId);
    delete documentsByWorkspace[workspaceId];
    request.reply({ statusCode: 204, body: "" });
  }).as("deleteWorkspace");

  cy.intercept("GET", /.*\/api\/workspaces\/[^/]+\/documents$/, (request) => {
    const workspaceId = request.url.split("/").slice(-2, -1)[0] ?? "";
    const documents = getWorkspaceDocuments(workspaceId);
    request.reply({
      statusCode: 200,
      body: documents.length === 0 ? null : documents,
    });
  }).as("getWorkspaceDocuments");

  cy.intercept("POST", /.*\/api\/workspaces\/[^/]+\/documents$/, (request) => {
    const workspaceId = request.url.split("/").slice(-2, -1)[0] ?? "";
    const createdDocument = createDocument(
      `doc-created-${getWorkspaceDocuments(workspaceId).length + 1}`,
      workspaceId,
      String(request.body.title ?? "Untitled document")
    );

    documentsByWorkspace[workspaceId] = [
      createdDocument,
      ...getWorkspaceDocuments(workspaceId),
    ];

    request.reply(createdDocument);
  }).as("createDocument");

  cy.intercept("GET", /.*\/api\/documents\/[^/]+$/, (request) => {
    const documentId = request.url.split("/").pop() ?? "";
    const document = findDocument(documentId);

    if (!document) {
      request.reply({ statusCode: 404, body: { error: "Document not found." } });
      return;
    }

    request.reply(document);
  }).as("getDocumentById");

  cy.intercept("PUT", /.*\/api\/documents\/[^/]+$/, (request) => {
    const documentId = request.url.split("/").pop() ?? "";
    const existingDocument = findDocument(documentId);

    if (!existingDocument) {
      request.reply({ statusCode: 404, body: { error: "Document not found." } });
      return;
    }

    const updatedDocument: DocumentFixture = {
      ...existingDocument,
      title: String(request.body.title ?? existingDocument.title),
      content: String(request.body.content ?? existingDocument.content),
      updated_at: "2026-04-12T12:00:00.000Z",
    };

    documentsByWorkspace[existingDocument.workspace_id] = getWorkspaceDocuments(
      existingDocument.workspace_id
    ).map((document) => (document.id === documentId ? updatedDocument : document));

    request.reply(updatedDocument);
  }).as("saveDocument");

  cy.intercept("DELETE", /.*\/api\/documents\/[^/]+$/, (request) => {
    const documentId = request.url.split("/").pop() ?? "";
    const existingDocument = findDocument(documentId);

    if (!existingDocument) {
      request.reply({ statusCode: 404, body: { error: "Document not found." } });
      return;
    }

    documentsByWorkspace[existingDocument.workspace_id] = getWorkspaceDocuments(
      existingDocument.workspace_id
    ).filter((document) => document.id !== documentId);

    request.reply({ statusCode: 204, body: "" });
  }).as("deleteDocument");
};

describe("workspace and document sprint flows", () => {
  it("creates and deletes workspaces from the global workspace hub", () => {
    stubWorkspaceAndDocumentApi({
      initialWorkspaces: [
        createWorkspace(WORKSPACE_ONE_ID, "Product Design Sprint"),
        createWorkspace(WORKSPACE_TWO_ID, "Engineering Ops"),
      ],
      initialDocumentsByWorkspace: {
        [WORKSPACE_ONE_ID]: [createDocument("doc-1", WORKSPACE_ONE_ID, "Kickoff Notes")],
        [WORKSPACE_TWO_ID]: [],
      },
    });

    seedSession();
    cy.wait("@getWorkspaces");

    cy.contains("Product Design Sprint").should("be.visible");
    cy.contains("Engineering Ops").should("be.visible");

    cy.get('input[placeholder="Marketing launch"]').type("Platform Core");
    cy.contains("button", "+ Create workspace").click();
    cy.wait("@createWorkspace")
      .its("request.body")
      .should("deep.equal", { name: "Platform Core" });

    cy.url().should("include", "/workspaces/ws-created-3/home");
    cy.visit("/home");
    cy.wait("@getWorkspaces");
    cy.contains("Platform Core").should("be.visible");

    cy.get('button[aria-label="Delete Platform Core"]').click();
    cy.wait("@deleteWorkspace");
    cy.contains("Platform Core").should("not.exist");
  });

  it("supports workspace switching, outside-click close, and renaming", () => {
    stubWorkspaceAndDocumentApi({
      initialWorkspaces: [
        createWorkspace(WORKSPACE_ONE_ID, "Product Design Sprint"),
        createWorkspace(WORKSPACE_TWO_ID, "Engineering Ops"),
      ],
      initialDocumentsByWorkspace: {
        [WORKSPACE_ONE_ID]: [createDocument("doc-1", WORKSPACE_ONE_ID, "Kickoff Notes")],
        [WORKSPACE_TWO_ID]: [createDocument("doc-2", WORKSPACE_TWO_ID, "Ops Handbook")],
      },
    });

    seedSession();
    cy.wait("@getWorkspaces");
    cy.contains("Product Design Sprint").click();
    cy.url().should("include", `/workspaces/${WORKSPACE_ONE_ID}/home`);

    cy.contains("button", "Current Workspace").click();
    cy.contains("Available workspaces").should("be.visible");
    cy.get("body").click(0, 0);
    cy.contains("Available workspaces").should("not.exist");

    cy.contains("button", "Current Workspace").click();
    cy.contains("button", "Engineering Ops").click();
    cy.url().should("include", `/workspaces/${WORKSPACE_TWO_ID}/home`);

    cy.contains("button", "Edit name").click();
    cy.get('input[placeholder="Workspace name"]').clear().type("Engineering Platform");
    cy.contains("button", "Save").click();
    cy.wait("@renameWorkspace")
      .its("request.body")
      .should("deep.equal", { name: "Engineering Platform" });
    cy.contains("Engineering Platform").should("be.visible");
  });

  it("shows the empty document state and supports document create and delete from the list", () => {
    stubWorkspaceAndDocumentApi({
      initialWorkspaces: [createWorkspace(WORKSPACE_ONE_ID, "Product Design Sprint")],
      initialDocumentsByWorkspace: {
        [WORKSPACE_ONE_ID]: [],
      },
    });

    seedSession();
    cy.visit(`/workspaces/${WORKSPACE_ONE_ID}/documents`);
    cy.wait("@getWorkspaces");
    cy.wait("@getWorkspaceById");
    cy.wait("@getWorkspaceDocuments");

    cy.contains("No documents in this workspace yet").should("be.visible");

    cy.get('input[placeholder="Weekly retro notes"]').type("Release Plan");
    cy.contains("button", "Create document").click();
    cy.wait("@createDocument")
      .its("request.body")
      .should("deep.equal", {
        title: "Release Plan",
        content: "# Release Plan\n\n",
      });

    cy.url().should("include", "/documents/doc-created-1");
    cy.visit(`/workspaces/${WORKSPACE_ONE_ID}/documents`);
    cy.wait("@getWorkspaceDocuments");
    cy.contains("Release Plan").should("be.visible");

    cy.get('button[aria-label="Delete Release Plan"]').click();
    cy.wait("@deleteDocument");
    cy.contains("Release Plan").should("not.exist");
    cy.contains("No documents in this workspace yet").should("be.visible");
  });

  it("saves and deletes a document from the editor route", () => {
    stubWorkspaceAndDocumentApi({
      initialWorkspaces: [createWorkspace(WORKSPACE_ONE_ID, "Product Design Sprint")],
      initialDocumentsByWorkspace: {
        [WORKSPACE_ONE_ID]: [
          createDocument("doc-1", WORKSPACE_ONE_ID, "Kickoff Notes"),
        ],
      },
    });

    seedSession();
    cy.visit(`/workspaces/${WORKSPACE_ONE_ID}/documents/doc-1`);
    cy.wait("@getWorkspaces");
    cy.wait("@getWorkspaceById");
    cy.wait("@getWorkspaceDocuments");
    cy.wait("@getDocumentById");

    cy.get('input[placeholder="Untitled"]').clear().type("Kickoff Notes Updated");
    cy.contains("button", "Save").click();
    cy.wait("@saveDocument").then((interception) => {
      expect(interception.request.body.title).to.equal("Kickoff Notes Updated");
      expect(interception.request.body.content).to.be.a("string");
      expect(interception.request.body.content.length).to.be.greaterThan(0);
    });
    cy.contains("Saved").should("be.visible");

    cy.contains("button", "🗑️ Delete").click();
    cy.wait("@deleteDocument");
    cy.url().should("include", `/workspaces/${WORKSPACE_ONE_ID}/documents`);
    cy.contains("No documents in this workspace yet").should("be.visible");
  });

  it("deletes a recent document from the workspace home page", () => {
    stubWorkspaceAndDocumentApi({
      initialWorkspaces: [createWorkspace(WORKSPACE_ONE_ID, "Product Design Sprint")],
      initialDocumentsByWorkspace: {
        [WORKSPACE_ONE_ID]: [
          createDocument("doc-1", WORKSPACE_ONE_ID, "Kickoff Notes"),
          createDocument("doc-2", WORKSPACE_ONE_ID, "Sprint Plan"),
        ],
      },
    });

    seedSession();
    cy.visit(`/workspaces/${WORKSPACE_ONE_ID}/home`);
    cy.wait("@getWorkspaces");
    cy.wait("@getWorkspaceById");
    cy.wait("@getWorkspaceDocuments");

    cy.contains("Kickoff Notes").should("be.visible");
    cy.get('button[aria-label="Delete Kickoff Notes"]').click();
    cy.wait("@deleteDocument");
    cy.contains("Kickoff Notes").should("not.exist");
    cy.contains("Sprint Plan").should("be.visible");
  });
});
