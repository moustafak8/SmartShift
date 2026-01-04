import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

type LogoutResponse = {
  status: string;
  message: string;
};

const logoutRequest = async (): Promise<LogoutResponse> => {
  const response = await api.post<LogoutResponse>("logout");
  return response.data;
};

export const useLogout = () => {
  const { logOut } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      logOut();
      navigate("/login");
    },
    onError: () => {
      // Even if the API call fails, clear local state and redirect
      logOut();
      navigate("/login");
    },
  });

  return {
    logout: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    loading: mutation.isPending,
  };
};
