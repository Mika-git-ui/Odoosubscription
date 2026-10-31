import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Role-Based Protected Route Wrapper
 * Restricts access to authenticated users possessing allowed roles.
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, enforce them
  if (allowedRoles.length > 0) {
    const userRole = (user?.role || 'CUSTOMER').toUpperCase();
    const hasPermission = allowedRoles.map((r) => r.toUpperCase()).includes(userRole);

    if (!hasPermission) {
      // Redirect to role's home view
      const defaultPath = userRole === 'CUSTOMER' ? '/my-dashboard' : '/dashboard';
      return <Navigate to={defaultPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

