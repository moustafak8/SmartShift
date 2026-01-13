import { useMutation } from "@tanstack/react-query";
import api from "../../api/axios";
import type { WellnessInsightRequest, WellnessInsightResponse } from "../types/rag";

const searchWellnessInsights = async (data: WellnessInsightRequest): Promise<WellnessInsightResponse> => {
    const response = await api.post<WellnessInsightResponse>("wellness/search/insights", data);
    return response.data;
};

export const useWellnessInsights = () => {
    return useMutation({
        mutationFn: searchWellnessInsights,
        retry: false,
    });
};
