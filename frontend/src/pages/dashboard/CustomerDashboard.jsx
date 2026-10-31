import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import customerApi from '../../api/customers';
import {
  BookOpen,
  Calendar,
  Receipt,
  CreditCard,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomerData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [subsRes, invRes] = await Promise.all([
        customerApi.getSubscriptions(user.id).catch(() => ({ data: [] })),
        customerApi.getInvoices(user.id).catch(() => ({ data: [] })),
      ]);
      setSubscriptions(subsRes.data || []);
      setInvoices(invRes.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load customer portal details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [user?.id]);

  const activeSub = subscriptions.find((s) => s.status === 'ACTIVE') || subscriptions[0];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.full_name || 'Student'}!`}
        subtitle="Manage your Python course subscriptions, track renewals, and view invoices"
        breadcrumbs={['Customer Portal', 'My Dashboard']}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={Receipt}
            onClick={() => navigate('/my-invoices')}
          >
            View Invoices
          </Button>
        }
      />

      {error ? (
        <ErrorMessage message={error} onRetry={fetchCustomerData} />
      ) : loading ? (
        <LoadingSpinner text="Retrieving subscription data..." />
      ) : (
        <>
          {/* Active Course Subscription Card */}
          <div className="card" style={{ marginBottom: 'var(--space-6)', backgroundColor: 'var(--bg-surface)' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <BookOpen size={20} color="var(--primary)" />
                <h3 className="card-title">Active Course Enrollment</h3>
              </div>
              <StatusBadge status={activeSub?.status || 'ACTIVE'} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-4)',
                marginTop: 'var(--space-4)',
              }}
            >
              <div>
                <span className="form-label">Course Title</span>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  {activeSub?.product_name || 'Python Programming & Engineering Masterclass'}
                </div>
                <span className="badge badge-info" style={{ marginTop: '4px' }}>
                  Level: {activeSub?.level || 'Intermediate Level'}
                </span>
              </div>

              <div>
                <span className="form-label">Billing Interval</span>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  {activeSub?.billing_interval || 'Monthly (Recurring)'}
                </div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  Rate: {formatCurrency(activeSub?.unit_price || 1999)} / mo
                </span>
              </div>

              <div>
                <span className="form-label">Next Renewal Date</span>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatDate(activeSub?.next_billing_date || new Date())}
                </div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Auto-renew active
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: 'var(--space-6)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-3)',
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/my-subscriptions')}
              >
                View Course Curriculum
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/my-subscriptions')}
              >
                Upgrade Course Level
              </Button>
            </div>
          </div>

          {/* Recent Invoices & Billing Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Invoices & Receipts</h3>
              <Button variant="secondary" size="sm" onClick={() => navigate('/payment-history')}>
                Payment History
              </Button>
            </div>

            {invoices.length === 0 ? (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', padding: 'var(--space-4) 0' }}>
                No invoices issued yet. Your next invoice will be automatically generated on your billing date.
              </p>
            ) : (
              <div className="table-responsive" style={{ border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Issue Date</th>
                      <th>Total Amount</th>
                      <th>Balance Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 5).map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                        <td>{formatDate(inv.issue_date)}</td>
                        <td className="currency-inr font-medium">{formatCurrency(inv.total_amount)}</td>
                        <td className="currency-inr" style={{ color: inv.balance_due > 0 ? '#dc2626' : undefined }}>
                          {formatCurrency(inv.balance_due)}
                        </td>
                        <td>
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerDashboard;

