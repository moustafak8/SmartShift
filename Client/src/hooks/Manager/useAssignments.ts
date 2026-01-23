import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import type { CreateAssignmentRequest, UpdateAssignmentRequest, AvailableEmployeesResponse } from "../../hooks/types/schedule";
const createAssignment = async (data: CreateAssignmentRequest): Promise<any> => {
  const response = await api.post("shift-assignments", data);
  return response.data;
};

const deleteAssignment = async (assignmentId: number): Promise<any> => {
  const response = await api.delete(`shift-assignments/${assignmentId}`);
  return response.data;
};

const updateAssignment = async (
  assignmentId: number,
  data: UpdateAssignmentRequest
): Promise<any> => {
  const response = await api.put(`shift-assignments/${assignmentId}`, data);
  return response.data;
};

const fetchAvailableEmployees = async (
  departmentId: number,
  date: string
): Promise<AvailableEmployeesResponse> => {
  const response = await api.get<AvailableEmployeesResponse>(
    `departments/${departmentId}/available-employees?date=${date}`
  );
  return response.data;
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["available-employees"] });
      queryClient.invalidateQueries({ queryKey: ["shift-assignments"] });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["available-employees"] });
      queryClient.invalidateQueries({ queryKey: ["shift-assignments"] });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: number; data: UpdateAssignmentRequest }) =>
      updateAssignment(assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["available-employees"] });
      queryClient.invalidateQueries({ queryKey: ["shift-assignments"] });
    },
  });
};

export const useAvailableEmployees = (departmentId: number, date: string) => {
  const query = useQuery({
    queryKey: ["available-employees", departmentId, date],
    queryFn: () => fetchAvailableEmployees(departmentId, date),
    enabled: !!departmentId && !!date,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    employees: query.data?.payload?.map((item) => ({
      id: item.employee_id,
      employee_id: item.employee_id,
      full_name: item.employee_name,
      position_id: item.position_id,
      position_name: item.position_name,
      is_available: item.is_available,
      preferred_shift_type: item.preferred_shift_type,
    })) || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};
