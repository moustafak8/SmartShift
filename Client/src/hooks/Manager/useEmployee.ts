import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../../api/axios";
import type { EmployeesResponse } from "../types/teamOverview";

const fetchEmployees = async (
    departmentId: number
): Promise<EmployeesResponse> => {
    const response = await api.get<EmployeesResponse>(
        `employees/${departmentId}`
    );
    return response.data;
};

export const useEmployees = () => {
    const { departmentId } = useAuth();

    const query = useQuery({
        queryKey: ["employees", departmentId],
        queryFn: () => fetchEmployees(departmentId!),
        enabled: !!departmentId,
        retry: 1,
        refetchOnWindowFocus: false,
    });

    return {
        employees: query.data?.payload?.employees || [],
        departmentName: query.data?.payload?.department_name,
        isLoading: query.isLoading,
        isError: query.isError,
        isSuccess: query.isSuccess,
        error: query.error,
        refetch: query.refetch,
    };
};
