"""Email the company inbox when a quote request arrives (optional, needs SMTP settings)."""

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings
from app.models import Quote

log = logging.getLogger(__name__)


def quote_summary(q: Quote) -> str:
    lines = [
        f"Quote request {q.ref}",
        "",
        f"Name: {q.name}",
        f"Company: {q.company}" if q.company else None,
        f"Phone: {q.phone}",
        f"Email: {q.email}" if q.email else None,
        "",
        f"Service: {q.service}",
        f"From: {q.pickup}",
        f"To: {q.delivery}",
        f"Approx. distance: {q.km:,} km" if q.km else None,
        f"Cargo: {q.cargo}",
        f"Weight: {q.weight:g} t" if q.weight else None,
        f"Truck: {q.truck}" if q.truck else None,
        f"Loading date: {q.load_date:%d %b %Y}" if q.load_date else None,
        f"Notes: {q.notes}" if q.notes else None,
    ]
    return "\n".join(line for line in lines if line is not None)


def send_quote_email(q: Quote) -> None:
    settings = get_settings()
    if not settings.email_enabled:
        return
    msg = EmailMessage()
    msg["Subject"] = f"New quote request {q.ref}: {q.pickup} to {q.delivery}"
    recipients = settings.notify_email_list
    msg["From"] = settings.smtp_user
    msg["To"] = ", ".join(recipients)
    if q.email:
        msg["Reply-To"] = q.email
    msg.set_content(quote_summary(q))
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(msg)
    except Exception:  # noqa: BLE001 - notification must never break the request
        log.exception("Could not send quote notification for %s", q.ref)
