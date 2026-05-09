/**
 * interviewService.js
 * -------------------
 * Handles all AI interview-related API calls:
 *   - Start an interview session
 *   - Fetch past sessions
 *   - Submit an answer
 *   - Get AI feedback
 *
 * BACKEND INTEGRATION:
 *   Replace endpoint strings with your actual backend routes.
 */

import apiClient from "./apiClient";

/**
 * Start a new AI interview session.
 * @param {Object} sessionConfig - { job_role, difficulty, resume_id? }
 * @returns {Promise} - New session object { session_id, first_question, ... }
 *
 * TODO (Backend): POST /interviews/start
 * Expected body: { job_role, difficulty, resume_id? }
 */
export const startInterviewSession = async (sessionConfig) => {
  const response = await apiClient.post("/interviews/start", sessionConfig);
  return response.data;
};

/**
 * Get all past interview sessions for the current user.
 * @returns {Promise} - Array of session objects
 *
 * TODO (Backend): GET /interviews/sessions
 * Expected response: [{ session_id, job_role, score, date, status }, ...]
 */
export const getInterviewSessions = async () => {
  const response = await apiClient.get("/interviews/sessions");
  return response.data;
};

/**
 * Submit a user's answer to the current question in a session.
 * @param {string} sessionId
 * @param {string} answer - The user's text/voice answer
 * @returns {Promise} - Next question + intermediate feedback
 *
 * TODO (Backend): POST /interviews/:sessionId/answer
 * Expected body: { answer }
 */
export const submitAnswer = async (sessionId, answer) => {
  const response = await apiClient.post(`/interviews/${sessionId}/answer`, {
    answer,
  });
  return response.data;
};

/**
 * Get the final AI-generated feedback for a completed session.
 * @param {string} sessionId
 * @returns {Promise} - Feedback object { score, strengths, weaknesses, tips }
 *
 * TODO (Backend): GET /interviews/:sessionId/feedback
 */
export const getSessionFeedback = async (sessionId) => {
  const response = await apiClient.get(`/interviews/${sessionId}/feedback`);
  return response.data;
};
