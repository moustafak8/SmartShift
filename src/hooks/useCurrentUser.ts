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
  };
};

const fetchCurrentUser = async (): Promise<CurrentUserResponse> => {
  const response = await api.get<CurrentUserResponse>("me");
  return response.data;
};

export const useCurrentUser = () => {
  const { setUser, setIsLoading } = useAuth();

  const query = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.isSuccess && query.data?.payload?.user) {
      setUser(query.data.payload.user);
      setIsLoading(false);
    } else if (query.isError) {
      setUser(null);
      setIsLoading(false);
    }
  }, [query.isSuccess, query.isError, query.data, setUser, setIsLoading]);

  return {
    user: query.data?.payload?.user || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};
