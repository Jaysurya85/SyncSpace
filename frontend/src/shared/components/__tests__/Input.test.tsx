import { render, screen } from "@testing-library/react";
import Input from "../Input";

describe("Input", () => {
  it("connects the label to the input", () => {
    render(<Input label="Email" type="email" />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
  });

  it("renders an error message when provided", () => {
    render(<Input label="Password" error="Password is required" />);

    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });
});
