import axios from "axios";
import { forceLogout } from "../utils/sessionManager";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:8080/api";

const CHANNEL_NAME_REFRESH = "token-refresh-channel";

const notifyTokenRefresh = () => {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME_REFRESH);
    channel.postMessage({ type: "tokenRefreshed" });
    channel.close();
  } catch (e) {
    console.warn("Could not notify token refresh:", e);
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch (_e) {
    return true;
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem("accessToken");

    // Check if token is expired before any request
    if (token && isTokenExpired(token)) {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken || isTokenExpired(refreshToken)) {
          console.log("Tokens expired, forcing logout");
          forceLogout();
          return Promise.reject(new Error("Tokens expired"));
        }

        // Refresh token natively
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        token = response.data.accessToken;
        localStorage.setItem("accessToken", token);
        notifyTokenRefresh();
      } catch (error) {
        console.log("Silent refresh failed, forcing logout", error);
        forceLogout();
        return Promise.reject(error);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        // Check if refresh token is also expired
        if (refreshToken && isTokenExpired(refreshToken)) {
          console.log("Refresh token expired, forcing logout");
          forceLogout();
          return Promise.reject(error);
        }

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem("accessToken", accessToken);
          notifyTokenRefresh();

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (_refreshError) {
        // Refresh failed, logout user
        console.log("Token refresh failed, forcing logout");
        forceLogout();
      }
    }

    return Promise.reject(error);
  },
);

export default api;
