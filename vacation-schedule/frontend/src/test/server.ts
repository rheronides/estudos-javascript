/**
 * MSW mock server for API calls in tests.
 * Each test suite can extend these defaults by adding handlers.
 */
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import type { Employee, VacationRequest, VacationBalance } from "../types";

export const mockManager: Employee = {
  id: 1, name: "Marcos Andrade", role: "Gerente", department: "Eng",
  is_manager: true, manager_id: null, avatar_initials: "MA",
};

export const mockEmployee: Employee = {
  id: 2, name: "Ana Lima", role: "Designer", department: "Design",
  is_manager: false, manager_id: 1, avatar_initials: "AL",
};

export const mockBalance: VacationBalance = {
  year: 2024, total_days: 30, used_days: 0, remaining_days: 30, periods_used: 0,
};

export const mockRequest: VacationRequest = {
  id: 1, employee_id: 2, employee: mockEmployee, status: "pending",
  advance_13th_salary: false, created_at: "2024-04-01T00:00:00",
  decided_at: null, decided_by_id: null, year: 2024,
  periods: [{ id: 1, start_date: "2024-07-01", days_count: 14 }],
  total_days: 14,
};

export const handlers = [
  http.get("/api/employees/", () => HttpResponse.json([mockManager, mockEmployee])),
  http.get("/api/employees/:id", ({ params }) =>
    params.id === "9999"
      ? HttpResponse.json({ detail: "Not found" }, { status: 404 })
      : HttpResponse.json(mockEmployee)
  ),
  http.get("/api/employees/:id/balance", () => HttpResponse.json(mockBalance)),
  http.get("/api/employees/:id/team", () => HttpResponse.json([mockEmployee])),
  http.get("/api/vacations/employee/:id", () => HttpResponse.json([mockRequest])),
  http.get("/api/vacations/pending", () => HttpResponse.json([mockRequest])),
  http.get("/api/vacations/decisions", () => HttpResponse.json([])),
  http.post("/api/vacations/", () => HttpResponse.json({ ...mockRequest, id: 2 })),
  http.patch("/api/vacations/:id/approve", () =>
    HttpResponse.json({ ...mockRequest, status: "approved" })
  ),
  http.patch("/api/vacations/:id/reject", () =>
    HttpResponse.json({ ...mockRequest, status: "rejected" })
  ),
];

export const server = setupServer(...handlers);
