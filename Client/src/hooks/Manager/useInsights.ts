import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import type {
  AIInsight,
  InsightsResponse,
  InsightResponse,
  UnreadCountResponse,
} from "../types/insight";

const fetchInsights = async (departmentId: number): Promise<AIInsight[]> => {
  const response = await api.get<InsightsResponse>(`insights/${departmentId}`);
  return response.data.payload;
};

const fetchInsight = async (insightId: number): Promise<AIInsight | null> => {
  const response = await api.get<InsightResponse>(`insight/${insightId}`);
  return response.data.payload;
};

const fetchUnreadCount = async (departmentId: number): Promise<number> => {
  const response = await api.get<UnreadCountResponse>(
    `insights/${departmentId}/unread-count`,
  );
  return response.data.payload.count;
};

const markInsightAsRead = async (
  insightId: number,
): Promise<AIInsight | null> => {
  const response = await api.post<InsightResponse>(
    `insights/${insightId}/read`,
  );
  return response.data.payload;
};

export const useInsights = (departmentId: number | undefined) => {
  const query = useQuery({
    queryKey: ["insights", departmentId],
    queryFn: () => fetchInsights(departmentId!),
    enabled: !!departmentId,
    refetchOnWindowFocus: true,
  });

  return {
    insights: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useInsight = (insightId: number | undefined) => {
  const query = useQuery({
    queryKey: ["insight", insightId],
    queryFn: () => fetchInsight(insightId!),
    enabled: !!insightId,
    refetchOnWindowFocus: false,
  });

  return {
    insight: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};

export const useInsightUnreadCount = (departmentId: number | undefined) => {
  const query = useQuery({
    queryKey: ["insightsUnreadCount", departmentId],
    queryFn: () => fetchUnreadCount(departmentId!),
    enabled: !!departmentId,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  return {
    count: query.data || 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

export const useMarkInsightAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (insightId: number) => markInsightAsRead(insightId),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: ["insights", data.department_id],
        });
        queryClient.invalidateQueries({
          queryKey: ["insightsUnreadCount", data.department_id],
        });
        queryClient.invalidateQueries({ queryKey: ["insight", data.id] });
      }
    },
  });
};
