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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = "/login";
      console.error("Unauthorized - redirecting to login");
    }
    if (error.response?.status === 403) {
      console.error("Forbidden - insufficient permissions");
    }
    return Promise.reject(error);
  }
);

export default api;
