import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import quotationApi from '../../api/quotations';
import customerApi from '../../api/customers';
import { Plus, Check, ArrowRight, Copy } from 'lucide-react';

export const QuotationList = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Quote Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    template_type: 'COLLEGE_BATCH',
    valid_until_days: 14,
    notes: 'Bulk Python Training - Intermediate & Advanced Cohorts',
  });

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await quotationApi.list({ search: searchTerm });
      setQuotations(response.data || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve quotations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [searchTerm]);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    try {
      const response = await customerApi.list({ page_size: 50 });
      setCustomers(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await quotationApi.create({
        customer_id: formData.customer_id,
        valid_until_days: Number(formData.valid_until_days) || 14,
        notes: formData.notes,
        lines: [
          {
            description: 'Python Masterclass - Intermediate Level (Batch License)',
            quantity: 25,
            unit_price: 1500, // discounted batch rate
          },
        ],
      });
      setIsModalOpen(false);
      fetchQuotations();
    } catch (err) {
      alert(`Failed to create quotation: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await quotationApi.confirm(id);
      fetchQuotations();
    } catch (err) {
      alert(`Confirm failed: ${err.message}`);
    }
  };

  const handleConvert = async (id) => {
    try {
      await quotationApi.convert(id);
      alert('Quotation successfully converted into an active Subscription!');
      fetchQuotations();
    } catch (err) {
      alert(`Conversion failed: ${err.message}`);
    }
  };

  const columns = [
    {
      header: 'Quote #',
      key: 'quotation_number',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.quotation_number || `QTN-${row.id}`}</span>,
    },
    {
      header: 'Customer / Institution',
      key: 'customer_name',
      render: (row) => row.customer_name || 'Customer Account',
    },
    {
      header: 'Offer Summary',
      key: 'notes',
      render: (row) => row.notes || 'Python Training Cohort License',
    },
    {
      header: 'Total Value',
      key: 'total_amount',
      align: 'right',
      render: (row) => <span className="currency-inr font-semibold">{formatCurrency(row.total_amount || 37500)}</span>,
    },
    {
      header: 'Valid Until',
      key: 'expiry_date',
      render: (row) => formatDate(row.expiry_date || new Date(Date.now() + 14 * 86400000)),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status || 'DRAFT'} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {row.status === 'DRAFT' && (
            <Button variant="secondary" size="sm" icon={Check} onClick={() => handleConfirm(row.id)}>
              Confirm
            </Button>
          )}
          {row.status !== 'CONVERTED' && (
            <Button variant="primary" size="sm" icon={ArrowRight} onClick={() => handleConvert(row.id)}>
              Convert to Sub
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quotation Proposals"
        subtitle="Draft bulk training quotes, customize pricing discounts, and convert to active subscriptions"
        breadcrumbs={['Home', 'Quotations']}
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenModal}>
            Draft New Quotation
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={quotations}
        loading={loading}
        error={error}
        onRetry={fetchQuotations}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search quotations by # or customer..."
        emptyTitle="No quotations drafted"
        emptyDescription="Create quotation offers with pre-configured templates for college batches or corporate groups."
        emptyActionLabel="Draft Quotation"
        onEmptyAction={handleOpenModal}
      />

      {/* Draft Quotation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Draft Quotation from Template"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateQuotation} loading={submitting}>
              Generate Quotation
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateQuotation}>
          <Select
            label="Target Customer"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            options={customers.map((c) => ({ value: c.id, label: `${c.name || c.full_name} (${c.company_name || 'Individual'})` }))}
            placeholder="Select customer..."
            required
          />

          <Select
            label="Quotation Template"
            value={formData.template_type}
            onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
            options={[
              { value: 'COLLEGE_BATCH', label: 'University Cohort Template (25 seats @ ₹1,500/mo)' },
              { value: 'ENTERPRISE_PASS', label: 'Enterprise Advanced Pass (10 seats @ ₹2,999/mo)' },
            ]}
          />

          <Input
            label="Validity Window (Days)"
            type="number"
            value={formData.valid_until_days}
            onChange={(e) => setFormData({ ...formData, valid_until_days: e.target.value })}
            required
          />

          <Input
            label="Proposal Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Terms, bulk discount justifications, and payment conditions"
          />
        </form>
      </Modal>
    </div>
  );
};

export default QuotationList;

