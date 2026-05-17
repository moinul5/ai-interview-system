/**
 * authService.js
 * --------------
 * Handles all authentication-related API calls.
 * Simple password-based auth — no JWT tokens.
 */

import apiClient from "./apiClient";

/**
 * Login a user.
 * POST /auth/login → { id, full_name, email, role, created_at }
 */
export const loginUser = async (email, password) => {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
};

/**
 * Register / Signup a new user.
 * POST /auth/register → { id, full_name, email, role, created_at }
 */
export const registerUser = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

/**
 * Logout the current user — clears localStorage.
 */
export const logoutUser = async () => {
  localStorage.removeItem("user");
};
