import apiClient from './client';

/**
 * Dashboard & Financial Reporting API Service (Section 19.M)
 * Sub-2s SQL aggregate queries for MRR, churn, collections, and overdue aging
 */
export const reportApi = {
  getDashboardSummary: () => apiClient.get('/dashboard/summary'),
  getRevenueReport: (params) => apiClient.get('/reports/revenue', { params }),
  getSubscriptionReport: (params) => apiClient.get('/reports/subscriptions', { params }),
  getInvoiceReport: (params) => apiClient.get('/reports/invoices', { params }),
  getPaymentReport: (params) => apiClient.get('/reports/payments', { params }),
  getOutstandingBalances: (params) => apiClient.get('/reports/outstanding', { params }),
  getOverdueInvoices: (params) => apiClient.get('/reports/overdue', { params }),
};

export default reportApi;

