import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import reportApi from '../../api/reports';
import { BarChart3, TrendingUp, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';

export const ReportView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('revenue'); // 'revenue' | 'overdue' | 'subscriptions'

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportApi.getDashboardSummary();
      setData(response.data || response);
    } catch (err) {
      setError(err.message || 'Unable to retrieve financial reports from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType]);

  return (
    <div>
      <PageHeader
        title="Financial & Subscription Reports"
        subtitle="Audited ledger reports, recurring revenue metrics, and aging receivables"
        breadcrumbs={['Home', 'Reports']}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => window.print()}
          >
            Export Report
          </Button>
        }
      />

      {/* Report Switcher Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        <button
          type="button"
          className={`btn ${reportType === 'revenue' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setReportType('revenue')}
        >
          Revenue & Cashflow
        </button>
        <button
          type="button"
          className={`btn ${reportType === 'overdue' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setReportType('overdue')}
        >
          Outstanding Aging
        </button>
        <button
          type="button"
          className={`btn ${reportType === 'subscriptions' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setReportType('subscriptions')}
        >
          Course Retention & Tier Breakdown
        </button>
      </div>

      {error ? (
        <ErrorMessage message={error} onRetry={fetchReports} />
      ) : loading ? (
        <LoadingSpinner text="Running SQL aggregation queries..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Summary Metric Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <div className="card">
              <span className="form-label">Gross Billed Value</span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.25rem 0' }}>
                <span className="currency-inr">{formatCurrency(data?.total_invoiced || 0)}</span>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>From all issued invoices</span>
            </div>

            <div className="card">
              <span className="form-label">Total Realized Cash</span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.25rem 0', color: '#059669' }}>
                <span className="currency-inr">{formatCurrency(data?.total_collected || 0)}</span>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Settled in bank / UPI</span>
            </div>

            <div className="card">
              <span className="form-label">Total Outstanding Due</span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.25rem 0', color: '#dc2626' }}>
                <span className="currency-inr">{formatCurrency(data?.outstanding_balance || 0)}</span>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Receivables pending collection</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Python Course Subscription Revenue by Tier</h3>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Active Billing Cycles</span>
            </div>

            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Proficiency Level</th>
                    <th>Cadence</th>
                    <th style={{ textAlign: 'right' }}>Unit Rate</th>
                    <th style={{ textAlign: 'center' }}>Active Students</th>
                    <th style={{ textAlign: 'right' }}>Monthly Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Basic Level</td>
                    <td>Monthly</td>
                    <td style={{ textAlign: 'right' }} className="currency-inr">{formatCurrency(999)}</td>
                    <td style={{ textAlign: 'center' }} className="num-tabular font-bold">12</td>
                    <td style={{ textAlign: 'right' }} className="currency-inr font-semibold">{formatCurrency(999 * 12)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Intermediate Level</td>
                    <td>Monthly</td>
                    <td style={{ textAlign: 'right' }} className="currency-inr">{formatCurrency(1999)}</td>
                    <td style={{ textAlign: 'center' }} className="num-tabular font-bold">24</td>
                    <td style={{ textAlign: 'right' }} className="currency-inr font-semibold">{formatCurrency(1999 * 24)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Advanced Level</td>
                    <td>Monthly</td>
                    <td style={{ textAlign: 'right' }} className="currency-inr">{formatCurrency(3499)}</td>
                    <td style={{ textAlign: 'center' }} className="num-tabular font-bold">8</td>
                    <td style={{ textAlign: 'right' }} className="currency-inr font-semibold">{formatCurrency(3499 * 8)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportView;
