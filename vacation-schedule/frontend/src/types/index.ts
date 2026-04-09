export interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  is_manager: boolean;
  manager_id: number | null;
  avatar_initials: string;
}

export interface VacationPeriod {
  id: number;
  start_date: string;
  days_count: number;
}

export type RequestStatus = "pending" | "approved" | "rejected";

export interface VacationRequest {
  id: number;
  employee_id: number;
  employee: Employee;
  status: RequestStatus;
  advance_13th_salary: boolean;
  created_at: string;
  decided_at: string | null;
  decided_by_id: number | null;
  year: number;
  periods: VacationPeriod[];
  total_days: number;
}

export interface VacationBalance {
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  periods_used: number;
}

export interface PeriodFormData {
  start_date: string;
  days_count: number;
}

export interface CreateRequestPayload {
  employee_id: number;
  advance_13th_salary: boolean;
  year: number;
  periods: PeriodFormData[];
}
