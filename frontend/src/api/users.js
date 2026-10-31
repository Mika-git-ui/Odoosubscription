import apiClient from './client';

/**
 * User & Staff Management API Service (Section 19.B)
 * Admin-only operations for creating and updating staff/admin accounts
 */
export const userApi = {
  list: (params) => apiClient.get('/users', { params }),
  create: (data) => apiClient.post('/users', data),
  getById: (id) => apiClient.get(`/users/${id}`),
  update: (id, data) => apiClient.patch(`/users/${id}`, data),
  updateStatus: (id, isActive) => apiClient.patch(`/users/${id}/status`, { is_active: isActive }),
  delete: (id) => apiClient.delete(`/users/${id}`),
};

export default userApi;

