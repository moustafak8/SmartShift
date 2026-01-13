import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import type { ShiftTemplatesResponse } from "../types/shifts";

const fetchShiftTemplates = async (): Promise<ShiftTemplatesResponse> => {
  const response = await api.get<ShiftTemplatesResponse>("shift-templates");
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
