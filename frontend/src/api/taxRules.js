import apiClient from './client';

/**
 * Tax Rules API Service (Section 19.L)
 */
export const taxApi = {
  list: (params) => apiClient.get('/tax-rules', { params }),
  create: (data) => apiClient.post('/tax-rules', data),
  getById: (id) => apiClient.get(`/tax-rules/${id}`),
  update: (id, data) => apiClient.patch(`/tax-rules/${id}`, data),
  archive: (id) => apiClient.delete(`/tax-rules/${id}`),
};

export default taxApi;

