import apiClient from './apiClient';

export const getNotifications = (params) => apiClient.get('/notifications', { params });
export const getUnreadCount = () => apiClient.get('/notifications/unread-count');
export const markAsRead = (id) => apiClient.patch(`/notifications/${id}/read`);
export const markAllRead = () => apiClient.patch('/notifications/read-all');
