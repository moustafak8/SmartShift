import { useMutation } from "@tanstack/react-query";
import api from "../../api/axios";
import type { GenerateScheduleRequest, GenerateScheduleApiResponse } from "../types/schedule";

const generateSchedule = async (data: GenerateScheduleRequest): Promise<GenerateScheduleApiResponse> => {
  const response = await api.post<GenerateScheduleApiResponse>("schedules/generate", data);
  return response.data;
};

export const useGenerateSchedule = () => {
  return useMutation({
    mutationFn: generateSchedule,
  });
};
