describe("authenticated layout", () => {
  it("restores a stored session and navigates through the sidebar", () => {
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

    cy.contains("Welcome back, Cypress User").should("be.visible");
    cy.get('aside a[href="/documents"]').click();
    cy.contains("Shared documents").should("be.visible");
    cy.url().should("include", "/documents");
  });
});
