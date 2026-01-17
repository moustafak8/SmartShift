import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import type { 
  SwapCandidatesResponse, 
  SwapCandidate, 
  CreateSwapRequest, 
  CreateSwapResponse 
} from "../types/shiftSwap";

export interface SwappableShift {
  shift_id: number;
  shift_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
}

interface SwappableShiftsResponse {
  status: string;
  message: string;
  payload: SwappableShift[];
}

const fetchSwappableShifts = async (shiftId: number): Promise<SwappableShift[]> => {
  const response = await api.get<SwappableShiftsResponse>(
    `shifts/${shiftId}/swappable-shifts`
  );
  return response.data.payload;
};

export const useSwappableShifts = (requesterShiftId: number | null) => {
  const query = useQuery({
    queryKey: ["swappableShifts", requesterShiftId],
    queryFn: () => fetchSwappableShifts(requesterShiftId!),
    enabled: !!requesterShiftId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    shifts: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

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

export interface IncomingSwap {
  id: number;
  requester_id: number;
  requester_shift_id: number;
  target_employee_id: number;
  target_shift_id: number;
  status: string;
  swap_reason?: string;
  created_at: string;
  requester?: {
    id: number;
    full_name: string;
  };
  requester_shift?: {
    id: number;
    shift_date: string;
    shift_type: string;
  };
  target_shift?: {
    id: number;
    shift_date: string;
    shift_type: string;
  };
}

interface IncomingSwapsResponse {
  status: string;
  message: string;
  payload: IncomingSwap[];
}

const fetchIncomingSwaps = async (): Promise<IncomingSwap[]> => {
  const response = await api.get<IncomingSwapsResponse>("shift-swaps/incoming");
  return response.data.payload;
};

export const useIncomingSwaps = () => {
  const query = useQuery({
    queryKey: ["incomingSwaps"],
    queryFn: fetchIncomingSwaps,
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

interface RespondToSwapParams {
  swapId: number;
  response: "accept" | "decline";
}

const respondToSwap = async ({ swapId, response }: RespondToSwapParams) => {
  const res = await api.post(`shift-swaps/${swapId}/respond`, { response });
  return res.data;
};

export const useRespondToSwap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: respondToSwap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomingSwaps"] });
      queryClient.invalidateQueries({ queryKey: ["scheduleAssignments"] });
    },
  });
};

export type { SwapCandidate, CreateSwapRequest } from "../types/shiftSwap";

