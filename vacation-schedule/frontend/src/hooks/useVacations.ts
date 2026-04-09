import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vacationApi } from "../api/client";
import type { CreateRequestPayload } from "../types";

export function useEmployeeRequests(employeeId: number, year?: number) {
  return useQuery({
    queryKey: ["requests", employeeId, year],
    queryFn: () => vacationApi.getForEmployee(employeeId, year),
    enabled: employeeId > 0,
  });
}

export function useCreateRequest(employeeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRequestPayload) => vacationApi.createRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests", employeeId] });
      qc.invalidateQueries({ queryKey: ["balance", employeeId] });
    },
  });
}

export function usePendingRequests(managerId: number) {
  return useQuery({
    queryKey: ["pending", managerId],
    queryFn: () => vacationApi.getPendingForManager(managerId),
    enabled: managerId > 0,
  });
}

export function useDecisionHistory(managerId: number) {
  return useQuery({
    queryKey: ["decisions", managerId],
    queryFn: () => vacationApi.getDecisionsForManager(managerId),
    enabled: managerId > 0,
  });
}

export function useApproveRequest(managerId: number) {
  const qc = useQueryClient();
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["pending", managerId] });
    qc.invalidateQueries({ queryKey: ["decisions", managerId] });
  };

  const approve = useMutation({
    mutationFn: (requestId: number) => vacationApi.approve(requestId, managerId),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: (requestId: number) => vacationApi.reject(requestId, managerId),
    onSuccess: invalidate,
  });

  const bulkApprove = async (ids: number[]) => {
    setIsBulkLoading(true);
    try {
      await Promise.all(ids.map((id) => vacationApi.approve(id, managerId)));
    } finally {
      setIsBulkLoading(false);
      invalidate();
    }
  };

  const bulkReject = async (ids: number[]) => {
    setIsBulkLoading(true);
    try {
      await Promise.all(ids.map((id) => vacationApi.reject(id, managerId)));
    } finally {
      setIsBulkLoading(false);
      invalidate();
    }
  };

  return { approve, reject, bulkApprove, bulkReject, isBulkLoading };
}
