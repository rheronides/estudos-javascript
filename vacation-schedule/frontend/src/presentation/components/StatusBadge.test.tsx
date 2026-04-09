import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it('renders "Aprovado" for approved status', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
  });

  it('renders "Recusado" for rejected status', () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText("Recusado")).toBeInTheDocument();
  });

  it('renders "Pendente" for pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("applies green color class for approved", () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText("Aprovado").className).toContain("text-green-600");
  });

  it("applies red color class for rejected", () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText("Recusado").className).toContain("text-red-500");
  });

  it("applies gray color class for pending", () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("Pendente").className).toContain("text-gray-400");
  });
});
