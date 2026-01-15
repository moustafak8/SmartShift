import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

type LoginCredentials = {
  email: string;
  password: string;
};

type LoginResponse = {
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

const loginRequest = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("login", credentials);
  return response.data;
};

export const useLogin = () => {
  const { loginAction } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      if (data.status === "success" && data.payload?.user) {
        loginAction({
          user: data.payload.user,
          department_id: data.payload.department_id,
        });
        // Navigate based on user role
        const userTypeId = data.payload.user.user_type_id;
        if (userTypeId === 1) {
          navigate("/manager/dashboard");
        } else if (userTypeId === 2) {
          navigate("/employee/dashboard");
        }
      }
    },
  });

  const getErrorMessage = (error: any): string | null => {
    // Handle axios errors
    if (error?.response?.data?.payload) {
      return error.response.data.payload;
    }
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.status === 401) {
      return "Invalid email or password";
    }
    return error?.message || null;
  };

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    error: getErrorMessage(mutation.error),
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};
