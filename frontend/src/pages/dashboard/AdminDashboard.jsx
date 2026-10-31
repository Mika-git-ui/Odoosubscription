import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  Info,
  MoreHorizontal,
  Plus,
  Download,
  Trash2,
  ChevronDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
} from 'lucide-react';
import CashFlowChart from '../../components/dashboard/CashFlowChart';
import invoiceApi from '../../api/invoices';
import reportApi from '../../api/reports';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Default fallback invoices matching reference screenshot
  const initialInvoices = [
    {
      id: '8FB28438-0001',
      invoice_number: '8FB28438-0001',
      customer_name: 'Robert Baratheon',
      status: 'PAID',
      status_label: 'Paid',
      issue_date: '2026-05-30',
      due_date: '2026-07-11',
      total_amount: 928.41,
    },
    {
      id: 'ECF17C97-0017',
      invoice_number: 'ECF17C97-0017',
      customer_name: 'Arlene McCoy',
      status: 'OVERDUE',
      status_label: 'Overdue by 1 day',
      issue_date: '2026-06-21',
      due_date: '2026-09-23',
      total_amount: 396.84,
    },
    {
      id: 'FA083B17-0017',
      invoice_number: 'FA083B17-0017',
      customer_name: 'Devon Lane',
      status: 'PENDING',
      status_label: 'Due in 14 days',
      issue_date: '2026-07-11',
      due_date: '2026-03-04',
      total_amount: 490.51,
    },
    {
      id: 'FA083B17-0018',
      invoice_number: 'FA083B17-0018',
      customer_name: 'Ronald Richards',
      status: 'PARTIALLY_PAID',
      status_label: 'Partially Paid',
      issue_date: '2026-04-21',
      due_date: '2026-05-27',
      total_amount: 601.13,
    },
  ];

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await invoiceApi.list({ limit: 10 });
        if (res && res.data && res.data.length > 0) {
          setInvoices(res.data);
        } else {
          setInvoices(initialInvoices);
        }
      } catch (err) {
        // Fallback gracefully to reference preview data
        setInvoices(initialInvoices);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices(invoices.map((inv) => inv.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status, label) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return <span className="badge badge-paid">{label || 'Paid'}</span>;
      case 'OVERDUE':
        return <span className="badge badge-overdue">{label || 'Overdue'}</span>;
      case 'PENDING':
        return <span className="badge badge-pending">{label || 'Due in 14 days'}</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-partial">{label || 'Partially Paid'}</span>;
      default:
        return <span className="badge badge-draft">{label || status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header matching Reference Screenshot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#20242D',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Invoice
        </h1>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAECF0',
              borderRadius: '6px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <span>{dateRange}</span>
            <ChevronDown size={14} color="#6B7280" />
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Strip matching Reference Screenshot */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '1.25rem',
        }}
      >
        {/* Card 1: Total Invoices */}
        <div
          className="metric-card"
          style={{ gridColumn: 'span 3', minHeight: '124px' }}
        >
          <div className="metric-header">
            <div
              className="metric-icon-circle"
              style={{ backgroundColor: '#F3E8FF', color: '#7952CC' }}
            >
              <FileText size={15} />
            </div>
            <span>Total Invoices</span>
          </div>
          <div className="metric-value">₹152.9k</div>
          <div className="metric-trend" style={{ color: '#16A36A' }}>
            <ArrowUpRight size={13} />
            <span>+1.50 /month</span>
          </div>
        </div>

        {/* Card 2: Paid Invoices */}
        <div
          className="metric-card"
          style={{ gridColumn: 'span 3', minHeight: '124px' }}
        >
          <div className="metric-header">
            <div
              className="metric-icon-circle"
              style={{ backgroundColor: '#ECFDF5', color: '#16A36A' }}
            >
              <CheckCircle2 size={15} />
            </div>
            <span>Paid Invoices</span>
          </div>
          <div className="metric-value">₹109.3k</div>
          <div className="metric-trend" style={{ color: '#16A36A' }}>
            <ArrowDownRight size={13} />
            <span>+0.47 /month</span>
          </div>
        </div>

        {/* Card 3: Pending Invoices */}
        <div
          className="metric-card"
          style={{ gridColumn: 'span 3', minHeight: '124px' }}
        >
          <div className="metric-header">
            <div
              className="metric-icon-circle"
              style={{ backgroundColor: '#FFFBEB', color: '#E9A23B' }}
            >
              <Clock size={15} />
            </div>
            <span>Pending Invoices</span>
          </div>
          <div className="metric-value">₹43k</div>
          <div className="metric-trend" style={{ color: '#16A36A' }}>
            <ArrowUpRight size={13} />
            <span>+0.75 /month</span>
          </div>
        </div>

        {/* Card 4: Total Receivables with Progress Bar */}
        <div
          className="metric-card"
          style={{ gridColumn: 'span 3', minHeight: '124px', justifyContent: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#20242D' }}>
                Total Receivables
              </span>
              <Info size={13} color="#9CA3AF" />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#87909E', marginTop: '2px' }}>
            Total Unpaid Invoices ₹43,078
          </span>

          {/* Progress Bar */}
          <div className="receivables-progress">
            <div className="receivables-progress-fill" style={{ width: '62%' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#87909E', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                CURRENT
              </span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#20242D' }}>
                ₹109.1k
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.65rem', color: '#87909E', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                OVERDUE
              </span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#20242D' }}>
                ₹65k
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Cash Flow Area Section */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '1.5rem',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ gridColumn: 'span 9' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#20242D', margin: 0 }}>
                Cash Flow
              </h2>
              <Info size={14} color="#9CA3AF" />
            </div>
          </div>
          <CashFlowChart />
        </div>

        {/* Right Metric Stack inside Cash Flow Card */}
        <div
          style={{
            gridColumn: 'span 3',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: '1.5rem',
            borderLeft: '1px solid #EAECF0',
            gap: '1.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#87909E' }}>
              Cash as on 04/01/2026
            </span>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#20242D', marginTop: '4px' }}>
              ₹691.9k
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#16A36A', fontWeight: 500 }}>
              Incoming
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#20242D', marginTop: '2px' }}>
              ₹106.6k
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#E05252', fontWeight: 500 }}>
              Outgoing
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#20242D', marginTop: '2px' }}>
              ₹798.5k
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: All Invoices Table matching Reference Screenshot */}
      <div className="card" style={{ padding: 0 }}>
        {/* Table Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #EAECF0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#20242D', margin: 0 }}>
              All Invoices
            </h2>
            <Info size={14} color="#9CA3AF" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/invoices')}
              style={{
                backgroundColor: '#7952CC',
                color: '#FFFFFF',
                borderRadius: '6px',
                padding: '0.45rem 0.95rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(121, 82, 204, 0.25)',
              }}
            >
              <Plus size={15} />
              <span>+ New Invoice</span>
            </button>

            <button
              type="button"
              style={{
                background: 'none',
                border: '1px solid #EAECF0',
                borderRadius: '6px',
                padding: '0.45rem',
                cursor: 'pointer',
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      invoices.length > 0 &&
                      selectedInvoices.length === invoices.length
                    }
                    style={{ cursor: 'pointer', accentColor: '#7952CC' }}
                  />
                </th>
                <th>Invoice Number</th>
                <th>Customer Name</th>
                <th>Status</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th style={{ textAlign: 'center' }}>Download</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(inv.id)}
                      onChange={() => handleSelectOne(inv.id)}
                      style={{ cursor: 'pointer', accentColor: '#7952CC' }}
                    />
                  </td>
                  <td>
                    <span
                      className="invoice-link"
                      onClick={() => navigate(`/invoices`)}
                    >
                      {inv.invoice_number || inv.id}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {inv.customer_name || 'Student Account'}
                  </td>
                  <td>{getStatusBadge(inv.status, inv.status_label)}</td>
                  <td style={{ color: '#6B7280' }}>
                    {inv.issue_date || '5/30/26'}
                  </td>
                  <td style={{ color: '#6B7280' }}>
                    {inv.due_date || '7/11/26'}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatCurrency(inv.total_amount || 0)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6B7280',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Download Invoice PDF"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9CA3AF',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Archive Invoice"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flagship Python Course Tiers Banner */}
      <div
        className="card"
        style={{
          border: '1px solid #EAECF0',
          backgroundColor: '#FFFFFF',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#7952CC" />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#20242D', margin: 0 }}>
              Brightloop Python Masterclass — Active Curriculum Tiers
            </h3>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#7952CC',
              backgroundColor: '#F3E8FF',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            ₹ Recurring Subscriptions
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}
        >
          {/* Basic */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #EAECF0',
              backgroundColor: '#FAFAFA',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Basic Level</span>
              <span style={{ fontWeight: 700, color: '#7952CC', fontSize: '0.875rem' }}>
                ₹999 / mo
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '6px 0 10px' }}>
              Core Syntax, Variables, Control Flow, Functions & OOP Basics.
            </p>
            <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>
              Enrolled: <strong className="num-tabular">12 Learners</strong>
            </div>
          </div>

          {/* Intermediate */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #D8B4FE',
              backgroundColor: '#FAF5FF',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Intermediate Level</span>
              <span style={{ fontWeight: 700, color: '#7952CC', fontSize: '0.875rem' }}>
                ₹1,999 / mo
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '6px 0 10px' }}>
              Data Structures, Algorithms, FastAPI REST APIs & Async I/O (+₹1,000).
            </p>
            <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>
              Enrolled: <strong className="num-tabular">24 Learners</strong>
            </div>
          </div>

          {/* Advanced */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #EAECF0',
              backgroundColor: '#FAFAFA',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Advanced Level</span>
              <span style={{ fontWeight: 700, color: '#7952CC', fontSize: '0.875rem' }}>
                ₹3,499 / mo
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '6px 0 10px' }}>
              Distributed Systems, Concurrency, Performance Tuning & ML (+₹2,500).
            </p>
            <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>
              Enrolled: <strong className="num-tabular">8 Learners</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
