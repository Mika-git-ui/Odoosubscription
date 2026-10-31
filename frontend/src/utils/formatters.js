/**
 * REVORA FINANCIAL & DATA FORMATTING UTILITIES
 * Enforces consistent INR (₹) formatting and standardized date/status representations.
 */

/**
 * Formats a numeric amount into Indian Rupee (INR) currency format.
 * Example: 14500 -> "₹14,500.00"
 * @param {number|string} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

/**
 * Formats an ISO date string into a clean, readable localized date.
 * Example: "2026-11-01T00:00:00Z" -> "01 Nov 2026"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Formats an ISO date string with time.
 * Example: "01 Nov 2026, 10:30 AM"
 * @param {string|Date} dateInput
 * @returns {string}
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Maps subscription and invoice status strings to design-system badge variants.
 * @param {string} status
 * @returns {{ label: string, variant: 'success'|'warning'|'danger'|'info'|'neutral' }}
 */
export const getStatusConfig = (status) => {
  const normalized = (status || '').toUpperCase();
  switch (normalized) {
    case 'ACTIVE':
    case 'PAID':
    case 'CONFIRMED':
      return { label: normalized, variant: 'success' };
    case 'PENDING':
    case 'QUOTATION':
    case 'DRAFT':
    case 'CLEANING':
      return { label: normalized, variant: 'warning' };
    case 'OVERDUE':
    case 'CANCELLED':
    case 'CLOSED':
    case 'FAILED':
      return { label: normalized, variant: 'danger' };
    case 'PAUSED':
    case 'EN_ROUTE':
      return { label: normalized, variant: 'info' };
    default:
      return { label: normalized || 'UNKNOWN', variant: 'neutral' };
  }
};

