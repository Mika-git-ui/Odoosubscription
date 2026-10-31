import apiClient from './client';

/**
 * Billing Engine API Service (Section 19.I)
 * Automated recurring billing execution & exception retry
 */
export const billingApi = {
  run: (data) => apiClient.post('/billing/run', data),
  getUpcoming: (params) => apiClient.get('/billing/upcoming', { params }),
  getExceptions: (params) => apiClient.get('/billing/exceptions', { params }),
  getHistory: (params) => apiClient.get('/billing/history', { params }),
  getHistoryById: (id) => apiClient.get(`/billing/history/${id}`),
  retryException: (exceptionId) => apiClient.post(`/billing/exceptions/${exceptionId}/retry`),
};

export default billingApi;

