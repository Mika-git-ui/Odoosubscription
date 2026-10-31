/**
 * REVORA CENTRAL API CLIENT
 * Centralized Axios instance with base URL, JWT auto-injection,
 * and unified error extraction.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Authentication Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('revora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize Response Body and Centralize Error Handling
apiClient.interceptors.response.use(
  (response) => {
    // Backend standard envelope: { success, message, data, pagination }
    return response.data;
  },
  (error) => {
    // 401 Unauthorized handling: session expired
    if (error.response?.status === 401) {
      localStorage.removeItem('revora_token');
      localStorage.removeItem('revora_user');
      
      // Only redirect if not already on the login or register page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login?expired=true';
      }
    }

    // Extract standardized error messages matching backend shape
    const serverMessage = error.response?.data?.message;
    const serverErrors = error.response?.data?.errors;
    const fallbackMessage = error.message || 'Unable to connect to the Revora server. Please check your network.';

    const standardizedError = {
      status: error.response?.status || 500,
      message: serverMessage || fallbackMessage,
      errors: serverErrors || null,
      raw: error,
    };

    return Promise.reject(standardizedError);
  }
);

export default apiClient;

