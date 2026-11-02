import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from decimal import Decimal
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)


def is_smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER)


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    attachment_bytes: bytes | None = None,
    attachment_filename: str | None = None,
):
    if not is_smtp_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured. Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in environment variables."
        )

    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email

    # Alternative part for text and html
    alt_part = MIMEMultipart("alternative")
    alt_part.attach(MIMEText(text_body, "plain", "utf-8"))
    alt_part.attach(MIMEText(html_body, "html", "utf-8"))
    msg.attach(alt_part)

    # Attachment if provided
    if attachment_bytes and attachment_filename:
        part = MIMEApplication(attachment_bytes, Name=attachment_filename)
        part["Content-Disposition"] = f'attachment; filename="{attachment_filename}"'
        msg.attach(part)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Email successfully sent to {to_email}")
    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Email delivery failed: {str(exc)}"
        )


def send_invoice_email(invoice, customer, subscription, pdf_bytes: bytes | None = None):
    subject = f"Invoice {invoice.invoice_number} from Brightloop"
    total_amount = Decimal(str(invoice.total_amount))
    due_date_str = str(invoice.due_date) if invoice.due_date else "Due on receipt"

    text_body = f"""Hello {customer.name},

Here is your invoice {invoice.invoice_number} for the billing period {invoice.billing_period_start} to {invoice.billing_period_end}.

Total Amount: ${total_amount:.2f}
Due Date: {due_date_str}
Status: {invoice.status.capitalize()}

Thank you for choosing Brightloop Subscription Management.
"""

    html_body = f"""<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
        <h2 style="color: #1e293b; margin-top: 0;">Brightloop Invoice</h2>
        <p>Dear <strong>{customer.name}</strong>,</p>
        <p>Your invoice <strong>{invoice.invoice_number}</strong> is now available.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Billing Period</strong></td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">{invoice.billing_period_start} to {invoice.billing_period_end}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Total Amount</strong></td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 16px; font-weight: bold; color: #0f172a;">${total_amount:.2f}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Due Date</strong></td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">{due_date_str}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Status</strong></td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">{invoice.status.upper()}</td>
            </tr>
        </table>
        <p>Please find your detailed printable invoice attached to this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Brightloop Subscription Management</p>
    </div>
</body>
</html>"""

    filename = f"{invoice.invoice_number}.pdf"
    send_email(
        to_email=customer.email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        attachment_bytes=pdf_bytes,
        attachment_filename=filename
    )


def send_password_reset_email(email: str, reset_token: str):
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    subject = "Reset Your Brightloop Password"

    text_body = f"""Hello,

We received a request to reset your password for your Brightloop account.
To reset your password, please open the following link in your browser:

{reset_url}

This link is valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.
If you did not request this, you can safely ignore this email.
"""

    html_body = f"""<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
        <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
        <p>We received a request to reset the password for your Brightloop account.</p>
        <p style="margin: 24px 0;">
            <a href="{reset_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:<br/><a href="{reset_url}">{reset_url}</a></p>
        <p style="font-size: 13px; color: #64748b;">This link will expire in {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.</p>
        <p style="font-size: 13px; color: #64748b;">If you did not request a password reset, no action is required.</p>
    </div>
</body>
</html>"""

    if is_smtp_configured():
        send_email(to_email=email, subject=subject, html_body=html_body, text_body=text_body)
    else:
        logger.warning(
            f"SMTP not configured. Password reset email could not be delivered to {email}. "
            f"Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in environment variables."
        )

