import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import type { AddEmployeeFormData } from "../types/teamOverview";

interface AddEmployeeResponse {
    status: string;
    payload: {
        message: string;
        user: {
            id: number;
            full_name: string;
            email: string;
            user_type_id: number;
            is_active: number;
            created_at: string;
            updated_at: string;
        };
    };
}

const addEmployee = async (data: AddEmployeeFormData): Promise<AddEmployeeResponse> => {
    const response = await api.post<AddEmployeeResponse>("register", data);
    return response.data;
};

export const useAddEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addEmployee,
        retry: false,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
    });
};
