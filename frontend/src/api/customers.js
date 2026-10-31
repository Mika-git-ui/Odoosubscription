import apiClient from './client';

/**
 * Customer Management API Service (Section 19.C)
 */
export const customerApi = {
  list: (params) => apiClient.get('/customers', { params }),
  create: (data) => apiClient.post('/customers', data),
  getById: (id) => apiClient.get(`/customers/${id}`),
  update: (id, data) => apiClient.patch(`/customers/${id}`, data),
  delete: (id) => apiClient.delete(`/customers/${id}`),
  getSubscriptions: (id) => apiClient.get(`/customers/${id}/subscriptions`),
  getInvoices: (id) => apiClient.get(`/customers/${id}/invoices`),
  getPayments: (id) => apiClient.get(`/customers/${id}/payments`),
};

export default customerApi;

