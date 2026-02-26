"""
Email Service
Sends credential emails to approved users via SMTP
"""
import os
import logging
import resend
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Resend with the API key
# We will check settings.RESEND_API_KEY first, but fallback to SMTP_PASSWORD 
# so the user doesn't strictly have to add a new environment variable if they overwrite the old one.
resend.api_key = os.getenv("RESEND_API_KEY", settings.SMTP_PASSWORD)


def send_credentials_email(to_email: str, full_name: str, password: str) -> bool:
    """
    Send login credentials email to a newly approved user.
    Returns True if sent successfully, False otherwise.
    """
    if not resend.api_key or "re_" not in resend.api_key:
        logger.warning(
            f"Resend API Key not configured correctly. Credentials for {to_email}: password={password}"
        )
        print(f"\n{'='*60}")
        print(f"EMAIL NOT SENT (Resend API Key not configured)")
        print(f"To: {to_email}")
        print(f"Name: {full_name}")
        print(f"Password: {password}")
        print(f"IMPORTANT: To enable emails on Render, sign up for resend.com, get an API key (starts with re_), and set it as RESEND_API_KEY in Render Environment Variables.")
        print(f"{'='*60}\n")
        return False

    subject = f"Welcome to {settings.SMTP_FROM_NAME} — Your Login Credentials"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #060E1F; color: #F5F7FA; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 520px; margin: 0 auto; background: linear-gradient(135deg, #0B1A39 0%, #0D2247 100%); border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }}
            .header {{ padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); }}
            .logo {{ display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #FFB300, #D4A017); border-radius: 16px; line-height: 56px; font-size: 20px; font-weight: 800; color: #060E1F; }}
            .title {{ font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 16px 0 4px; }}
            .subtitle {{ font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }}
            .body {{ padding: 32px; }}
            .greeting {{ font-size: 15px; color: #94a3b8; margin-bottom: 24px; line-height: 1.6; }}
            .cred-box {{ background: rgba(255,255,255,0.04); border: 1px solid rgba(255,179,0,0.15); border-radius: 16px; padding: 24px; margin: 20px 0; }}
            .cred-label {{ font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #FFB300; margin-bottom: 6px; }}
            .cred-value {{ font-size: 16px; font-weight: 600; color: #FFFFFF; font-family: 'Courier New', monospace; word-break: break-all; }}
            .note {{ font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.5; }}
            .footer {{ padding: 20px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }}
            .footer-text {{ font-size: 11px; color: #475569; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">FC</div>
                <div class="title">Welcome Aboard!</div>
                <div class="subtitle">{settings.SMTP_FROM_NAME}</div>
            </div>
            <div class="body">
                <div class="greeting">
                    Hi <strong style="color:#FFFFFF">{full_name}</strong>,<br><br>
                    Your account has been approved! Here are your login credentials:
                </div>
                <div class="cred-box">
                    <div class="cred-label">Email</div>
                    <div class="cred-value">{to_email}</div>
                </div>
                <div class="cred-box">
                    <div class="cred-label">Password</div>
                    <div class="cred-value">{password}</div>
                </div>
                <div class="note">
                    ⚠️ Please change your password after your first login for security purposes.
                </div>
            </div>
            <div class="footer">
                <div class="footer-text">
                    {settings.SMTP_FROM_NAME} &bull; Sujay Kumar AI Studio
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        from_email = f"{settings.SMTP_FROM_NAME} <onboarding@resend.dev>"
        
        # If the user has verified a domain on Resend, they can override this via env vars
        verified_domain = os.getenv("RESEND_FROM_EMAIL")
        if verified_domain:
            from_email = f"{settings.SMTP_FROM_NAME} <{verified_domain}>"

        response = resend.Emails.send({
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body
        })
        
        logger.info(f"Credentials email sent via Resend to {to_email}. ID: {response.get('id')}")
        return True, "Email sent successfully"
    except Exception as e:
        logger.error(f"Failed to send email via Resend to {to_email}: {e}")
        print(f"\nRESEND EMAIL FAILED: {e}\n")
        return False, f"Resend API Error: {str(e)}"


def send_password_reset_email(to_email: str, full_name: str, token: str) -> bool:
    """
    Send password reset link to user.
    """
    frontend_url = settings.FRONTEND_URL
    reset_link = f"{frontend_url}/reset-password?token={token}"

    if not resend.api_key or "re_" not in resend.api_key:
        logger.warning(f"Resend API Key not configured. Reset link for {to_email}: {reset_link}")
        print(f"\n{'='*60}")
        print(f"PASSWORD RESET EMAIL (Resend API Key NOT CONFIGURED)")
        print(f"To: {to_email}")
        print(f"Link: {reset_link}")
        print(f"{'='*60}\n")
        return False

    subject = f"Password Reset Request — {settings.SMTP_FROM_NAME}"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #060E1F; color: #F5F7FA; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 520px; margin: 0 auto; background: linear-gradient(135deg, #0B1A39 0%, #0D2247 100%); border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }}
            .header {{ padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); }}
            .logo {{ display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #FFB300, #D4A017); border-radius: 16px; line-height: 56px; font-size: 20px; font-weight: 800; color: #060E1F; }}
            .title {{ font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 16px 0 4px; }}
            .body {{ padding: 32px; }}
            .greeting {{ font-size: 15px; color: #94a3b8; margin-bottom: 24px; line-height: 1.6; }}
            .btn-container {{ text-align: center; margin: 30px 0; }}
            .btn {{ background: linear-gradient(135deg, #FFB300, #D4A017); color: #060E1F !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(255, 179, 0, 0.3); }}
            .note {{ font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.5; }}
            .footer {{ padding: 20px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }}
            .footer-text {{ font-size: 11px; color: #475569; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">FC</div>
                <div class="title">Reset Your Password</div>
            </div>
            <div class="body">
                <div class="greeting">
                    Hi <strong style="color:#FFFFFF">{full_name}</strong>,<br><br>
                    We received a request to reset your password for your {settings.SMTP_FROM_NAME} account. 
                    If you didn't request this, you can safely ignore this email.
                </div>
                <div class="btn-container">
                    <a href="{reset_link}" class="btn">Reset Password</a>
                </div>
                <div class="note">
                    This link will expire in 1 hour for security purposes.
                </div>
            </div>
            <div class="footer">
                <div class="footer-text">
                    {settings.SMTP_FROM_NAME} &bull; Sujay Kumar AI Studio
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        from_email = f"{settings.SMTP_FROM_NAME} <onboarding@resend.dev>"
        verified_domain = os.getenv("RESEND_FROM_EMAIL")
        if verified_domain:
            from_email = f"{settings.SMTP_FROM_NAME} <{verified_domain}>"

        response = resend.Emails.send({
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body
        })
        
        logger.info(f"Password reset email sent via Resend to {to_email}. ID: {response.get('id')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send reset email via Resend to {to_email}: {e}")
        return False
