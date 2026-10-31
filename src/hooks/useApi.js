import { useState, useCallback } from 'react';

/**
 * Custom hook to execute API calls with automatic loading and error state tracking.
 */
export const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFunc(...args);
        setData(response.data || response);
        return { success: true, data: response.data || response };
      } catch (err) {
        const msg = err.message || 'An unexpected error occurred';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  return {
    data,
    loading,
    error,
    execute,
    setData,
    setError,
  };
};

export default useApi;
