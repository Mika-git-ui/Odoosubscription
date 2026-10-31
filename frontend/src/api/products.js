import apiClient from './client';

/**
 * Product & Course Variants Management API Service (Section 19.D)
 * Powers Python Course Levels (Basic, Intermediate, Advanced) & Add-ons
 */
export const productApi = {
  list: (params) => apiClient.get('/products', { params }),
  create: (data) => apiClient.post('/products', data),
  getById: (id) => apiClient.get(`/products/${id}`),
  update: (id, data) => apiClient.patch(`/products/${id}`, data),
  archive: (id) => apiClient.delete(`/products/${id}`),
  // Variant endpoints
  listVariants: (productId) => apiClient.get(`/products/${productId}/variants`),
  createVariant: (productId, data) => apiClient.post(`/products/${productId}/variants`, data),
  updateVariant: (productId, variantId, data) => apiClient.patch(`/products/${productId}/variants/${variantId}`, data),
};

export default productApi;

