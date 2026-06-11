/**
 * videoInterviewService.js
 * ------------------------
 * API service for the Video Interview Analysis system.
 * Wraps all calls to /api/video/* endpoints.
 */

import apiClient from "./apiClient";

/**
 * Validate that an AI interview session exists before starting video.
 * @param {string} sessionId
 * @param {number} userId
 */
export async function startVideoSession(sessionId, userId) {
  const res = await apiClient.post("/api/video/start-session", {
    session_id: sessionId,
    user_id: userId,
  });
  return res.data;
}

/**
 * Upload MediaPipe metrics and transcript to the backend for scoring.
 * @param {Object} payload
 * @param {string} payload.session_id
 * @param {number} payload.user_id
 * @param {number} payload.eye_contact_score       — 0-100 from MediaPipe
 * @param {number} payload.face_visibility_score   — 0-100 from MediaPipe
 * @param {number} payload.head_stability_score    — 0-100 from MediaPipe
 * @param {string} payload.transcript              — combined transcript from all answers
 * @param {number} payload.duration_seconds        — total interview duration
 */
export async function uploadVideoAnalysis(payload) {
  const res = await apiClient.post("/api/video/upload-analysis", payload);
  return res.data;
}

/**
 * Trigger Groq AI feedback generation for a session.
 * Must be called after uploadVideoAnalysis.
 * @param {string} sessionId
 */
export async function generateVideoFeedback(sessionId) {
  const res = await apiClient.post("/api/video/generate-feedback", {
    session_id: sessionId,
  });
  return res.data;
}

/**
 * Fetch the full video interview analysis report.
 * @param {string} sessionId
 */
export async function getVideoReport(sessionId) {
  const res = await apiClient.get(`/api/video/report/${sessionId}`);
  return res.data;
}
