/**
 * userService.js
 * --------------
 * Handles user profile-related API calls:
 *   - Get profile
 *   - Update profile
 *   - Change password
 *
 * BACKEND INTEGRATION:
 *   Replace endpoint strings with your actual backend routes.
 */

import apiClient from "./apiClient";

/**
 * Get the current user's profile.
 * @returns {Promise} - User profile object
 *
 * TODO (Backend): GET /users/me
 * Expected response: { id, full_name, email, avatar_url, bio, skills, ... }
 */
export const getUserProfile = async () => {
  const response = await apiClient.get("/users/me");
  return response.data;
};

/**
 * Update the current user's profile.
 * @param {Object} profileData - Fields to update (e.g., full_name, bio, skills)
 * @returns {Promise} - Updated user profile
 *
 * TODO (Backend): PUT /users/me
 * Expected body: { full_name?, bio?, skills?, avatar_url? }
 */
export const updateUserProfile = async (profileData) => {
  const response = await apiClient.put("/users/me", profileData);
  return response.data;
};

/**
 * Change the current user's password.
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise}
 *
 * TODO (Backend): POST /users/me/change-password
 * Expected body: { current_password, new_password }
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await apiClient.post("/users/me/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
};
