import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import customerApi from '../../api/customers';
import { Plus, Users, Mail, Phone, Building } from 'lucide-react';

export const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, page_size: 15, total: 0, total_pages: 1 });

  // Add Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    tax_id: '',
    billing_address: '',
    payment_terms: 'NET_30',
  });

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerApi.list({
        page,
        page_size: pagination.page_size,
        search: searchTerm,
      });
      setCustomers(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve customers from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [searchTerm]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await customerApi.create(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        tax_id: '',
        billing_address: '',
        payment_terms: 'NET_30',
      });
      fetchCustomers(1);
    } catch (err) {
      alert(`Customer creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Customer / Student Name',
      key: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.name || row.full_name}</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.company_name || 'Individual Student'}</span>
        </div>
      ),
    },
    {
      header: 'Contact Email',
      key: 'email',
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
          <Mail size={13} /> {row.email}
        </span>
      ),
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (row) => row.phone || '—',
    },
    {
      header: 'Payment Terms',
      key: 'payment_terms',
      render: (row) => <span className="badge badge-neutral">{row.payment_terms || 'Immediate'}</span>,
    },
    {
      header: 'Active Subscriptions',
      key: 'subscriptions_count',
      align: 'center',
      render: (row) => <span className="num-tabular font-medium">{row.subscriptions_count || 0}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customer & Learner Directory"
        subtitle="Manage student enrollments, corporate training accounts, and billing addresses"
        breadcrumbs={['Home', 'Customers']}
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add New Customer
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        error={error}
        onRetry={() => fetchCustomers(pagination.page)}
        pagination={pagination}
        onPageChange={(newPage) => fetchCustomers(newPage)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, email, or company..."
        emptyTitle="No customers registered yet"
        emptyDescription="Add your first student or corporate customer profile to begin issuing course subscriptions."
        emptyActionLabel="Add Customer"
        onEmptyAction={() => setIsModalOpen(true)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer / Organization"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateCustomer} loading={submitting}>
              Save Customer Profile
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomer}>
          <Input
            label="Full Name / Representative"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Rahul Sharma"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="rahul@example.com"
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input
              label="Company / Institute (Optional)"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="e.g. IIT Bombay / Infosys"
            />
            <Select
              label="Payment Terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              options={[
                { value: 'IMMEDIATE', label: 'Immediate Payment' },
                { value: 'NET_15', label: 'Net 15 Days' },
                { value: 'NET_30', label: 'Net 30 Days' },
              ]}
            />
          </div>

          <Input
            label="Billing Address"
            value={formData.billing_address}
            onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
            placeholder="Street address, City, Pincode"
          />
        </form>
      </Modal>
    </div>
  );
};

export default CustomerList;

