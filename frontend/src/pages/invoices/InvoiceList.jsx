import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import invoiceApi from '../../api/invoices';
import paymentApi from '../../api/payments';
import { Check, XCircle, CreditCard, Printer, FileText } from 'lucide-react';

export const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, page_size: 15, total: 0, total_pages: 1 });

  // Record Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'UPI',
    reference_note: '',
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Invoice Print / Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState(null);

  const fetchInvoices = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoiceApi.list({
        page,
        page_size: pagination.page_size,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setInvoices(response.data || []);
      if (response.pagination) setPagination(response.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, [statusFilter, searchTerm]);

  // Open Record Payment Modal
  const handleOpenPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    setPaymentData({
      amount: inv.balance_due ? String(inv.balance_due) : String(inv.total_amount),
      payment_method: 'UPI',
      reference_note: `Settlement for ${inv.invoice_number}`,
    });
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setRecordingPayment(true);
    try {
      await paymentApi.recordForInvoice(selectedInvoice.id, {
        amount: parseFloat(paymentData.amount) || 0,
        payment_method: paymentData.payment_method,
        reference_note: paymentData.reference_note,
      });
      setPaymentModalOpen(false);
      fetchInvoices(pagination.page);
    } catch (err) {
      alert(`Payment recording failed: ${err.message}`);
    } finally {
      setRecordingPayment(false);
    }
  };

  // State transitions
  const handleConfirmInvoice = async (id) => {
    try {
      await invoiceApi.confirm(id);
      fetchInvoices(pagination.page);
    } catch (err) {
      alert(`Confirm failed: ${err.message}`);
    }
  };

  const handleCancelInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await invoiceApi.cancel(id);
      fetchInvoices(pagination.page);
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  // View Details
  const handleViewInvoice = async (id) => {
    try {
      const response = await invoiceApi.getById(id);
      setInvoiceDetail(response.data || response);
      setDetailModalOpen(true);
    } catch (err) {
      alert(`Failed to load invoice details: ${err.message}`);
    }
  };

  const columns = [
    {
      header: 'Invoice #',
      key: 'invoice_number',
      render: (row) => (
        <span
          style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
          onClick={() => handleViewInvoice(row.id)}
        >
          {row.invoice_number || `INV-${row.id}`}
        </span>
      ),
    },
    {
      header: 'Customer',
      key: 'customer_name',
      render: (row) => row.customer_name || 'Customer Account',
    },
    {
      header: 'Issue Date',
      key: 'issue_date',
      render: (row) => formatDate(row.issue_date),
    },
    {
      header: 'Due Date',
      key: 'due_date',
      render: (row) => formatDate(row.due_date),
    },
    {
      header: 'Total Amount',
      key: 'total_amount',
      align: 'right',
      render: (row) => <span className="currency-inr font-medium">{formatCurrency(row.total_amount)}</span>,
    },
    {
      header: 'Paid Amount',
      key: 'amount_paid',
      align: 'right',
      render: (row) => <span className="currency-inr">{formatCurrency(row.amount_paid || 0)}</span>,
    },
    {
      header: 'Balance Due',
      key: 'balance_due',
      align: 'right',
      render: (row) => (
        <span
          className="currency-inr font-semibold"
          style={{ color: row.balance_due > 0 ? '#dc2626' : '#059669' }}
        >
          {formatCurrency(row.balance_due ?? row.total_amount)}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => {
        const s = (row.status || '').toUpperCase();
        return (
          <div style={{ display: 'flex', gap: '4px' }}>
            {s === 'DRAFT' && (
              <Button variant="secondary" size="sm" icon={Check} onClick={() => handleConfirmInvoice(row.id)} title="Confirm Invoice">
                Confirm
              </Button>
            )}
            {s === 'CONFIRMED' && (row.balance_due > 0 || row.balance_due === undefined) && (
              <Button variant="primary" size="sm" icon={CreditCard} onClick={() => handleOpenPaymentModal(row)} title="Record Payment">
                Pay
              </Button>
            )}
            {s !== 'PAID' && s !== 'CANCELLED' && (
              <Button variant="danger" size="sm" icon={XCircle} onClick={() => handleCancelInvoice(row.id)} title="Cancel Invoice">
                Cancel
              </Button>
            )}
            <Button variant="outline" size="sm" icon={FileText} onClick={() => handleViewInvoice(row.id)} title="View / Print">
              View
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoice Management"
        subtitle="Review issued invoices, verify automated tax/discount calculations, and record payments"
        breadcrumbs={['Home', 'Invoices']}
      />

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        error={error}
        onRetry={() => fetchInvoices(pagination.page)}
        pagination={pagination}
        onPageChange={(p) => fetchInvoices(p)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search invoices by number or customer..."
        emptyTitle="No invoices found"
        emptyDescription="Invoices will be automatically created on billing day from active subscriptions."
        headerActions={
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', fontSize: 'var(--font-size-xs)' }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed / Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        }
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Record Payment for ${selectedInvoice?.invoice_number || 'Invoice'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentModalOpen(false)} disabled={recordingPayment}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRecordPayment} loading={recordingPayment}>
              Confirm Payment Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordPayment}>
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--bg-surface-alt)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Invoice Total:</span>
              <strong className="currency-inr">{formatCurrency(selectedInvoice?.total_amount || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
              <span>Remaining Balance:</span>
              <strong className="currency-inr">{formatCurrency(selectedInvoice?.balance_due ?? selectedInvoice?.total_amount ?? 0)}</strong>
            </div>
          </div>

          <Input
            label="Payment Amount (₹)"
            type="number"
            step="0.01"
            value={paymentData.amount}
            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            placeholder="0.00"
            required
          />

          <Select
            label="Payment Method"
            value={paymentData.payment_method}
            onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
            options={[
              { value: 'UPI', label: 'UPI (GPay, PhonePe, Paytm)' },
              { value: 'BANK_TRANSFER', label: 'Bank Wire / NEFT / IMPS' },
              { value: 'CARD', label: 'Credit / Debit Card' },
              { value: 'CASH', label: 'Cash / Offline' },
            ]}
            required
          />

          <Input
            label="Reference Note / Transaction ID"
            value={paymentData.reference_note}
            onChange={(e) => setPaymentData({ ...paymentData, reference_note: e.target.value })}
            placeholder="e.g. UTR-9823472019"
          />
        </form>
      </Modal>

      {/* Invoice Detail / Printable View Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Invoice ${invoiceDetail?.invoice_number || ''}`}
        maxWidth="640px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
              Close
            </Button>
            <Button variant="outline" icon={Printer} onClick={() => window.print()}>
              Print Invoice
            </Button>
          </>
        }
      >
        {invoiceDetail && (
          <div style={{ fontSize: 'var(--font-size-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <strong style={{ fontSize: 'var(--font-size-lg)', color: 'var(--primary)' }}>Revora</strong>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Subscription Management System</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={invoiceDetail.status} />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Issue: {formatDate(invoiceDetail.issue_date)}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span className="form-label">Billed To</span>
              <div style={{ fontWeight: 600 }}>{invoiceDetail.customer_name || 'Customer Account'}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{invoiceDetail.billing_address || 'No address provided'}</div>
            </div>

            {/* Line items table */}
            <div className="table-responsive" style={{ marginBottom: '1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoiceDetail.lines || [
                    {
                      description: 'Python Masterclass - Intermediate Level',
                      quantity: 1,
                      unit_price: 1999,
                      line_total: 1999,
                    },
                  ]).map((line, idx) => (
                    <tr key={idx}>
                      <td>{line.description}</td>
                      <td>{line.quantity}</td>
                      <td style={{ textAlign: 'right' }} className="currency-inr">{formatCurrency(line.unit_price)}</td>
                      <td style={{ textAlign: 'right' }} className="currency-inr font-medium">{formatCurrency(line.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div style={{ width: '100%', maxWidth: '240px', marginLeft: 'auto', fontSize: 'var(--font-size-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Subtotal:</span>
                <span className="currency-inr">{formatCurrency(invoiceDetail.subtotal || invoiceDetail.total_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Tax (GST 18%):</span>
                <span className="currency-inr">{formatCurrency(invoiceDetail.tax_amount || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--border-default)', fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
                <span>Total:</span>
                <span className="currency-inr">{formatCurrency(invoiceDetail.total_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#059669' }}>
                <span>Amount Paid:</span>
                <span className="currency-inr">{formatCurrency(invoiceDetail.amount_paid || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 700, color: invoiceDetail.balance_due > 0 ? '#dc2626' : undefined }}>
                <span>Balance Due:</span>
                <span className="currency-inr">{formatCurrency(invoiceDetail.balance_due || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoiceList;

