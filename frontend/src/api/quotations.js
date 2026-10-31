import apiClient from './client';

/**
 * Quotation & Quotation Template API Service (Section 19.G)
 */
export const quotationApi = {
  list: (params) => apiClient.get('/quotations', { params }),
  create: (data) => apiClient.post('/quotations', data),
  getById: (id) => apiClient.get(`/quotations/${id}`),
  update: (id, data) => apiClient.patch(`/quotations/${id}`, data),
  confirm: (id) => apiClient.post(`/quotations/${id}/confirm`),
  convert: (id) => apiClient.post(`/quotations/${id}/convert`),
  // Templates
  listTemplates: (params) => apiClient.get('/quotation-templates', { params }),
  createTemplate: (data) => apiClient.post('/quotation-templates', data),
  updateTemplate: (id, data) => apiClient.patch(`/quotation-templates/${id}`, data),
  archiveTemplate: (id) => apiClient.delete(`/quotation-templates/${id}`),
};

export default quotationApi;

