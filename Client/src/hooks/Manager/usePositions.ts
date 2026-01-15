import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../../api/axios";
import type { PositionsResponse } from "../types/teamOverview";

const fetchPositions = async (
    departmentId: number
): Promise<PositionsResponse> => {
    const response = await api.get<PositionsResponse>(
        `departments/${departmentId}/positions`
    );
    return response.data;
};

export const usePositions = () => {
    const { departmentId } = useAuth();

    const query = useQuery({
        queryKey: ["positions", departmentId],
        queryFn: () => fetchPositions(departmentId!),
        enabled: !!departmentId,
        retry: 1,
        refetchOnWindowFocus: false,
    });

    return {
        positions: query.data?.payload || [],
        isLoading: query.isLoading,
        isError: query.isError,
        isSuccess: query.isSuccess,
        error: query.error,
        refetch: query.refetch,
    };
};
