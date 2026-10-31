import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// App Pages
import Dashboard from './pages/dashboard/Dashboard';
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import CustomerList from './pages/customers/CustomerList';
import ProductList from './pages/products/ProductList';
import PlanList from './pages/plans/PlanList';
import SubscriptionList from './pages/subscriptions/SubscriptionList';
import QuotationList from './pages/quotations/QuotationList';
import InvoiceList from './pages/invoices/InvoiceList';
import PaymentList from './pages/payments/PaymentList';
import DiscountList from './pages/discounts/DiscountList';
import ReportView from './pages/reports/ReportView';
import SettingsView from './pages/settings/SettingsView';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Authenticated Application Shell */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard (Admin, Staff, Customer dispatcher) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Core Management Views */}
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/plans" element={<PlanList />} />
            <Route path="/subscriptions" element={<SubscriptionList />} />
            <Route path="/quotations" element={<QuotationList />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/payments" element={<PaymentList />} />
            <Route path="/discounts" element={<DiscountList />} />
            <Route path="/tax-rules" element={<SettingsView />} />
            <Route path="/billing-centre" element={<ReportView />} />
            <Route path="/reports" element={<ReportView />} />
            <Route path="/users" element={<SettingsView />} />
            <Route path="/settings" element={<SettingsView />} />

            {/* Dedicated Customer Portal Routes */}
            <Route path="/my-dashboard" element={<CustomerDashboard />} />
            <Route path="/my-subscriptions" element={<SubscriptionList />} />
            <Route path="/my-invoices" element={<InvoiceList />} />
            <Route path="/payment-history" element={<PaymentList />} />
            <Route path="/profile" element={<SettingsView />} />
          </Route>

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
