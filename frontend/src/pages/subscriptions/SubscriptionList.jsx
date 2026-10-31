import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import subscriptionApi from '../../api/subscriptions';
import customerApi from '../../api/customers';
import productApi from '../../api/products';
import planApi from '../../api/plans';
import { Plus, Check, Play, Pause, XCircle, RotateCcw } from 'lucide-react';

export const SubscriptionList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, page_size: 15, total: 0, total_pages: 1 });

  // Creation Wizard Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    variant_id: '',
    course_level: 'Intermediate',
    plan_id: '',
    quantity: 1,
    start_date: new Date().toISOString().split('T')[0],
  });

  const fetchSubscriptions = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionApi.list({
        page,
        page_size: pagination.page_size,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setSubscriptions(response.data || []);
      if (response.pagination) setPagination(response.pagination);
    } catch (err) {
      setError(err.message || 'Unable to load subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(1);
  }, [statusFilter, searchTerm]);

  // Load dropdown resources when opening creation modal
  const handleOpenCreateModal = async () => {
    setIsModalOpen(true);
    try {
      const [custRes, prodRes, planRes] = await Promise.all([
        customerApi.list({ page_size: 50 }).catch(() => ({ data: [] })),
        productApi.list({ page_size: 50 }).catch(() => ({ data: [] })),
        planApi.list({ page_size: 50 }).catch(() => ({ data: [] })),
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setPlans(planRes.data || []);
    } catch (err) {
      console.error('Error fetching resources for subscription form:', err);
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
      alert('Please select a customer.');
      return;
    }

    setSubmitting(true);
    try {
      await subscriptionApi.create({
        customer_id: formData.customer_id,
        plan_id: formData.plan_id || undefined,
        start_date: formData.start_date,
        lines: [
          {
            product_id: formData.product_id,
            variant_level: formData.course_level,
            quantity: Number(formData.quantity) || 1,
          },
        ],
      });
      setIsModalOpen(false);
      fetchSubscriptions(1);
    } catch (err) {
      alert(`Subscription creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Lifecycle State Transitions
  const handleTransition = async (id, action) => {
    try {
      if (action === 'confirm') await subscriptionApi.confirm(id);
      if (action === 'activate') await subscriptionApi.activate(id);
      if (action === 'pause') await subscriptionApi.pause(id);
      if (action === 'resume') await subscriptionApi.resume(id);
      if (action === 'close') await subscriptionApi.close(id);
      fetchSubscriptions(pagination.page);
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const columns = [
    {
      header: 'Sub #',
      key: 'subscription_number',
      render: (row) => <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.subscription_number || `SUB-${row.id}`}</span>,
    },
    {
      header: 'Customer / Student',
      key: 'customer_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.customer_name || 'Customer'}</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.customer_email || ''}</span>
        </div>
      ),
    },
    {
      header: 'Course / Product',
      key: 'product_name',
      render: (row) => (
        <div>
          <span>{row.product_name || 'Python Masterclass'}</span>
          {row.level && <span className="badge badge-info" style={{ marginLeft: '6px' }}>{row.level}</span>}
        </div>
      ),
    },
    {
      header: 'Billing Plan',
      key: 'plan_name',
      render: (row) => row.plan_name || 'Monthly Plan',
    },
    {
      header: 'Recurring Amount',
      key: 'total_amount',
      align: 'right',
      render: (row) => <span className="currency-inr font-semibold">{formatCurrency(row.total_amount || 1999)}</span>,
    },
    {
      header: 'Next Billing',
      key: 'next_billing_date',
      render: (row) => formatDate(row.next_billing_date),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Lifecycle Actions',
      key: 'actions',
      render: (row) => {
        const s = (row.status || '').toUpperCase();
        return (
          <div style={{ display: 'flex', gap: '4px' }}>
            {s === 'DRAFT' && (
              <Button variant="secondary" size="sm" icon={Check} onClick={() => handleTransition(row.id, 'confirm')} title="Confirm Subscription">
                Confirm
              </Button>
            )}
            {s === 'CONFIRMED' && (
              <Button variant="primary" size="sm" icon={Play} onClick={() => handleTransition(row.id, 'activate')} title="Activate Billing">
                Activate
              </Button>
            )}
            {s === 'ACTIVE' && (
              <Button variant="secondary" size="sm" icon={Pause} onClick={() => handleTransition(row.id, 'pause')} title="Pause Subscription">
                Pause
              </Button>
            )}
            {s === 'PAUSED' && (
              <Button variant="outline" size="sm" icon={RotateCcw} onClick={() => handleTransition(row.id, 'resume')} title="Resume Subscription">
                Resume
              </Button>
            )}
            {(s === 'ACTIVE' || s === 'PAUSED') && (
              <Button variant="danger" size="sm" icon={XCircle} onClick={() => handleTransition(row.id, 'close')} title="Close Subscription">
                Close
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscription Management"
        subtitle="Track subscription contracts, course enrollments, renewal schedules, and state transitions"
        breadcrumbs={['Home', 'Subscriptions']}
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreateModal}>
            New Subscription
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        error={error}
        onRetry={() => fetchSubscriptions(pagination.page)}
        pagination={pagination}
        onPageChange={(p) => fetchSubscriptions(p)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by subscription #, customer, or plan..."
        emptyTitle="No subscriptions on record"
        emptyDescription="Create a new subscription or quotation to start recurring billing for a customer."
        emptyActionLabel="Create Subscription"
        onEmptyAction={handleOpenCreateModal}
        headerActions={
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', fontSize: 'var(--font-size-xs)' }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="QUOTATION">Quotation</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>
        }
      />

      {/* New Subscription Wizard Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Subscription"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSubscription} loading={submitting}>
              Create Subscription
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubscription}>
          <Select
            label="Customer / Learner"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            options={customers.map((c) => ({ value: c.id, label: `${c.name || c.full_name} (${c.email})` }))}
            placeholder="Select a registered customer..."
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Select
              label="Course / Product"
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              options={
                products.length > 0
                  ? products.map((p) => ({ value: p.id, label: p.name }))
                  : [{ value: 'py-course', label: 'Python Programming Masterclass' }]
              }
              placeholder="Select course..."
            />

            <Select
              label="Proficiency Level"
              value={formData.course_level}
              onChange={(e) => setFormData({ ...formData, course_level: e.target.value })}
              options={[
                { value: 'Basic', label: 'Basic Level (₹999/mo)' },
                { value: 'Intermediate', label: 'Intermediate (+₹1,000 -> ₹1,999/mo)' },
                { value: 'Advanced', label: 'Advanced (+₹2,500 -> ₹3,499/mo)' },
              ]}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Select
              label="Billing Plan"
              value={formData.plan_id}
              onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
              options={
                plans.length > 0
                  ? plans.map((pl) => ({ value: pl.id, label: `${pl.name} (${pl.billing_interval})` }))
                  : [
                      { value: 'monthly', label: 'Monthly Recurring (30 Days)' },
                      { value: 'yearly', label: 'Annual Bootcamp (12 Months)' },
                    ]
              }
              placeholder="Select billing cadence..."
            />

            <Input
              label="Seat Quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>

          <Input
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </form>
      </Modal>
    </div>
  );
};

export default SubscriptionList;

