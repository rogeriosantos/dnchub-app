"""Messaging service for Email and WhatsApp notifications."""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class MessagingService:
    """Service for sending messages via Email and WhatsApp."""

    def send_email(
        self,
        to_email: str,
        subject: str,
        body_text: str,
        body_html: str | None = None,
    ) -> bool:
        """Send an email message."""
        if not settings.email_enabled:
            logger.warning("Email not configured, skipping email send")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
            msg["To"] = to_email

            # Attach plain text version
            msg.attach(MIMEText(body_text, "plain"))

            # Attach HTML version if provided
            if body_html:
                msg.attach(MIMEText(body_html, "html"))

            # Connect and send
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                if settings.smtp_use_tls:
                    server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(
                    settings.smtp_from_email,
                    to_email,
                    msg.as_string(),
                )

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    def send_whatsapp(
        self,
        phone_number: str,
        message: str,
    ) -> bool:
        """Send a WhatsApp message via WAHA API."""
        if not settings.whatsapp_enabled:
            logger.warning("WhatsApp/WAHA not configured, skipping WhatsApp send")
            return False

        try:
            # Normalize phone number (remove spaces, dashes, etc.)
            phone = "".join(filter(str.isdigit, phone_number))
            if not phone.startswith("+"):
                # Assume it needs country code - this may need adjustment based on your needs
                pass

            # WAHA API endpoint for sending messages (session-based URL format)
            url = f"{settings.waha_api_url}/api/sendText"

            headers = {
                "Content-Type": "application/json",
            }

            # Add API key if configured
            if settings.waha_api_key:
                headers["X-Api-Key"] = settings.waha_api_key

            payload = {
                "chatId": f"{phone}@c.us",
                "text": message,
                "session": settings.waha_session,
            }

            logger.info(f"Sending WhatsApp to {phone}@c.us via session {settings.waha_session}")
            logger.debug(f"WAHA URL: {url}, Payload: {payload}")

            with httpx.Client(timeout=60.0, verify=settings.waha_verify_ssl) as client:
                response = client.post(url, json=payload, headers=headers)
                logger.info(f"WAHA response status: {response.status_code}")
                if response.status_code >= 400:
                    logger.error(f"WAHA error response: {response.text}")
                response.raise_for_status()

            logger.info(f"WhatsApp message sent successfully to {phone_number}")
            return True

        except httpx.HTTPStatusError as e:
            logger.error(f"WAHA HTTP error for {phone_number}: {e.response.status_code} - {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message to {phone_number}: {e}")
            return False

    def send_pin_reset_email(
        self,
        to_email: str,
        employee_name: str,
        new_pin: str,
    ) -> bool:
        """Send PIN reset email to employee."""
        subject = "Your FleetOptima PIN Has Been Reset"

        body_text = f"""
Hello {employee_name},

Your PIN for FleetOptima Fuel POS has been reset.

Your new PIN is: {new_pin}

Please use this PIN to log in to the Fuel POS system. We recommend changing your PIN after logging in for security purposes.

If you did not request this PIN reset, please contact your administrator immediately.

Best regards,
FleetOptima Team
"""

        body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .pin-box {{ background-color: #fff; border: 2px solid #f97316; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
        .pin {{ font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 8px; }}
        .warning {{ color: #b91c1c; font-size: 14px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FleetOptima</h1>
        </div>
        <div class="content">
            <h2>Hello {employee_name},</h2>
            <p>Your PIN for FleetOptima Fuel POS has been reset.</p>

            <div class="pin-box">
                <p style="margin: 0; color: #666;">Your new PIN is:</p>
                <p class="pin">{new_pin}</p>
            </div>

            <p>Please use this PIN to log in to the Fuel POS system. We recommend changing your PIN after logging in for security purposes.</p>

            <p class="warning">If you did not request this PIN reset, please contact your administrator immediately.</p>

            <p>Best regards,<br>FleetOptima Team</p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(to_email, subject, body_text, body_html)

    def send_pin_reset_whatsapp(
        self,
        phone_number: str,
        employee_name: str,
        new_pin: str,
    ) -> bool:
        """Send PIN reset WhatsApp message to employee."""
        message = f"""🔐 *FleetOptima PIN Reset*

Hello {employee_name},

Your Fuel POS PIN has been reset.

*Your new PIN:* {new_pin}

Please use this PIN to log in. We recommend changing it after logging in.

⚠️ If you did not request this, contact your administrator immediately.

- FleetOptima Team"""

        return self.send_whatsapp(phone_number, message)

    def send_pin_changed_email(
        self,
        to_email: str,
        employee_name: str,
    ) -> bool:
        """Send PIN changed confirmation email to employee."""
        subject = "Your FleetOptima PIN Has Been Changed"

        body_text = f"""
Hello {employee_name},

Your PIN for FleetOptima Fuel POS has been successfully changed.

If you did not make this change, please contact your administrator immediately.

Best regards,
FleetOptima Team
"""

        body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .success {{ color: #16a34a; }}
        .warning {{ color: #b91c1c; font-size: 14px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FleetOptima</h1>
        </div>
        <div class="content">
            <h2>Hello {employee_name},</h2>
            <p class="success">✅ Your PIN for FleetOptima Fuel POS has been successfully changed.</p>

            <p class="warning">If you did not make this change, please contact your administrator immediately.</p>

            <p>Best regards,<br>FleetOptima Team</p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(to_email, subject, body_text, body_html)

    def send_pin_changed_whatsapp(
        self,
        phone_number: str,
        employee_name: str,
    ) -> bool:
        """Send PIN changed confirmation WhatsApp message to employee."""
        message = f"""✅ *FleetOptima PIN Changed*

Hello {employee_name},

Your Fuel POS PIN has been successfully changed.

⚠️ If you did not make this change, contact your administrator immediately.

- FleetOptima Team"""

        return self.send_whatsapp(phone_number, message)

    def get_available_channels(self) -> list[str]:
        """Get list of available messaging channels."""
        channels = []
        if settings.email_enabled:
            channels.append("email")
        if settings.whatsapp_enabled:
            channels.append("whatsapp")
        return channels


messaging_service = MessagingService()
