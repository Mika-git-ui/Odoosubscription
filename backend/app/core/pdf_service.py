import io
from decimal import Decimal
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_invoice_pdf(invoice, customer, subscription, payments, lines) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#1e293b"),
        fontName="Helvetica-Bold"
    )
    subtitle_style = ParagraphStyle(
        "InvoiceSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b")
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading3"],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold"
    )
    body_style = ParagraphStyle(
        "InvoiceBody",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )
    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontSize=9,
        leading=11,
        fontName="Helvetica-Bold",
        textColor=colors.white
    )

    elements = []

    # Header: Brand & Invoice info
    status_color = "#16a34a" if invoice.status == "paid" else ("#2563eb" if invoice.status == "confirmed" else "#64748b")
    header_data = [
        [
            Paragraph("<b>BRIGHTLOOP</b><br/><font color='#64748b' size=9>Subscription Management</font>", title_style),
            Paragraph(
                f"<b>INVOICE</b><br/>"
                f"<font color='{status_color}' size=12><b>{invoice.status.upper()}</b></font><br/>"
                f"<b>Invoice #:</b> {invoice.invoice_number}<br/>"
                f"<b>Date:</b> {invoice.issue_date}<br/>"
                f"<b>Due Date:</b> {invoice.due_date or 'N/A'}",
                subtitle_style
            )
        ]
    ]
    header_table = Table(header_data, colWidths=[4.0 * inch, 3.5 * inch])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=15))

    # Customer and Subscription Information
    customer_info = (
        f"<b>Billed To:</b><br/>"
        f"<b>{customer.name if customer else 'Valued Customer'}</b><br/>"
        f"Email: {customer.email if customer else 'N/A'}<br/>"
        f"Phone: {customer.phone or 'N/A' if customer else 'N/A'}<br/>"
        f"Address: {customer.address or 'N/A' if customer else 'N/A'}"
    )

    plan_name = subscription.plan.name if (subscription and subscription.plan) else "Standard Plan"
    sub_info = (
        f"<b>Subscription Details:</b><br/>"
        f"Subscription #: {subscription.subscription_number if subscription else 'N/A'}<br/>"
        f"Plan: {plan_name}<br/>"
        f"Billing Period: {invoice.billing_period_start} to {invoice.billing_period_end}<br/>"
        f"Terms: {subscription.payment_terms if subscription else 'Due on receipt'}"
    )

    info_data = [[Paragraph(customer_info, body_style), Paragraph(sub_info, body_style)]]
    info_table = Table(info_data, colWidths=[4.0 * inch, 3.5 * inch])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # Line Items Table
    table_data = [[
        Paragraph("Item / Product", table_header_style),
        Paragraph("Qty", table_header_style),
        Paragraph("Unit Price", table_header_style),
        Paragraph("Tax Rate", table_header_style),
        Paragraph("Line Tax", table_header_style),
        Paragraph("Line Total", table_header_style),
    ]]

    for line in lines:
        table_data.append([
            Paragraph(line.product_name, body_style),
            Paragraph(str(line.quantity), body_style),
            Paragraph(f"${Decimal(str(line.unit_price)):.2f}", body_style),
            Paragraph(f"{Decimal(str(line.tax_rate or 0)):.1f}%", body_style),
            Paragraph(f"${Decimal(str(line.line_tax or 0)):.2f}", body_style),
            Paragraph(f"${Decimal(str(line.line_total)):.2f}", body_style),
        ])

    items_table = Table(table_data, colWidths=[2.5 * inch, 0.7 * inch, 1.1 * inch, 1.0 * inch, 1.0 * inch, 1.2 * inch])
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))

    # Totals breakdown table
    total_paid = sum((Decimal(str(p.amount)) for p in payments), Decimal("0.00"))
    total_amt = Decimal(str(invoice.total_amount))
    balance_due = max(total_amt - total_paid, Decimal("0.00"))

    summary_data = [
        [Paragraph("Subtotal:", body_style), Paragraph(f"${Decimal(str(invoice.subtotal)):.2f}", body_style)],
        [Paragraph("Discount:", body_style), Paragraph(f"-${Decimal(str(invoice.discount_amount)):.2f}", body_style)],
        [Paragraph("Tax Amount:", body_style), Paragraph(f"${Decimal(str(invoice.tax_amount)):.2f}", body_style)],
        [Paragraph("<b>Total Amount:</b>", section_heading), Paragraph(f"<b>${total_amt:.2f}</b>", section_heading)],
        [Paragraph("Paid Amount:", body_style), Paragraph(f"${total_paid:.2f}", body_style)],
        [Paragraph("<b>Outstanding Balance:</b>", section_heading), Paragraph(f"<b>${balance_due:.2f}</b>", section_heading)],
    ]

    summary_table = Table(summary_data, colWidths=[2.0 * inch, 1.5 * inch])
    summary_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 3), (1, 3), 1, colors.HexColor("#cbd5e1")),
    ]))

    # Wrap summary in a right-aligned container
    wrapper_data = [[None, summary_table]]
    wrapper_table = Table(wrapper_data, colWidths=[4.0 * inch, 3.5 * inch])
    wrapper_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    elements.append(wrapper_table)

    # Footer note
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=10))
    footer_text = "<font color='#64748b' size=8>Thank you for choosing Brightloop Subscription Management. For inquiries, please contact support.</font>"
    elements.append(Paragraph(footer_text, ParagraphStyle("Footer", parent=styles["Normal"], alignment=1)))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
