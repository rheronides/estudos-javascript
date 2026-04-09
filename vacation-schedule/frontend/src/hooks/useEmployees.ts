import { useQuery } from "@tanstack/react-query";
import { employeeApi } from "../api/client";

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: employeeApi.getAll,
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => employeeApi.getById(id),
    enabled: id > 0,
  });
}

export function useBalance(employeeId: number, year: number) {
  return useQuery({
    queryKey: ["balance", employeeId, year],
    queryFn: () => employeeApi.getBalance(employeeId, year),
    enabled: employeeId > 0,
  });
}

export function useTeam(employeeId: number) {
  return useQuery({
    queryKey: ["team", employeeId],
    queryFn: () => employeeApi.getTeam(employeeId),
    enabled: employeeId > 0,
  });
}
