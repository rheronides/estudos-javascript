import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server, mockEmployee } from "../../test/server";
import EmployeePage from "./EmployeePage";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <EmployeePage employee={mockEmployee} onSwitch={() => {}} />
    </QueryClientProvider>
  );
}

describe("EmployeePage — request view", () => {
  it("renders the main heading", async () => {
    renderPage();
    expect(await screen.findByText(/Planeje seu próximo/i)).toBeInTheDocument();
  });

  it("displays the remaining days balance", async () => {
    renderPage();
    expect(await screen.findByText("30")).toBeInTheDocument();
    expect(await screen.findByText(/dias restantes/i)).toBeInTheDocument();
  });

  it("shows the request form with period label", async () => {
    renderPage();
    expect(await screen.findByText(/período 1 de 3/i)).toBeInTheDocument();
  });

  it("shows validation error when submitting empty form", async () => {
    renderPage();
    const button = await screen.findByRole("button", { name: /enviar solicitação/i });
    expect(button).toBeDisabled();
  });

  it("shows CLT error when period is less than 14 days", async () => {
    const user = userEvent.setup();
    renderPage();

    // fireEvent.change is more reliable than user.type for date inputs in jsdom
    const dateInput = document.querySelector("input[type='date']") as HTMLElement;
    fireEvent.change(dateInput, { target: { value: "2024-07-01" } });
    fireEvent.change(screen.getByPlaceholderText("0"), { target: { value: "5" } });

    const button = await screen.findByRole("button", { name: /enviar/i });
    await user.click(button);

    // The error banner shows the CLT message; the hint at the bottom also matches,
    // so we look for the first element with the error role/class.
    const errors = await screen.findAllByText(/mínimo 14 dias/i);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]).toHaveClass("text-red-600");
  });
});

describe("EmployeePage — navigation", () => {
  it("switches to history view", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: /histórico/i }));
    expect(await screen.findByRole("heading", { name: /suas solicitações/i })).toBeInTheDocument();
  });

  it("switches to team view", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: /equipe/i }));
    expect(await screen.findByRole("heading", { name: /meu time/i })).toBeInTheDocument();
  });

  it("calls onSwitch when Sair is clicked", async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <EmployeePage employee={mockEmployee} onSwitch={onSwitch} />
      </QueryClientProvider>
    );
    await user.click(await screen.findByText("Sair"));
    expect(onSwitch).toHaveBeenCalledOnce();
  });
});
