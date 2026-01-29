import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./context/AuthContext";
import api from "../api/axios";
import { useEffect } from "react";

type CurrentUserResponse = {
  status: string;
  payload: {
    user: {
      id: number;
      user_type_id: number;
      full_name: string;
      email: string;
      password: string;
      phone: string | null;
      is_active: number;
      created_at: string;
      updated_at: string;
    };
    department_id?: number;
  };
};

const fetchCurrentUser = async (): Promise<CurrentUserResponse> => {
  const response = await api.get<CurrentUserResponse>("me");
  return response.data;
};

export const useCurrentUser = (enabled: boolean = true) => {
  const { setUser, setDepartmentId, setIsLoading } = useAuth();

  const query = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    enabled,
  });

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    if (query.isLoading) {
      setIsLoading(true);
    }

    if (query.isSuccess && query.data?.payload?.user) {
      setUser(query.data.payload.user);
      setDepartmentId(query.data.payload.department_id ?? null);
      setIsLoading(false);
    } else if (query.isError) {
      setUser(null);
      setDepartmentId(null);
      setIsLoading(false);
    }
  }, [
    query.isSuccess,
    query.isError,
    query.isLoading,
    query.data,
    setUser,
    setDepartmentId,
    setIsLoading,
    enabled,
  ]);

  return {
    user: query.data?.payload?.user || null,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
  };
};
