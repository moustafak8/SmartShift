import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../../api/axios";
import type { ShiftTemplatesResponse, ShiftFormData, ShiftsResponse, ShiftAssignmentsResponse } from "../types/shifts";

const fetchShiftTemplates = async (): Promise<ShiftTemplatesResponse> => {
  const response = await api.get<ShiftTemplatesResponse>("shift-templates");
  return response.data;
};

const fetchShifts = async (departmentId: number): Promise<ShiftsResponse> => {
  const response = await api.get<ShiftsResponse>(`shifts/${departmentId}`);
  return response.data;
};

const fetchShiftAssignments = async (startDate: string, departmentId: number): Promise<ShiftAssignmentsResponse> => {
  const response = await api.get<ShiftAssignmentsResponse>(
    `shift-assignments/week?start_date=${startDate}&department_id=${departmentId}`
  );
  return response.data;
};

const createShift = async (data: ShiftFormData): Promise<any> => {
  const response = await api.post("shifts", data);
  return response.data;
};

export const useShiftTemplates = () => {
  const query = useQuery({
    queryKey: ["shift-templates"],
    queryFn: fetchShiftTemplates,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    shiftTemplates: query.data?.payload || [],
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useShifts = (departmentId: number) => {
  const query = useQuery({
    queryKey: ["shifts", departmentId],
    queryFn: () => fetchShifts(departmentId),
    enabled: !!departmentId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    shifts: query.data?.payload || [],
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCreateShift = () => {
  return useMutation({
    mutationFn: createShift,
  });
};

export const useShiftAssignments = (startDate: string, departmentId: number) => {
  const query = useQuery({
    queryKey: ["shift-assignments", startDate, departmentId],
    queryFn: () => fetchShiftAssignments(startDate, departmentId),
    enabled: !!startDate && !!departmentId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    assignments: query.data?.payload || null,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  };
};
