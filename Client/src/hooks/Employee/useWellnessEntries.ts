import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../../api/axios";
import type { WellnessEntry, WellnessEntriesResponse } from "../types/wellness";

const fetchWellnessEntries = async (employeeId: number): Promise<WellnessEntriesResponse> => {
    const response = await api.get<WellnessEntriesResponse>(`employees/${employeeId}/wellness-entries`);
    return response.data;
};

export const useWellnessEntries = () => {
    const { user } = useAuth();
    const employeeId = user?.id;

    const query = useQuery({
        queryKey: ["wellnessEntries", employeeId],
        queryFn: () => fetchWellnessEntries(employeeId!),
        enabled: !!employeeId, // Only run query if employeeId exists
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

export type { WellnessEntry };
