import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import discountApi from '../../api/discounts';
import { Plus, Percent, Tag } from 'lucide-react';

export const DiscountList = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'PERCENTAGE',
    value: '15',
    min_purchase_amount: '1000',
    max_uses: '100',
    end_date: '',
  });

  const fetchDiscounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await discountApi.list();
      setDiscounts(response.data || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve discount rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await discountApi.create({
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        value: parseFloat(formData.value) || 0,
        min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
        max_uses: Number(formData.max_uses) || 100,
        end_date: formData.end_date || undefined,
      });
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Discount Code',
      key: 'code',
      render: (row) => (
        <span style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>
          {row.code}
        </span>
      ),
    },
    {
      header: 'Benefit Value',
      key: 'value',
      render: (row) => (
        <span className="font-semibold">
          {row.discount_type === 'PERCENTAGE' ? `${row.value}% OFF` : `${formatCurrency(row.value)} FLAT`}
        </span>
      ),
    },
    {
      header: 'Min Purchase',
      key: 'min_purchase_amount',
      render: (row) => formatCurrency(row.min_purchase_amount || 0),
    },
    {
      header: 'Usage Quota',
      key: 'uses',
      render: (row) => (
        <span className="num-tabular">
          {row.current_uses || 0} / {row.max_uses || '∞'} uses
        </span>
      ),
    },
    {
      header: 'Valid Until',
      key: 'end_date',
      render: (row) => (row.end_date ? formatDate(row.end_date) : 'No expiration'),
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (row) => <StatusBadge status={row.is_active !== false ? 'ACTIVE' : 'CLOSED'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Promotions & Discount Rules"
        subtitle="Configure seasonal coupons, student discounts, and bulk seat voucher codes"
        breadcrumbs={['Home', 'Discounts']}
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Create Discount Code
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={discounts}
        loading={loading}
        error={error}
        onRetry={fetchDiscounts}
        emptyTitle="No discount rules active"
        emptyDescription="Create coupon codes like PYTHON20 for 20% off Python course subscriptions."
        emptyActionLabel="Add Discount"
        onEmptyAction={() => setIsModalOpen(true)}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Discount Code"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} loading={submitting}>
              Save Coupon
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <Input
            label="Coupon Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g. PYTHON20"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Select
              label="Discount Type"
              value={formData.discount_type}
              onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FIXED', label: 'Fixed Amount (₹)' },
              ]}
              required
            />
            <Input
              label="Discount Value"
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="15"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input
              label="Minimum Order Value (₹)"
              type="number"
              value={formData.min_purchase_amount}
              onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
              placeholder="1000"
            />
            <Input
              label="Max Usage Limit"
              type="number"
              value={formData.max_uses}
              onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
              placeholder="100"
            />
          </div>

          <Input
            label="Expiry Date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};

export default DiscountList;
