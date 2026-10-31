import apiClient from './client';

/**
 * Invoice Management API Service (Section 19.H)
 */
export const invoiceApi = {
  list: (params) => apiClient.get('/invoices', { params }),
  create: (data) => apiClient.post('/invoices', data),
  getById: (id) => apiClient.get(`/invoices/${id}`),
  confirm: (id) => apiClient.post(`/invoices/${id}/confirm`),
  cancel: (id) => apiClient.post(`/invoices/${id}/cancel`),
  getPayments: (id) => apiClient.get(`/invoices/${id}/payments`),
  getHistory: (id) => apiClient.get(`/invoices/${id}/history`),
};

export default invoiceApi;

