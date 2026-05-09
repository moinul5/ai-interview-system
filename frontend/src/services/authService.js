/**
 * authService.js
 * --------------
 * Handles all authentication-related API calls:
 *   - Login
 *   - Signup / Register
 *   - Logout
 *   - Get current logged-in user
 *
 * BACKEND INTEGRATION:
 *   Replace the endpoint strings (e.g., "/auth/login") with your actual routes.
 *   Adjust request body fields to match your backend's expected schema.
 *   Store the JWT token returned by the backend in localStorage / context.
 */

import apiClient from "./apiClient";

/**
 * Login a user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise} - API response with { access_token, user }
 *
 * TODO (Backend): POST /auth/login
 * Expected body: { email, password }
 * Expected response: { access_token: string, token_type: "bearer", user: {...} }
 */
export const loginUser = async (email, password) => {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
};

/**
 * Register / Signup a new user.
 * @param {Object} userData - { full_name, email, password }
 * @returns {Promise} - API response with new user info
 *
 * TODO (Backend): POST /auth/register
 * Expected body: { full_name, email, password }
 * Expected response: { id, email, full_name, ... }
 */
export const registerUser = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

/**
 * Logout the current user (invalidate token on backend if applicable).
 * Also clears local storage.
 *
 * TODO (Backend): POST /auth/logout  (optional, depends on your backend strategy)
 */
export const logoutUser = async () => {
  try {
    // TODO (Backend): Uncomment if your backend supports token invalidation
    // await apiClient.post("/auth/logout");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  }
};

/**
 * Fetch the currently authenticated user's profile.
 * @returns {Promise} - User object
 *
 * TODO (Backend): GET /auth/me
 * Expected response: { id, full_name, email, role, ... }
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get("/auth/me");
  return response.data;
};
