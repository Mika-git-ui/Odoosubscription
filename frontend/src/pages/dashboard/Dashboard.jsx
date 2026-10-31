import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';
import CustomerDashboard from './CustomerDashboard';

export const Dashboard = () => {
  const { user } = useAuth();
  const role = (user?.role || 'CUSTOMER').toUpperCase();

  if (role === 'ADMIN') return <AdminDashboard />;
  if (role === 'STAFF') return <StaffDashboard />;
  return <CustomerDashboard />;
};

export default Dashboard;
