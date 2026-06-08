import axios from "axios";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/auth.store";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // Attach access token
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Attach CSRF token for mutating requests
  const method = config.method?.toUpperCase();
  if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = Cookies.get("csrfToken");
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }

  return config;
});

// ─── Response interceptor ────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue additional requests
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get fresh CSRF token from cookie
        const csrfToken = Cookies.get("csrfToken");
        const response = await axios.post(
          "/api/auth/refresh",
          {},
          {
            withCredentials: true,
            headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
          }
        );

        const { accessToken } = response.data;
        useAuthStore.getState().setAccessToken(accessToken);

        // Flush queue
        refreshQueue.forEach((cb) => cb(accessToken));
        refreshQueue = [];

        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — log out
        useAuthStore.getState().logout();
        refreshQueue = [];
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
