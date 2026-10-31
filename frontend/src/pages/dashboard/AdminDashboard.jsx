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
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  FileSpreadsheet,
  Printer,
  RefreshCw,
} from 'lucide-react';
import CashFlowChart from '../../components/dashboard/CashFlowChart';
import SpotlightCard from '../../components/common/SpotlightCard';
import Dropdown from '../../components/common/Dropdown';
import invoiceApi from '../../api/invoices';
import { formatCurrency } from '../../utils/formatters';

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
      issue_date: '5/30/26',
      due_date: '7/11/26',
      total_amount: 928.41,
    },
    {
      id: 'ECF17C97-0017',
      invoice_number: 'ECF17C97-0017',
      customer_name: 'Arlene McCoy',
      status: 'OVERDUE',
      status_label: 'Overdue by 1 day',
      issue_date: '6/21/26',
      due_date: '9/23/26',
      total_amount: 396.84,
    },
    {
      id: 'FA083B17-0017',
      invoice_number: 'FA083B17-0017',
      customer_name: 'Devon Lane',
      status: 'PENDING',
      status_label: 'Due in 14 days',
      issue_date: '7/11/26',
      due_date: '3/4/26',
      total_amount: 490.51,
    },
    {
      id: 'FA083B17-0018',
      invoice_number: 'FA083B17-0018',
      customer_name: 'Ronald Richards',
      status: 'PARTIALLY_PAID',
      status_label: 'Partially Paid',
      issue_date: '4/21/26',
      due_date: '5/27/26',
      total_amount: 601.13,
    },
  ];

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
      setInvoices(initialInvoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        return <span className="badge badge-overdue">{label || 'Overdue by 1 day'}</span>;
      case 'PENDING':
        return <span className="badge badge-pending">{label || 'Due in 14 days'}</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-partial">{label || 'Partially Paid'}</span>;
      default:
        return <span className="badge badge-draft">{label || status}</span>;
    }
  };

  // Date Filter Dropdown Options
  const dateRangeOptions = [
    { id: 'today', label: 'Today', onClick: () => setDateRange('Today'), active: dateRange === 'Today' },
    { id: 'week', label: 'Last 7 Days', onClick: () => setDateRange('Last 7 Days'), active: dateRange === 'Last 7 Days' },
    { id: 'month', label: 'Last 30 Days', onClick: () => setDateRange('Last 30 Days'), active: dateRange === 'Last 30 Days' },
    { id: 'quarter', label: 'This Quarter', onClick: () => setDateRange('This Quarter'), active: dateRange === 'This Quarter' },
    { id: 'year', label: 'Year to Date', onClick: () => setDateRange('Year to Date'), active: dateRange === 'Year to Date' },
  ];

  // Cash Flow Menu Items
  const cashFlowMenuItems = [
    { id: 'export-csv', label: 'Export Cash Flow (CSV)', icon: FileSpreadsheet, onClick: () => alert('Exporting Cash Flow to CSV...') },
    { id: 'print', label: 'Print Statement', icon: Printer, onClick: () => window.print() },
    { divider: true },
    { id: 'refresh', label: 'Refresh Analytics', icon: RefreshCw, onClick: () => fetchInvoices() },
  ];

  // Invoices Table Menu Items
  const invoiceMenuItems = [
    { id: 'export-invoices', label: 'Export All Invoices (CSV)', icon: FileSpreadsheet, onClick: () => alert('Exporting all invoices...') },
    { id: 'print-table', label: 'Print Ledger', icon: Printer, onClick: () => window.print() },
    { divider: true },
    { id: 'refresh-inv', label: 'Refresh Table', icon: RefreshCw, onClick: () => fetchInvoices() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header matching Reference Screenshot */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Invoice
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Subscription receivables, cashflow analytics & Python learner invoices
          </p>
        </div>

        {/* Functional Date Range Dropdown */}
        <Dropdown
          trigger={
            <button type="button" className="dropdown-trigger">
              <span>{dateRange}</span>
              <ChevronDown size={14} color="var(--text-secondary)" />
            </button>
          }
          items={dateRangeOptions}
          align="right"
          width="170px"
        />
      </div>

      {/* 4 Metric Cards Strip with Mouse Spotlight Tracking */}
      <div className="metrics-grid">
        {/* Card 1: Total Invoices */}
        <SpotlightCard className="metric-card" style={{ minHeight: '124px' }}>
          <div className="metric-header">
            <div
              className="metric-icon-circle"
              style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)' }}
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
        </SpotlightCard>

        {/* Card 2: Paid Invoices */}
        <SpotlightCard className="metric-card" style={{ minHeight: '124px' }}>
          <div className="metric-header">
            <div
              className="metric-icon-circle"
              style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)' }}
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
        </SpotlightCard>

        {/* Card 3: Pending Invoices */}
        <SpotlightCard className="metric-card" style={{ minHeight: '124px' }}>
          <div className="metric-header">
            <div
              className="metric-icon-circle"
              style={{ backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }}
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
        </SpotlightCard>

        {/* Card 4: Total Receivables with Progress Bar */}
        <SpotlightCard className="metric-card" style={{ minHeight: '124px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Total Receivables
              </span>
              <Info size={13} color="var(--text-muted)" />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Total Unpaid Invoices ₹43,078
          </span>

          {/* Progress Bar */}
          <div className="receivables-progress">
            <div className="receivables-progress-fill" style={{ width: '62%' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                CURRENT
              </span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                ₹109.1k
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                OVERDUE
              </span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                ₹65k
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* Middle Cash Flow Area Section with Spotlight */}
      <SpotlightCard className="cashflow-grid" style={{ padding: '1.25rem 1.5rem' }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Cash Flow
              </h2>
              <Info size={14} color="var(--text-muted)" />
            </div>

            <Dropdown
              trigger={
                <button type="button" className="btn-icon" title="Cash flow actions">
                  <MoreHorizontal size={16} />
                </button>
              }
              items={cashFlowMenuItems}
              align="right"
              width="210px"
            />
          </div>
          <CashFlowChart />
        </div>

        {/* Right Metric Stack inside Cash Flow Card */}
        <div
          className="cashflow-stats"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: '1.5rem',
            borderLeft: '1px solid var(--border-default)',
            gap: '1.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Cash as on 04/01/2026
            </span>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
              ₹691.9k
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#16A36A', fontWeight: 500 }}>
              Incoming
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              ₹106.6k
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#E05252', fontWeight: 500 }}>
              Outgoing
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              ₹798.5k
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Bottom Section: All Invoices Table matching Reference Screenshot */}
      <div className="card" style={{ padding: 0 }}>
        {/* Table Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              All Invoices
            </h2>
            <Info size={14} color="var(--text-muted)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/invoices')}
              style={{
                borderRadius: '6px',
                padding: '0.45rem 0.95rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <Plus size={15} />
              <span>+ New Invoice</span>
            </button>

            <Dropdown
              trigger={
                <button type="button" className="btn-icon" title="Table options">
                  <MoreHorizontal size={16} />
                </button>
              }
              items={invoiceMenuItems}
              align="right"
              width="210px"
            />
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
                  <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                    {inv.customer_name || 'Student Account'}
                  </td>
                  <td>{getStatusBadge(inv.status, inv.status_label)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {inv.issue_date || '5/30/26'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {inv.due_date || '7/11/26'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
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
                          color: 'var(--text-secondary)',
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
                          color: 'var(--text-muted)',
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

      {/* Flagship Python Course Tiers Banner with Spotlight */}
      <SpotlightCard style={{ padding: '1.25rem 1.5rem' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Brightloop Python Masterclass — Active Curriculum Tiers
            </h3>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--primary)',
              backgroundColor: 'var(--primary-subtle)',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            ₹ Recurring Subscriptions
          </span>
        </div>

        <div className="course-tiers-grid">
          {/* Basic */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface-alt)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>Basic Level</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem' }}>
                ₹999 / mo
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 10px' }}>
              Core Syntax, Variables, Control Flow, Functions & OOP Basics.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 500 }}>
              Enrolled: <strong className="num-tabular">12 Learners</strong>
            </div>
          </div>

          {/* Intermediate */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--primary-border)',
              backgroundColor: 'var(--primary-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>Intermediate Level</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem' }}>
                ₹1,999 / mo
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 10px' }}>
              Data Structures, Algorithms, FastAPI REST APIs & Async I/O (+₹1,000).
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 500 }}>
              Enrolled: <strong className="num-tabular">24 Learners</strong>
            </div>
          </div>

          {/* Advanced */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface-alt)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>Advanced Level</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem' }}>
                ₹3,499 / mo
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 10px' }}>
              Distributed Systems, Concurrency, Performance Tuning & ML (+₹2,500).
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 500 }}>
              Enrolled: <strong className="num-tabular">8 Learners</strong>
            </div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
};

export default AdminDashboard;
