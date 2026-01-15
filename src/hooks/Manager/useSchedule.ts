import { useMutation } from "@tanstack/react-query";
import api from "../../api/axios";
import type {
  GenerateScheduleRequest,
  GenerateScheduleApiResponse,
  SaveReviewedScheduleRequest,
  SaveReviewedScheduleApiResponse,
} from "../types/schedule";

const generateSchedule = async (
  data: GenerateScheduleRequest
): Promise<GenerateScheduleApiResponse> => {
  const response = await api.post<GenerateScheduleApiResponse>(
    "schedules/generate",
    data
  );
  return response.data;
};

const saveReviewedSchedule = async (
  data: SaveReviewedScheduleRequest
): Promise<SaveReviewedScheduleApiResponse> => {
  const response = await api.post<SaveReviewedScheduleApiResponse>(
    "schedules/save-reviewed",
    data
  );
  return response.data;
};

export const useGenerateSchedule = () => {
  return useMutation({
    mutationFn: generateSchedule,
  });
};

export const useSaveReviewedSchedule = () => {
  return useMutation({
    mutationFn: saveReviewedSchedule,
  });
};
