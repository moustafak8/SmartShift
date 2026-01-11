import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import type { PreferenceResponse, StorePreferencePayload } from "../types/prefrence";

const fetchEmployeePreferences = async (employeeId: number): Promise<PreferenceResponse> => {
    const response = await api.get<PreferenceResponse>(`employees/${employeeId}/preferences`);
    return response.data;
};

const storeEmployeePreferences = async (data: StorePreferencePayload): Promise<PreferenceResponse> => {
    const response = await api.post<PreferenceResponse>("employee-preferences", data);
    return response.data;
};

export const useEmployeePreferences = (employeeId: number | undefined) => {
    return useQuery({
        queryKey: ["employeePreferences", employeeId],
        queryFn: () => fetchEmployeePreferences(employeeId!),
        enabled: !!employeeId,
        retry: false,
    });
};

export const useStoreEmployeePreferences = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: storeEmployeePreferences,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["employeePreferences", data.payload.employee_id] });
        },
    });
};
