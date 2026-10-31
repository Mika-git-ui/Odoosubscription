import apiClient from './client';

/**
 * Discount Management API Service (Section 19.K)
 */
export const discountApi = {
  list: (params) => apiClient.get('/discounts', { params }),
  create: (data) => apiClient.post('/discounts', data),
  getById: (id) => apiClient.get(`/discounts/${id}`),
  update: (id, data) => apiClient.patch(`/discounts/${id}`, data),
  archive: (id) => apiClient.delete(`/discounts/${id}`),
  validate: (payload) => apiClient.post('/discounts/validate', payload),
};

export default discountApi;

