import apiClient from './apiClient';

// Users
export const getUsers = (params) => apiClient.get('/admin/users', { params });
export const getUser = (id) => apiClient.get(`/admin/users/${id}`);
export const createUser = (data) => apiClient.post('/admin/users', data);
export const updateUser = (id, data) => apiClient.patch(`/admin/users/${id}`, data);
export const resetPassword = (id, data) => apiClient.post(`/admin/users/${id}/reset-password`, data);

// Interviews
export const getAdminInterviews = (params) => apiClient.get('/admin/interviews', { params });
export const getAdminInterview = (id) => apiClient.get(`/admin/interviews/${id}`);
export const createInterview = (data) => apiClient.post('/admin/interviews/create', data);
export const updateInterviewAssign = (id, data) => apiClient.patch(`/admin/interviews/${id}/assign`, data);
export const updateInterviewStatus = (id, data) => apiClient.patch(`/admin/interviews/${id}/status`, data);
export const deleteInterview = (id) => apiClient.delete(`/admin/interviews/${id}`);

// Analytics
export const getAnalytics = () => apiClient.get('/admin/analytics');
export const getInterviewerAnalytics = () => apiClient.get('/admin/analytics/interviewers');

// Jobs
export const getJobs = (params) => apiClient.get('/admin/jobs', { params });
export const createJob = (data) => apiClient.post('/admin/jobs', data);
export const updateJob = (id, data) => apiClient.patch(`/admin/jobs/${id}`, data);
export const deleteJob = (id) => apiClient.delete(`/admin/jobs/${id}`);
