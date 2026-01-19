import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import type { ManagerSwapRequest, ManagerSwapsResponse, ReviewSwapParams } from "../../hooks/types/swaprequests";

const fetchManagerSwaps = async (departmentId?: number): Promise<ManagerSwapRequest[]> => {
  const params = departmentId ? `?department_id=${departmentId}` : "";
  const response = await api.get<ManagerSwapsResponse>(`shift-swaps/awaiting-manager${params}`);
  return response.data.payload;
};

export const useManagerSwaps = (departmentId?: number) => {
  const query = useQuery({
    queryKey: ["managerSwaps", departmentId],
    queryFn: () => fetchManagerSwaps(departmentId),
    refetchOnWindowFocus: true,
  });

  return {
    swaps: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};



const reviewSwap = async ({ swapId, decision, notes }: ReviewSwapParams) => {
  const response = await api.post(`shift-swaps/${swapId}/review`, { decision, notes });
  return response.data;
};

export const useReviewSwap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewSwap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerSwaps"] });
      queryClient.invalidateQueries({ queryKey: ["pendingSwapsCount"] });
    },
  });
};


const fetchPendingCount = async (departmentId?: number): Promise<number> => {
  const params = departmentId ? `?department_id=${departmentId}` : "";
  const response = await api.get<{ status: string; payload: { count: number } }>(
    `shift-swaps/pending-count${params}`
  );
  return response.data.payload.count;
};

export const usePendingSwapsCount = (departmentId?: number) => {
  const query = useQuery({
    queryKey: ["pendingSwapsCount", departmentId],
    queryFn: () => fetchPendingCount(departmentId),
    enabled: !!departmentId,
    refetchInterval: 60000, 
  });

  return {
    count: query.data ?? 0,
    isLoading: query.isLoading,
  };
};
