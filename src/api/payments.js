import apiClient from './client';

/**
 * Payment Management & Ledger API Service (Section 19.J)
 */
export const paymentApi = {
  list: (params) => apiClient.get('/payments', { params }),
  recordForInvoice: (invoiceId, paymentData) => apiClient.post(`/invoices/${invoiceId}/payments`, paymentData),
  getById: (id) => apiClient.get(`/payments/${id}`),
  getReceipt: (id) => apiClient.get(`/payments/${id}/receipt`),
  reverse: (id, reason) => apiClient.post(`/payments/${id}/reverse`, { reason }),
};

export default paymentApi;

