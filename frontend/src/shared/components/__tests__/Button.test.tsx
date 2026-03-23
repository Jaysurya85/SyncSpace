import { render, screen } from "@testing-library/react";
import Button from "../Button";

describe("Button", () => {
  it("renders button text and clickability", () => {
    render(<Button>Save Changes</Button>);

    expect(
      screen.getByRole("button", { name: "Save Changes" })
    ).toBeInTheDocument();
  });

  it("shows loading state and disables the button", () => {
    render(<Button loading>Submit</Button>);

    const button = screen.getByRole("button", { name: "Loading..." });
    expect(button).toBeDisabled();
  });
});
