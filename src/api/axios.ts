import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending HTTP-only cookies with requests
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if already on login page or if this is a login request
      const isLoginPage = window.location.pathname === '/login';
      const isLoginRequest = error.config?.url?.includes('login');
      
      if (!isLoginPage && !isLoginRequest) {
        console.error("Unauthorized - authentication required");
      }
    }
    if (error.response?.status === 403) {
      console.error("Forbidden - insufficient permissions");
    }
    return Promise.reject(error);
  }
);

export default api;

