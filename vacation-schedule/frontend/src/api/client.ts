/**
 * Infrastructure layer: HTTP adapter for the Vacation Intelligence API.
 * All API calls are isolated here — application hooks depend on this module.
 */
import axios from "axios";
import type {
  CreateRequestPayload,
  Employee,
  VacationBalance,
  VacationRequest,
} from "../types";

const http = axios.create({ baseURL: "/api" });

export const employeeApi = {
  getAll: () => http.get<Employee[]>("/employees/").then((r) => r.data),
  getById: (id: number) => http.get<Employee>(`/employees/${id}`).then((r) => r.data),
  getBalance: (id: number, year: number) =>
    http.get<VacationBalance>(`/employees/${id}/balance`, { params: { year } }).then((r) => r.data),
  getTeam: (id: number) => http.get<Employee[]>(`/employees/${id}/team`).then((r) => r.data),
};

export const vacationApi = {
  createRequest: (payload: CreateRequestPayload) =>
    http.post<VacationRequest>("/vacations/", payload).then((r) => r.data),
  getForEmployee: (employeeId: number, year?: number) =>
    http
      .get<VacationRequest[]>(`/vacations/employee/${employeeId}`, { params: year ? { year } : {} })
      .then((r) => r.data),
  getPendingForManager: (managerId: number) =>
    http.get<VacationRequest[]>("/vacations/pending", { params: { manager_id: managerId } }).then((r) => r.data),
  getDecisionsForManager: (managerId: number) =>
    http.get<VacationRequest[]>("/vacations/decisions", { params: { manager_id: managerId } }).then((r) => r.data),
  approve: (requestId: number, managerId: number) =>
    http.patch<VacationRequest>(`/vacations/${requestId}/approve`, { manager_id: managerId }).then((r) => r.data),
  reject: (requestId: number, managerId: number) =>
    http.patch<VacationRequest>(`/vacations/${requestId}/reject`, { manager_id: managerId }).then((r) => r.data),
};
