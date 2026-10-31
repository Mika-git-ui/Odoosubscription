import apiClient from './client';

/**
 * Subscription Lifecycle API Service (Section 19.F)
 * Handles Draft -> Quotation -> Confirmed -> Active -> Paused/Closed state transitions
 */
export const subscriptionApi = {
  list: (params) => apiClient.get('/subscriptions', { params }),
  create: (data) => apiClient.post('/subscriptions', data),
  getById: (id) => apiClient.get(`/subscriptions/${id}`),
  update: (id, data) => apiClient.patch(`/subscriptions/${id}`, data),
  confirm: (id) => apiClient.post(`/subscriptions/${id}/confirm`),
  activate: (id) => apiClient.post(`/subscriptions/${id}/activate`),
  pause: (id) => apiClient.post(`/subscriptions/${id}/pause`),
  resume: (id) => apiClient.post(`/subscriptions/${id}/resume`),
  renew: (id) => apiClient.post(`/subscriptions/${id}/renew`),
  close: (id) => apiClient.post(`/subscriptions/${id}/close`),
  getHistory: (id) => apiClient.get(`/subscriptions/${id}/history`),
};

export default subscriptionApi;

