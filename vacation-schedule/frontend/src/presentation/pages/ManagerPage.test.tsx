import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server, mockManager, mockRequest } from "../../test/server";
import ManagerPage from "./ManagerPage";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ManagerPage employee={mockManager} onSwitch={() => {}} />
    </QueryClientProvider>
  );
}

describe("ManagerPage — approvals view", () => {
  it("renders the main heading", async () => {
    renderPage();
    expect(await screen.findByText(/solicitações de/i)).toBeInTheDocument();
  });

  it("shows the pending request row", async () => {
    renderPage();
    expect(await screen.findByText("Ana Lima")).toBeInTheDocument();
  });

  it("shows pending count", async () => {
    renderPage();
    expect(await screen.findByText(/01 solicitações pendentes/i)).toBeInTheDocument();
  });

  it("renders approve and reject buttons per row", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: /aprovar/i })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /recusar/i })).toBeInTheDocument();
  });

  it("selects row when checkbox is checked", async () => {
    const user = userEvent.setup();
    renderPage();
    const checkbox = await screen.findByRole("checkbox", { name: "" });
    // There are 2 checkboxes: select-all + row. Get the row one (last).
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[checkboxes.length - 1]);
    expect(await screen.findByText(/1 solicitação selecionada/i)).toBeInTheDocument();
  });

  it("shows bulk approve button when items selected", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("Ana Lima"));
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[checkboxes.length - 1]);
    expect(screen.getByRole("button", { name: /aprovar selecionadas/i })).toBeInTheDocument();
  });

  it("approves a request via individual button and calls API", async () => {
    let approveCalled = false;
    server.use(
      http.patch("/api/vacations/:id/approve", () => {
        approveCalled = true;
        return HttpResponse.json({ ...mockRequest, status: "approved" });
      })
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("Ana Lima"));
    await user.click(screen.getByRole("button", { name: /^aprovar$/i }));
    await waitFor(() => expect(approveCalled).toBe(true));
  });

  it("selects all when select-all checkbox clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText("Ana Lima"));
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]); // select-all
    expect(screen.getByText(/1 solicitação selecionada/i)).toBeInTheDocument();
  });
});
