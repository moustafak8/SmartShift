import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import type { 
  SwapCandidatesResponse, 
  SwapCandidate, 
  CreateSwapRequest, 
  CreateSwapResponse 
} from "../types/shiftSwap";

const fetchSwapCandidates = async (shiftId: number): Promise<SwapCandidate[]> => {
  const response = await api.get<SwapCandidatesResponse>(
    `shifts/${shiftId}/swap-candidates`
  );
  return response.data.payload;
};

export const useSwapCandidates = (shiftId: number | null) => {
  const query = useQuery({
    queryKey: ["swapCandidates", shiftId],
    queryFn: () => fetchSwapCandidates(shiftId!),
    enabled: !!shiftId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    candidates: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

const createSwapRequest = async (data: CreateSwapRequest): Promise<CreateSwapResponse> => {
  const response = await api.post<CreateSwapResponse>("shift-swaps", data);
  return response.data;
};

export const useCreateSwap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSwapRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduleAssignments"] });
    },
  });
};

export type { SwapCandidate, CreateSwapRequest } from "../types/shiftSwap";
