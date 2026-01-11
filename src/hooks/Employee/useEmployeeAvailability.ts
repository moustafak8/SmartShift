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
        onSuccess: (data) => {
            // Invalidate the availability query for the employee
            if (data.payload && data.payload.length > 0) {
                queryClient.invalidateQueries({ queryKey: ["employeeAvailability", data.payload[0].employee_id] });
            }
        },
    });
};
