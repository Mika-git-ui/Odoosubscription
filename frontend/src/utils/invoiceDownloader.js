import { formatCurrency, formatDate } from './formatters';

/**
 * Downloads a professional REVORA Tax Invoice file directly to the user's browser.
 * Also opens the system print dialogue so the user can immediately "Save as PDF".
 */
export const downloadInvoice = (invoice) => {
  if (!invoice) return;

  const invNumber = invoice.invoice_number || invoice.id || 'INV-0001';
  const customerName = invoice.customer_name || 'Enrolled Student';
  const issueDate = invoice.issue_date || new Date().toLocaleDateString();
  const dueDate = invoice.due_date || new Date(Date.now() + 14 * 86400000).toLocaleDateString();
  const totalAmount = invoice.total_amount || 999;
  const status = (invoice.status || 'PAID').toUpperCase();

  const isPaid = status === 'PAID';
  const statusBg = isPaid ? '#ECFDF5' : '#FFFBEB';
  const statusColor = isPaid ? '#16A36A' : '#E9A23B';

  const subtotal = (totalAmount / 1.18).toFixed(2);
  const gst = (totalAmount - subtotal).toFixed(2);

  const invoiceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invNumber} - Revora</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #20242D;
      background: #FFFFFF;
      margin: 0;
      padding: 40px;
    }
    .invoice-card {
      max-width: 780px;
      margin: 0 auto;
      border: 1px solid #EAECF0;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #F3F4F6;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #7952CC 0%, #9F7AEA 100%);
      color: #FFF;
      font-weight: 800;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand h1 {
      margin: 0;
      font-size: 22px;
      color: #111827;
      letter-spacing: -0.02em;
    }
    .brand span {
      font-size: 11px;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-status {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 12px;
      background: ${statusBg};
      color: ${statusColor};
      text-transform: uppercase;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .info-block h3 {
      font-size: 11px;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 6px;
    }
    .info-block p {
      margin: 0;
      font-weight: 600;
      color: #111827;
      font-size: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #F9FAFB;
      text-align: left;
      padding: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #4B5563;
      border-bottom: 1px solid #E5E7EB;
    }
    td {
      padding: 14px 12px;
      border-bottom: 1px solid #F3F4F6;
      font-size: 14px;
    }
    .totals {
      width: 260px;
      margin-left: auto;
      font-size: 14px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      color: #4B5563;
    }
    .totals-row.grand-total {
      border-top: 2px solid #111827;
      margin-top: 10px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }
    .footer {
      border-top: 1px solid #E5E7EB;
      padding-top: 24px;
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
    }
    @media print {
      body { padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="brand">
        <div class="logo-badge">R</div>
        <div>
          <h1>Revora</h1>
          <span>Subscription Platform & Masterclass</span>
        </div>
      </div>
      <div>
        <div style="font-size: 18px; font-weight: 700; color: #111827; text-align: right; margin-bottom: 6px;">
          TAX INVOICE
        </div>
        <div style="text-align: right;">
          <span class="badge-status">${status}</span>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h3>Billed To</h3>
        <p>${customerName}</p>
        <span style="font-size: 13px; color: #6B7280;">Student / Subscriber Account</span>
      </div>
      <div class="info-block" style="text-align: right;">
        <h3>Invoice Details</h3>
        <p>Invoice #: ${invNumber}</p>
        <span style="font-size: 13px; color: #6B7280;">Issue Date: ${issueDate}</span><br>
        <span style="font-size: 13px; color: #6B7280;">Due Date: ${dueDate}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Interval</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Python Masterclass Subscription</strong><br>
            <span style="font-size: 12px; color: #6B7280;">Revora Engineering Curriculum & Platform Access</span>
          </td>
          <td style="text-align: center;">Monthly</td>
          <td style="text-align: right; font-weight: 600;">₹${parseFloat(subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal (Net):</span>
        <span>₹${parseFloat(subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="totals-row">
        <span>GST (18%):</span>
        <span>₹${parseFloat(gst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="totals-row grand-total">
        <span>Total Due:</span>
        <span style="color: #7952CC;">₹${parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing <strong>Revora</strong> for your software and learning subscriptions.</p>
      <p style="font-size: 11px;">Powered by Revora FastAPI & MySQL Architecture &bull; Official Digital Tax Receipt</p>
    </div>
  </div>

  <script>
    // Automatically trigger system print dialog when opened
    window.onload = function() {
      // Delay slightly for render
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
  `;

  // 1. Download file blob to user's computer
  const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Revora_Invoice_${invNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 2. Open printable view in new window for direct "Save as PDF" / Print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  }

  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export default downloadInvoice;
