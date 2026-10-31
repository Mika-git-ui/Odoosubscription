import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency } from '../../utils/formatters';
import planApi from '../../api/plans';
import { Plus, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';

export const PlanList = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await planApi.list();
      setPlans(response.data || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve subscription plans.');
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
      render: (row) => <span className="badge badge-info">{row.billing_interval || 'MONTHLY'}</span>,
    },
    {
      header: 'Base Cost',
      key: 'cost',
      align: 'right',
      render: (row) => <span className="currency-inr font-semibold">{formatCurrency(row.cost)}</span>,
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
        <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
          {row.allow_pause && <span className="badge badge-neutral">Pausable</span>}
          {row.auto_close ? <span className="badge badge-warning">Auto-Close</span> : <span className="badge badge-success">Auto-Renew</span>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        subtitle="Configure billing intervals, baseline recurring pricing, and subscription termination rules"
        breadcrumbs={['Home', 'Subscription Plans']}
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Create New Plan
          </Button>
        }
      />

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

      {/* Create Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configure New Subscription Plan"
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
            placeholder="e.g. Monthly Standard Pass"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.allow_pause}
                onChange={(e) => setFormData({ ...formData, allow_pause: e.target.checked })}
              />
              Allow customers to pause their subscription
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.auto_close}
                onChange={(e) => setFormData({ ...formData, auto_close: e.target.checked })}
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

