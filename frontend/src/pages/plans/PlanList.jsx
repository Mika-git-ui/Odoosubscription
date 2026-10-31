import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import SpotlightCard from '../../components/common/SpotlightCard';
import { formatCurrency } from '../../utils/formatters';
import planApi from '../../api/plans';
import {
  Plus,
  CalendarDays,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Check,
  Zap,
  Sparkles,
} from 'lucide-react';

export const PlanList = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    billing_interval: 'MONTHLY',
    cost: '1999',
    min_quantity: 1,
    auto_close: false,
    allow_pause: true,
    allow_renewal: true,
  });

  // Default Revora Python Masterclass Plans
  const defaultPlans = [
    {
      id: 'plan-basic',
      name: 'Basic Level - Python Foundations',
      billing_interval: 'MONTHLY',
      cost: 999,
      min_quantity: 1,
      allow_pause: true,
      auto_close: false,
      popular: false,
      description: 'Core Syntax, Variables, Control Flow, Functions & Object-Oriented Basics.',
      features: [
        'Full access to Python Foundations modules',
        'Weekly interactive assignments & quizzes',
        'Community forum support',
        'Pause anytime policy',
      ],
      enrolled: 12,
    },
    {
      id: 'plan-intermediate',
      name: 'Intermediate Level - Fullstack Python',
      billing_interval: 'MONTHLY',
      cost: 1999,
      min_quantity: 1,
      allow_pause: true,
      auto_close: false,
      popular: true,
      description: 'Data Structures, Algorithms, FastAPI REST APIs, Async I/O & SQL Databases.',
      features: [
        'All Basic Level curriculum included',
        'FastAPI & PostgreSQL hands-on capstones',
        'Bi-weekly live mentor code reviews',
        '1-Click automated billing & receipts',
      ],
      enrolled: 24,
    },
    {
      id: 'plan-advanced',
      name: 'Advanced Level - Systems & ML',
      billing_interval: 'MONTHLY',
      cost: 3499,
      min_quantity: 1,
      allow_pause: true,
      auto_close: false,
      popular: false,
      description: 'Distributed Architecture, Concurrency, Performance Tuning & Applied ML.',
      features: [
        'All Intermediate Level curriculum included',
        'High-throughput distributed systems labs',
        '1-on-1 mentorship & mock interviews',
        'Enterprise-grade project verification',
      ],
      enrolled: 8,
    },
  ];

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await planApi.list();
      if (response && response.data && response.data.length > 0) {
        setPlans(response.data);
      } else {
        setPlans(defaultPlans);
      }
    } catch (err) {
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await planApi.create({
        ...formData,
        cost: parseFloat(formData.cost) || 0,
        min_quantity: Number(formData.min_quantity) || 1,
      });
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      alert(`Plan creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Plan Title',
      key: 'name',
      render: (row) => <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.name}</span>,
    },
    {
      header: 'Billing Cadence',
      key: 'billing_interval',
      render: (row) => <span className="badge badge-pending">{row.billing_interval || 'MONTHLY'}</span>,
    },
    {
      header: 'Base Cost',
      key: 'cost',
      align: 'right',
      render: (row) => <span className="currency-inr font-semibold" style={{ fontWeight: 700 }}>{formatCurrency(row.cost)}</span>,
    },
    {
      header: 'Min Seats',
      key: 'min_quantity',
      align: 'center',
      render: (row) => <span className="num-tabular">{row.min_quantity || 1}</span>,
    },
    {
      header: 'Lifecycle Policies',
      key: 'policies',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px', fontSize: '11px', flexWrap: 'wrap' }}>
          {row.allow_pause && <span className="badge badge-paid">Pausable</span>}
          {row.auto_close ? <span className="badge badge-overdue">Auto-Close</span> : <span className="badge badge-paid">Auto-Renew</span>}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Subscription Plans"
        subtitle="Manage recurring billing cadences, pricing tiers, and cancellation rules"
        breadcrumbs={['Home', 'Subscription Plans']}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* View Switcher Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                padding: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewMode === 'cards' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'cards' ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  boxShadow: viewMode === 'cards' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewMode === 'table' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <List size={13} />
                <span>Table</span>
              </button>
            </div>

            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
              New Plan
            </Button>
          </div>
        }
      />

      {/* Responsive Cards View */}
      {viewMode === 'cards' ? (
        <div className="plans-grid">
          {plans.map((plan) => (
            <SpotlightCard
              key={plan.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
                border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border-default)',
                borderRadius: '12px',
                position: 'relative',
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '20px',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 8px rgba(121, 82, 204, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={11} /> Most Popular
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    {plan.name}
                  </h3>
                  <span className="badge badge-pending">
                    {plan.billing_interval || 'MONTHLY'}
                  </span>
                </div>

                <div style={{ margin: '1rem 0' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {formatCurrency(plan.cost)}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                    / month
                  </span>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {plan.description || 'Masterclass subscription tier configured with automated renewals and instant invoice generation.'}
                </p>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                  {(plan.features || [
                    'Standard syllabus & project materials',
                    'Discord community & peer discussions',
                    'FastAPI & SQL automated test runners',
                    'Pausable whenever needed',
                  ]).map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--status-success-bg)',
                          color: 'var(--status-success-text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={10} />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-default)',
                  paddingTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Enrolled: <strong className="num-tabular" style={{ color: 'var(--text-main)' }}>{plan.enrolled || 14} students</strong>
                </span>

                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  style={{ width: '100%' }}
                >
                  Configure Plan
                </Button>
              </div>
            </SpotlightCard>
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={plans}
          loading={loading}
          error={error}
          onRetry={fetchPlans}
          emptyTitle="No plans configured"
          emptyDescription="Create plans like Monthly or Annual Bootcamps to associate with Python course subscriptions."
          emptyActionLabel="Add Plan"
          onEmptyAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Responsive Create Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configure Subscription Plan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePlan} loading={submitting}>
              Save Plan
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePlan}>
          <Input
            label="Plan Title"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Masterclass Pro Pass"
            required
          />

          <div className="form-grid-2col">
            <Select
              label="Billing Interval"
              value={formData.billing_interval}
              onChange={(e) => setFormData({ ...formData, billing_interval: e.target.value })}
              options={[
                { value: 'DAILY', label: 'Daily (24 Hours)' },
                { value: 'WEEKLY', label: 'Weekly (7 Days)' },
                { value: 'MONTHLY', label: 'Monthly (30 Days)' },
                { value: 'YEARLY', label: 'Yearly (365 Days)' },
              ]}
              required
            />
            <Input
              label="Base Cost (₹)"
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="1999"
              required
            />
          </div>

          <Input
            label="Minimum Quantity / Seats"
            type="number"
            min="1"
            value={formData.min_quantity}
            onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', cursor: 'pointer', color: 'var(--text-main)' }}>
              <input
                type="checkbox"
                checked={formData.allow_pause}
                onChange={(e) => setFormData({ ...formData, allow_pause: e.target.checked })}
                style={{ accentColor: 'var(--primary)' }}
              />
              Allow customers to pause their subscription
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', cursor: 'pointer', color: 'var(--text-main)' }}>
              <input
                type="checkbox"
                checked={formData.auto_close}
                onChange={(e) => setFormData({ ...formData, auto_close: e.target.checked })}
                style={{ accentColor: 'var(--primary)' }}
              />
              Auto-close subscription when end date is reached (no auto-renewal)
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlanList;
