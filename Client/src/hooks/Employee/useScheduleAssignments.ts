import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../../api/axios";
import type { ScheduleAssignmentsResponse } from "../types/scheduleAssignments";

const fetchScheduleAssignments = async (
  employeeId: number,
  startDate: string
): Promise<ScheduleAssignmentsResponse> => {
  const response = await api.get<ScheduleAssignmentsResponse>(
    `employees/${employeeId}/shift-assignments/week?start_date=${startDate}`
  );
  return response.data;
};

export const useScheduleAssignments = (startDate: string) => {
  const { user } = useAuth();
  const employeeId = user?.id;

  const query = useQuery({
    queryKey: ["scheduleAssignments", employeeId, startDate],
    queryFn: () => fetchScheduleAssignments(employeeId!, startDate),
    enabled: !!employeeId && !!startDate,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    weekAssignments: query.data?.payload || null,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  };
};

export type { ShiftAssignment, WeekAssignments } from "../types/scheduleAssignments";
