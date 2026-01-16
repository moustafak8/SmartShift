import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import type { FlaggedWellnessEntriesResponse } from "../types/managerWellness";

const fetchFlaggedWellnessEntries = async (
  departmentId: number
): Promise<FlaggedWellnessEntriesResponse> => {
  const response = await api.get<FlaggedWellnessEntriesResponse>(
    `wellness-entries/${departmentId}`
  );
  return response.data;
};

export const useFlaggedWellnessEntries = (departmentId: number) => {
  const query = useQuery({
    queryKey: ["flaggedWellnessEntries", departmentId],
    queryFn: () => fetchFlaggedWellnessEntries(departmentId),
    enabled: !!departmentId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    entries: query.data?.payload || [],
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  };
};
