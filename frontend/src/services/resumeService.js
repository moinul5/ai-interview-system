/**
 * resumeService.js
 * ----------------
 * Handles all resume-related API calls:
 *   - Upload resume (multipart form data)
 *   - Get user's uploaded resumes
 *   - Delete a resume
 *   - Get AI-parsed resume details
 *
 * BACKEND INTEGRATION:
 *   Replace endpoint strings with your actual backend routes.
 *   Ensure backend accepts multipart/form-data for file uploads.
 */

import apiClient from "./apiClient";

/**
 * Upload a resume file.
 * @param {File} file - The resume file (PDF / DOCX)
 * @returns {Promise} - Parsed/uploaded resume metadata
 *
 * TODO (Backend): POST /resumes/upload
 * Expected body: FormData with key "file"
 * Expected response: { id, filename, uploaded_at, parsed_data: {...} }
 */
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("resume", file);

  // Do NOT set Content-Type manually — axios must set it automatically
  // so it includes the correct multipart boundary string.
  const response = await apiClient.post("/resume/analyze", formData, {
    timeout: 90000, // 90 seconds — Gemini AI analysis can take time
  });
  return response.data;
};

/**
 * Get all resumes uploaded by the current user.
 * @returns {Promise} - Array of resume objects
 *
 * TODO (Backend): GET /resumes
 * Expected response: [{ id, filename, uploaded_at, status }, ...]
 */
export const getUserResumes = async () => {
  const response = await apiClient.get("/resume/analyses");
  return response.data;
};

/**
 * Delete a resume by its ID.
 * @param {string|number} resumeId
 * @returns {Promise}
 *
 * TODO (Backend): DELETE /resumes/:resumeId
 */
export const deleteResume = async (resumeId) => {
  const response = await apiClient.delete(`/resume/analyses/${resumeId}`);
  return response.data;
};

/**
 * Get AI-parsed details for a specific resume.
 * @param {string|number} resumeId
 * @returns {Promise} - Parsed resume object with skills, experience, etc.
 *
 * TODO (Backend): GET /resumes/:resumeId/parse
 * Expected response: { skills: [...], experience: [...], education: [...], ... }
 */
export const getParsedResume = async (resumeId) => {
  const response = await apiClient.get(`/resume/analyses/${resumeId}`);
  return response.data;
};
