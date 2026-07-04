"""
Email-related API routes — password reset, OTP, and notification emails
powered by Resend (https://resend.com).
"""
from __future__ import annotations

import logging
import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .email_service import (
    send_account_deleted,
    send_otp,
    send_password_changed,
    send_password_reset,
    send_welcome,
)
from .models import User
from .security import hash_password, optional_user, require_user, verify_password

router = APIRouter(prefix="/api/email", tags=["Email (Resend)"])
log = logging.getLogger(__name__)

# In-memory OTP store (swap for Redis in production)
_OTP_STORE: dict[str, tuple[str, datetime]] = {}
_OTP_TTL = timedelta(minutes=10)


def _gen_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


# ── Request/response models ───────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    # Optional: override the reset URL prefix (defaults to app origin)
    app_origin: str = "http://localhost:8080"


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class SendOTPRequest(BaseModel):
    email: EmailStr


class WelcomeRequest(BaseModel):
    email: EmailStr
    name: str = ""


class NotifyRequest(BaseModel):
    """Generic notification body — email + optional display name."""
    email: EmailStr
    name: str = ""


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Send a password-reset OTP to the given email.
    Returns 200 even if the email doesn't exist (security best-practice).
    """
    if not settings.resend_api_key:
        raise HTTPException(503, {"message": "Email service not configured. Set RESEND_API_KEY in backend/.env."})

    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user:
        # Don't reveal whether the account exists
        return {"detail": "If that email is registered, a reset code has been sent."}

    otp = _gen_otp()
    _OTP_STORE[body.email.lower()] = (otp, datetime.now(timezone.utc))

    try:
        send_otp(body.email, otp)
    except Exception as exc:
        raise HTTPException(502, {"message": f"Failed to send email: {exc}"})

    return {"detail": "If that email is registered, a reset code has been sent."}


@router.post("/verify-otp-reset")
def verify_otp_and_reset(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify the OTP and set a new password."""
    key = body.email.lower()
    entry = _OTP_STORE.get(key)

    if not entry:
        raise HTTPException(400, {"message": "No pending reset for this email."})

    stored_otp, issued_at = entry
    if datetime.now(timezone.utc) - issued_at > _OTP_TTL:
        _OTP_STORE.pop(key, None)
        raise HTTPException(400, {"message": "Code expired. Please request a new one."})

    if body.otp.strip() != stored_otp:
        raise HTTPException(400, {"message": "Incorrect code."})

    if len(body.new_password) < 8:
        raise HTTPException(422, {"message": "Password must be at least 8 characters."})

    user = db.scalar(select(User).where(User.email == key))
    if not user:
        raise HTTPException(404, {"message": "User not found."})

    user.encrypted_password = hash_password(body.new_password)
    db.commit()
    _OTP_STORE.pop(key, None)

    # Send confirmation email (non-blocking — failure is silenced)
    try:
        name = getattr(user, "raw_user_meta_data", {}).get("name", "") if user.raw_user_meta_data else ""
        send_password_changed(body.email, name)
    except Exception:
        pass

    return {"detail": "Password updated successfully."}


@router.post("/notify/password-changed")
def notify_password_changed(body: NotifyRequest):
    """
    Send a 'password was changed' confirmation email via Resend.
    Always returns 200 — failure is logged but never exposed to the client.
    """
    if not settings.resend_api_key:
        log.debug("notify/password-changed: RESEND_API_KEY not set, skipping.")
        return {"detail": "Email notifications disabled (no RESEND_API_KEY)."}
    try:
        send_password_changed(body.email, body.name)
        return {"detail": "Notification sent."}
    except Exception as exc:
        log.warning("notify/password-changed failed: %s", exc)
        return {"detail": "Email could not be sent, but your password was updated."}


@router.post("/notify/welcome")
def notify_welcome(body: WelcomeRequest):
    """Send a welcome email after signup. Always returns 200."""
    if not settings.resend_api_key:
        log.debug("notify/welcome: RESEND_API_KEY not set, skipping.")
        return {"detail": "Email notifications disabled (no RESEND_API_KEY)."}
    try:
        send_welcome(body.email, body.name)
        return {"detail": "Welcome email sent."}
    except Exception as exc:
        log.warning("notify/welcome failed: %s", exc)
        return {"detail": "Welcome email could not be sent."}


@router.post("/notify/account-deleted")
def notify_account_deleted(body: NotifyRequest):
    """
    Send an account-deletion confirmation email via Resend.
    Always returns 200 — failure is logged but never exposed to the client.
    """
    if not settings.resend_api_key:
        log.debug("notify/account-deleted: RESEND_API_KEY not set, skipping.")
        return {"detail": "Email notifications disabled (no RESEND_API_KEY)."}
    try:
        send_account_deleted(body.email, body.name)
        return {"detail": "Deletion email sent."}
    except Exception as exc:
        log.warning("notify/account-deleted failed: %s", exc)
        return {"detail": "Deletion email could not be sent."}
