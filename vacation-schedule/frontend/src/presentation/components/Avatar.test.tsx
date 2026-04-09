import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Avatar from "./Avatar";

describe("Avatar", () => {
  it("renders initials", () => {
    render(<Avatar initials="AL" />);
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("applies medium size by default", () => {
    render(<Avatar initials="AL" />);
    expect(screen.getByText("AL").className).toContain("w-10 h-10");
  });

  it("applies small size", () => {
    render(<Avatar initials="BC" size="sm" />);
    expect(screen.getByText("BC").className).toContain("w-7 h-7");
  });

  it("applies large size", () => {
    render(<Avatar initials="MA" size="lg" />);
    expect(screen.getByText("MA").className).toContain("w-12 h-12");
  });

  it("assigns a deterministic color based on first character", () => {
    const { rerender } = render(<Avatar initials="AL" />);
    const colorFirst = screen.getByText("AL").className;
    rerender(<Avatar initials="AL" />);
    expect(screen.getByText("AL").className).toBe(colorFirst);
  });
});
