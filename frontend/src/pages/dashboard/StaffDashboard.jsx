import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import reportApi from '../../api/reports';
import {
  Users,
  FileText,
  FileCheck2,
  Receipt,
  CreditCard,
  Plus,
} from 'lucide-react';

export const StaffDashboard = () => {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaffMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await reportApi.getDashboardSummary();
        setMetrics(response.data || response);
      } catch (err) {
        setError(err.message || 'Unable to load staff operations dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffMetrics();
  }, []);

  return (
    <div>
      <PageHeader
        title="Staff Operations Hub"
        subtitle="Day-to-day customer management, subscription lifecycle tracking, and invoice payments"
        breadcrumbs={['Home', 'Staff Dashboard']}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/quotations')}
            >
              Draft Quotation
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Receipt}
              onClick={() => navigate('/invoices')}
            >
              Manage Invoices
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorMessage message={error} onRetry={() => window.location.reload()} />
      ) : loading ? (
        <LoadingSpinner text="Loading operational queues..." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div className="card card-clickable" onClick={() => navigate('/customers')}>
            <span className="form-label">Total Customers</span>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.5rem 0' }}>
              <span className="num-tabular">{metrics?.total_customers || 0}</span>
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary)' }}>
              View & manage accounts &rarr;
            </span>
          </div>

          <div className="card card-clickable" onClick={() => navigate('/subscriptions')}>
            <span className="form-label">Active Subscriptions</span>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.5rem 0' }}>
              <span className="num-tabular">{metrics?.active_subscriptions || 0}</span>
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary)' }}>
              Review student enrollments &rarr;
            </span>
          </div>

          <div className="card card-clickable" onClick={() => navigate('/quotations')}>
            <span className="form-label">Pending Quotations</span>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.5rem 0' }}>
              <span className="num-tabular">{metrics?.pending_quotations || 0}</span>
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary)' }}>
              Follow up with prospects &rarr;
            </span>
          </div>

          <div className="card card-clickable" onClick={() => navigate('/invoices')}>
            <span className="form-label">Overdue Invoices</span>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.5rem 0', color: '#991b1b' }}>
              <span className="num-tabular">{metrics?.overdue_invoices_count || 0}</span>
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: '#dc2626' }}>
              Record overdue payments &rarr;
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;

