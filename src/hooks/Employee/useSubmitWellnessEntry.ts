import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../../api/axios";
import type { SubmitWellnessEntryRequest, SubmitWellnessEntryResponse } from "../types/wellness";

const submitWellnessEntry = async (data: SubmitWellnessEntryRequest): Promise<SubmitWellnessEntryResponse> => {
    const response = await api.post<SubmitWellnessEntryResponse>("wellness-entries", data);
    return response.data;
};

export const useSubmitWellnessEntry = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: submitWellnessEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wellnessEntries", user?.id] });
        },
    });

    const submit = (entryText: string) => {
        if (!user?.id) {
            throw new Error("User not authenticated");
        }
        return mutation.mutate({
            employee_id: user.id,
            entry_text: entryText,
        });
    };

    const submitAsync = async (entryText: string) => {
        if (!user?.id) {
            throw new Error("User not authenticated");
        }
        return mutation.mutateAsync({
            employee_id: user.id,
            entry_text: entryText,
        });
    };

    return {
        submit,
        submitAsync,
        isLoading: mutation.isPending,
        isError: mutation.isError,
        isSuccess: mutation.isSuccess,
        error: mutation.error,
    };
};
