/**
 * apiClient.js
 * -----------
 * Centralized Axios instance for all API calls.
 * - Base URL is read from .env (VITE_API_BASE_URL)
 * - Automatically attaches JWT Bearer token from localStorage
 * - Handles 401 responses (token expiry / unauthorized)
 *
 * BACKEND INTEGRATION:
 *   Set VITE_API_BASE_URL in your .env file to your backend URL, e.g.:
 *   VITE_API_BASE_URL=http://localhost:8000/api
 */

import axios from "axios";

const apiClient = axios.create({
  // TODO (Backend): Replace with your actual backend base URL via .env
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attaches JWT token from localStorage to every request if present
apiClient.interceptors.request.use(
  (config) => {
    // TODO (Backend): Adjust the token key name if your backend uses a different one
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handles global error cases (e.g., 401 Unauthorized → redirect to login)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO (Backend): Optionally trigger a token refresh flow here
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
