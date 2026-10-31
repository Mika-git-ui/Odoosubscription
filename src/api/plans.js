import apiClient from './client';

/**
 * Subscription Plans API Service (Section 19.E)
 * Daily, Weekly, Monthly, Yearly intervals & auto-close lifecycle rules
 */
export const planApi = {
  list: (params) => apiClient.get('/plans', { params }),
  create: (data) => apiClient.post('/plans', data),
  getById: (id) => apiClient.get(`/plans/${id}`),
  update: (id, data) => apiClient.patch(`/plans/${id}`, data),
  archive: (id) => apiClient.delete(`/plans/${id}`),
};

export default planApi;

