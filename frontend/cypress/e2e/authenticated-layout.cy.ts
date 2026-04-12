describe("authenticated layout", () => {
  it("restores a stored session and opens a workspace-scoped route", () => {
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
        window.localStorage.setItem(
          "syncspace-known-workspaces",
          JSON.stringify(["ws-product-design-sprint"])
        );
      },
    });

    cy.contains("Workspace hub").should("be.visible");
    cy.contains("Product Design Sprint").click();
    cy.url().should("include", "/workspaces/ws-product-design-sprint/home");
    cy.get('aside a[href="/workspaces/ws-product-design-sprint/documents"]').click();
    cy.url().should("include", "/workspaces/ws-product-design-sprint/documents");
  });
});
