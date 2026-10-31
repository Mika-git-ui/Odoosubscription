import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import paymentApi from '../../api/payments';
import { Receipt, RotateCcw } from 'lucide-react';

export const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, page_size: 15, total: 0, total_pages: 1 });

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentApi.list({
        page,
        page_size: pagination.page_size,
        search: searchTerm || undefined,
      });
      setPayments(response.data || []);
      if (response.pagination) setPagination(response.pagination);
    } catch (err) {
      setError(err.message || 'Unable to retrieve payment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, [searchTerm]);

  const handleReverse = async (id) => {
    const reason = window.prompt('Please provide a reason for reversing this payment:');
    if (!reason) return;
    try {
      await paymentApi.reverse(id, reason);
      alert('Payment reversed successfully.');
      fetchPayments(pagination.page);
    } catch (err) {
      alert(`Reversal failed: ${err.message}`);
    }
  };

  const columns = [
    {
      header: 'Payment #',
      key: 'payment_number',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.payment_number || `PAY-${row.id}`}</span>,
    },
    {
      header: 'Invoice #',
      key: 'invoice_number',
      render: (row) => row.invoice_number || '—',
    },
    {
      header: 'Customer',
      key: 'customer_name',
      render: (row) => row.customer_name || 'Customer Account',
    },
    {
      header: 'Amount Paid',
      key: 'amount',
      align: 'right',
      render: (row) => <span className="currency-inr font-semibold" style={{ color: '#059669' }}>{formatCurrency(row.amount)}</span>,
    },
    {
      header: 'Method',
      key: 'payment_method',
      render: (row) => <span className="badge badge-info">{row.payment_method || 'UPI'}</span>,
    },
    {
      header: 'Date & Time',
      key: 'payment_date',
      render: (row) => formatDateTime(row.payment_date || row.created_at),
    },
    {
      header: 'Reference / Note',
      key: 'reference_note',
      render: (row) => row.reference_note || row.transaction_ref || '—',
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            variant="outline"
            size="sm"
            icon={Receipt}
            onClick={() => window.alert(`Receipt for ${row.payment_number || row.id}\nAmount: ${formatCurrency(row.amount)}`)}
          >
            Receipt
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={RotateCcw}
            onClick={() => handleReverse(row.id)}
            title="Reverse Payment"
          >
            Reverse
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payment History & Ledger"
        subtitle="Track incoming cash, wire transfers, UPI, and card collections against invoices"
        breadcrumbs={['Home', 'Payments']}
      />

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        error={error}
        onRetry={() => fetchPayments(pagination.page)}
        pagination={pagination}
        onPageChange={(p) => fetchPayments(p)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search payments by #, customer, or transaction note..."
        emptyTitle="No payments recorded"
        emptyDescription="When payments arrive via UPI, bank transfer, or card, record them from the Invoices view."
      />
    </div>
  );
};

export default PaymentList;

