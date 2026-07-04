"""
Email service powered by Resend (https://resend.com).

Set RESEND_API_KEY in backend/.env and EMAIL_FROM to a verified sender address.
"""
from __future__ import annotations

from typing import Any

import resend

from .config import settings


def _client() -> None:
    """Configure the Resend SDK with the project API key."""
    if not settings.resend_api_key:
        raise RuntimeError(
            "RESEND_API_KEY is not set in backend/.env — "
            "get your key at https://resend.com/api-keys"
        )
    resend.api_key = settings.resend_api_key


# ── HTML templates ────────────────────────────────────────────────────────────

_BASE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{subject}</title>
  <style>
    body {{ margin: 0; padding: 0; background: #F1EFE8; font-family: 'Segoe UI', system-ui, sans-serif; }}
    .wrap {{ max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }}
    .header {{ background: linear-gradient(135deg,#185FA5 0%,#0f3d6e 100%); padding: 32px 36px; }}
    .logo {{ font-size: 20px; font-weight: 800; color: #fff; letter-spacing: .5px; }}
    .logo span {{ color: #FF9933; }}
    .body {{ padding: 32px 36px; }}
    h1 {{ margin: 0 0 10px; font-size: 22px; color: #2C2C2A; font-weight: 700; }}
    p {{ margin: 0 0 16px; font-size: 15px; color: #5F5E5A; line-height: 1.6; }}
    .btn {{ display: inline-block; margin: 8px 0 20px; padding: 14px 32px; background: #185FA5; color: #fff !important; border-radius: 10px; font-weight: 700; font-size: 15px; text-decoration: none; }}
    .otp {{ display: inline-block; letter-spacing: 8px; font-size: 36px; font-weight: 900; color: #185FA5; margin: 12px 0 24px; }}
    .note {{ font-size: 12px; color: #888780; }}
    .footer {{ background: #F1EFE8; padding: 20px 36px; font-size: 11px; color: #888780; text-align: center; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">Study<span>OS</span> · Gurukul</div>
    </div>
    <div class="body">
      {content}
    </div>
    <div class="footer">
      You received this email because an action was taken on your StudyOS account.<br/>
      If you didn't request this, you can safely ignore this email.
    </div>
  </div>
</body>
</html>
"""


def _render(subject: str, content: str) -> str:
    return _BASE.format(subject=subject, content=content)


# ── Individual email senders ───────────────────────────────────────────────────

def send_password_reset(to: str, reset_link: str) -> dict[str, Any]:
    """Send a password-reset magic link via Resend."""
    _client()
    subject = "Reset your StudyOS password"
    html = _render(subject, f"""
        <h1>Reset your password</h1>
        <p>We received a request to reset the password for your StudyOS account (<strong>{to}</strong>).</p>
        <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="{reset_link}" class="btn">Reset Password</a>
        <p class="note">If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="{reset_link}" style="color:#185FA5;word-break:break-all;">{reset_link}</a>
        </p>
        <p class="note">Didn't request a reset? Your account is safe — just ignore this email.</p>
    """)
    return resend.Emails.send({
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    })


def send_password_changed(to: str, name: str) -> dict[str, Any]:
    """Notify the user that their password was successfully changed."""
    _client()
    subject = "Your StudyOS password was changed"
    html = _render(subject, f"""
        <h1>Password updated ✓</h1>
        <p>Hi {name or 'there'},</p>
        <p>Your StudyOS account password was successfully changed.</p>
        <p>If you made this change, no further action is needed.</p>
        <p>If you did <strong>not</strong> change your password, please
           <a href="mailto:support@studyos.app" style="color:#185FA5;">contact support</a>
           immediately to secure your account.</p>
    """)
    return resend.Emails.send({
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    })


def send_otp(to: str, otp: str) -> dict[str, Any]:
    """Send a 6-digit OTP for email verification or sensitive actions."""
    _client()
    subject = "Your StudyOS verification code"
    html = _render(subject, f"""
        <h1>Verification code</h1>
        <p>Use the code below to complete your action. It expires in <strong>10 minutes</strong>.</p>
        <div class="otp">{otp}</div>
        <p class="note">Never share this code with anyone. StudyOS staff will never ask for it.</p>
    """)
    return resend.Emails.send({
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    })


def send_welcome(to: str, name: str) -> dict[str, Any]:
    """Send a branded welcome email when a new account is created."""
    _client()
    subject = "Welcome to StudyOS 🎓"
    html = _render(subject, f"""
        <h1>Welcome, {name or 'Scholar'}! 🎓</h1>
        <p>Your StudyOS account is ready. Start your personalized learning journey — your AI tutor Saathi is waiting.</p>
        <a href="https://studyos.app/dashboard" class="btn">Open Dashboard</a>
        <p>Here's what you can do right now:</p>
        <ul style="color:#5F5E5A;font-size:14px;line-height:2">
          <li>📚 Upload your notes & PDFs</li>
          <li>🧠 Chat with Saathi, your AI mentor</li>
          <li>📊 Take adaptive quizzes and track mastery</li>
          <li>🔥 Build your study streak</li>
        </ul>
        <p class="note">॥ विद्या ददाति विनयं ॥ — Knowledge gives humility.</p>
    """)
    return resend.Emails.send({
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    })


def send_account_deleted(to: str, name: str) -> dict[str, Any]:
    """Confirm account deletion to the user."""
    _client()
    subject = "Your StudyOS account has been deleted"
    html = _render(subject, f"""
        <h1>Account deleted</h1>
        <p>Hi {name or 'there'},</p>
        <p>Your StudyOS account and all associated data have been permanently deleted as requested.</p>
        <p>We're sorry to see you go. If this was a mistake, please
           <a href="mailto:support@studyos.app" style="color:#185FA5;">contact support</a>
           within 30 days — we may be able to recover your data.</p>
        <p>Thank you for learning with us. 🙏</p>
    """)
    return resend.Emails.send({
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    })
