import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../../api/axios";
import type { ScoreResponse, MonthlyScoreResponse } from "../types/score";

const fetchScoreDetails = async (employeeId: number): Promise<ScoreResponse> => {
    const response = await api.get<ScoreResponse>(`fatigue-scores/${employeeId}`);
    return response.data;
};

const fetchMonthlyScores = async (employeeId: number): Promise<MonthlyScoreResponse> => {
    const response = await api.get<MonthlyScoreResponse>(`fatigue-scores/${employeeId}/monthly`);
    return response.data;
};

export const useScoreDetails = () => {
    const { user } = useAuth();
    const employeeId = user?.id;

    const query = useQuery({
        queryKey: ["scoreDetails", employeeId],
        queryFn: () => fetchScoreDetails(employeeId!),
        enabled: !!employeeId,
        retry: 1,
        refetchOnWindowFocus: false,
    });

    return {
        scoreData: query.data?.payload || null,
        isLoading: query.isLoading,
        isError: query.isError,
        isSuccess: query.isSuccess,
        error: query.error,
        refetch: query.refetch,
    };
};

export const useMonthlyScores = () => {
    const { user } = useAuth();
    const employeeId = user?.id;

    const query = useQuery({
        queryKey: ["monthlyScores", employeeId],
        queryFn: () => fetchMonthlyScores(employeeId!),
        enabled: !!employeeId,
        retry: 1,
        refetchOnWindowFocus: false,
    });

    return {
        monthlyScores: query.data?.payload || null,
        isLoading: query.isLoading,
        isError: query.isError,
        isSuccess: query.isSuccess,
        error: query.error,
        refetch: query.refetch,
    };
};
