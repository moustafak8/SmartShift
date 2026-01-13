import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../../api/axios";
import type { ShiftTemplatesResponse, ShiftFormData } from "../types/shifts";

const fetchShiftTemplates = async (): Promise<ShiftTemplatesResponse> => {
  const response = await api.get<ShiftTemplatesResponse>("shift-templates");
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

export const useCreateShift = () => {
  return useMutation({
    mutationFn: createShift,
  });
};
