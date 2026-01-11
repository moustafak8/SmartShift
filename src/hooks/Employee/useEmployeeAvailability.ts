import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import type { AvailabilityResponse, StoreAvailabilityPayload } from "../types/availability";

const fetchEmployeeAvailability = async (employeeId: number): Promise<AvailabilityResponse> => {
    const response = await api.get<AvailabilityResponse>(`employees/${employeeId}/availability`);
    return response.data;
};

const storeEmployeeAvailability = async (data: StoreAvailabilityPayload): Promise<AvailabilityResponse> => {
    const response = await api.post<AvailabilityResponse>("employee-availability", data);
    return response.data;
};

const deleteEmployeeAvailability = async (id: number): Promise<void> => {
    await api.delete(`employee-availability/${id}`);
};

export const useEmployeeAvailability = (employeeId: number | undefined) => {
    return useQuery({
        queryKey: ["employeeAvailability", employeeId],
        queryFn: () => fetchEmployeeAvailability(employeeId!),
        enabled: !!employeeId,
        retry: false,
    });
};

export const useStoreEmployeeAvailability = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: storeEmployeeAvailability,
        onSuccess: () => {
            // Invalidate all availability queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ["employeeAvailability"] });
        },
    });
};

export const useDeleteEmployeeAvailability = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteEmployeeAvailability,
        onSuccess: () => {
            // Invalidate all availability queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ["employeeAvailability"] });
        },
    });
};
