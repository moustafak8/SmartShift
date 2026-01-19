import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type {
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
  MarkReadResponse,
  MarkAllReadResponse,
} from "./types/notification";

const fetchNotifications = async (
  userId: number,
  unreadOnly: boolean = false
): Promise<Notification[]> => {
  const params = unreadOnly ? "?unread_only=true" : "";
  const response = await api.get<NotificationsResponse>(
    `notifications/${userId}${params}`
  );
  return response.data.payload;
};

const fetchUnreadCount = async (userId: number): Promise<number> => {
  const response = await api.get<UnreadCountResponse>(
    `notifications/${userId}/unread-count`
  );
  return response.data.payload.count;
};

const markAsRead = async (
  userId: number,
  notificationId: number
): Promise<Notification | null> => {
  const response = await api.post<MarkReadResponse>(
    `notifications/${userId}/${notificationId}/read`
  );
  return response.data.payload;
};

const markAllAsRead = async (userId: number): Promise<number> => {
  const response = await api.post<MarkAllReadResponse>(
    `notifications/${userId}/read-all`
  );
  return response.data.payload.marked_count;
};

const deleteNotification = async (
  userId: number,
  notificationId: number
): Promise<void> => {
  await api.delete(`notifications/${userId}/${notificationId}`);
};

export const useNotifications = (userId: number | undefined, unreadOnly: boolean = false) => {
  const query = useQuery({
    queryKey: ["notifications", userId, unreadOnly],
    queryFn: () => fetchNotifications(userId!, unreadOnly),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    notifications: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useUnreadCount = (userId: number | undefined) => {
  const query = useQuery({
    queryKey: ["notificationsUnreadCount", userId],
    queryFn: () => fetchUnreadCount(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  return {
    count: query.data || 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, notificationId }: { userId: number; notificationId: number }) =>
      markAsRead(userId, notificationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount", variables.userId] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => markAllAsRead(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount", userId] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, notificationId }: { userId: number; notificationId: number }) =>
      deleteNotification(userId, notificationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount", variables.userId] });
    },
  });
};
