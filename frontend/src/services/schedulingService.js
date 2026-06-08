import apiClient from './apiClient';

// Candidate
export const getCandidateInterviews = () => apiClient.get('/candidate/interviews');
export const getAvailableSlots = (interviewId) => apiClient.get(`/candidate/interviews/${interviewId}/slots`);
export const selectSlot = (interviewId, data) => apiClient.post(`/candidate/interviews/${interviewId}/select-slot`, data);
export const requestReschedule = (interviewId, data) => apiClient.post(`/candidate/interviews/${interviewId}/reschedule`, data);

// Interviewer
export const getInterviewerAvailability = () => apiClient.get('/interviewer/availability');
export const createAvailability = (data) => apiClient.post('/interviewer/availability', data);
export const deleteAvailability = (id) => apiClient.delete(`/interviewer/availability/${id}`);
export const getInterviewerInterviews = () => apiClient.get('/interviewer/interviews');
export const acceptInterview = (id) => apiClient.patch(`/interviewer/interviews/${id}/accept`);
export const rejectInterview = (id, data) => apiClient.patch(`/interviewer/interviews/${id}/reject`, data);
export const submitFeedback = (id, data) => apiClient.post(`/interviewer/interviews/${id}/feedback`, data);
