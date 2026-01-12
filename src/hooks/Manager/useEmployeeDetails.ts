import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import type { EmployeeDetailsResponse } from "../types/employeeDetails";

const fetchEmployeeDetails = async (employeeId: number): Promise<EmployeeDetailsResponse> => {
    const response = await api.get<EmployeeDetailsResponse>(`employee/${employeeId}/shifts`);
    return response.data;
};

export const useEmployeeDetails = (employeeId: number | null) => {
    const query = useQuery({
        queryKey: ["employeeDetails", employeeId],
        queryFn: () => fetchEmployeeDetails(employeeId!),
        enabled: !!employeeId,
        retry: 1,
        refetchOnWindowFocus: false,
    });

    return {
        employeeDetails: query.data?.payload || null,
        isLoading: query.isLoading,
        isError: query.isError,
        isSuccess: query.isSuccess,
        error: query.error,
        refetch: query.refetch,
    };
};
