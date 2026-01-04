import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./context/AuthContext";
import api from "../api/axios";

type LoginCredentials = {
  email: string;
  password: string;
};

type LoginResponse = {
  status: string;
  payload: {
    token: string;
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

const loginRequest = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("login", credentials);
  return response.data;
};

export const useLogin = () => {
  const { loginAction } = useAuth();

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      if (data.status === "success" && data.payload) {
        loginAction(data.payload);
      }
    },
  });

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error?.message || null,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};

