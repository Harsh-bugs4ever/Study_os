import hashlib, os, secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

import jwt
from fastapi import Header, HTTPException
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from .config import settings
from .database import SessionLocal
from .models import User


def _find_supabase_jwt_secret() -> str | None:
    """
    Try to find the Supabase JWT secret from multiple sources:
    1. settings.supabase_jwt_secret (backend/.env SUPABASE_JWT_SECRET)
    2. The frontend .env VITE_SUPABASE_SECRET_KEY (useful during local dev)
    Returns None if not found anywhere.
    """
    # 1. Explicitly configured in backend/.env
    if settings.supabase_jwt_secret:
        return settings.supabase_jwt_secret

    # 2. Try to read from the frontend .env (two levels up from backend/app/)
    frontend_env = Path(__file__).resolve().parents[2] / ".env"
    if frontend_env.exists():
        for line in frontend_env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("VITE_SUPABASE_SECRET_KEY="):
                val = line.split("=", 1)[1].strip().strip('"').strip("'")
                if val and val != "your-secret-key":
                    return val
    return None


_SUPABASE_JWT_SECRET: str | None = _find_supabase_jwt_secret()

password_hash = PasswordHash.recommended()


def hash_password(value: str) -> str: return password_hash.hash(value)
def verify_password(value: str, hashed: str) -> bool: return password_hash.verify(value, hashed)
def token_hash(value: str) -> str: return hashlib.sha256(value.encode()).hexdigest()

def access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user.id), "email": user.email, "role": "authenticated",
         "aud": "authenticated", "iat": now,
         "exp": now + timedelta(seconds=settings.jwt_expiry_seconds)},
        settings.jwt_secret, algorithm="HS256",
    )

# ── Supabase JWT support ──────────────────────────────────────────────────────
# Supabase signs tokens with a per-project JWT secret (HS256). You can find it
# in: Supabase dashboard → Project Settings → API → JWT Secret
# Set SUPABASE_JWT_SECRET in backend/.env to enable pass-through auth.

def _decode_supabase_token(token: str) -> dict | None:
    """Try to decode a Supabase HS256 JWT using the auto-discovered secret."""
    if not _SUPABASE_JWT_SECRET:
        return None
    try:
        return jwt.decode(
            token, _SUPABASE_JWT_SECRET, algorithms=["HS256"],
            audience="authenticated",
            options={"verify_exp": True},
        )
    except jwt.PyJWTError:
        return None


def decode_token(value: str) -> dict:
    """Decode a JWT issued by either this backend or Supabase."""
    # 1. Try local secret first (fast path for locally-issued tokens)
    try:
        return jwt.decode(
            value, settings.jwt_secret, algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError:
        pass

    # 2. Try Supabase secret (frontend users authenticated via supabase-js)
    payload = _decode_supabase_token(value)
    if payload:
        return payload

    raise HTTPException(401, {"message": "Invalid JWT", "code": "bad_jwt"})


def _get_or_create_supabase_user(db, payload: dict) -> User | None:
    """
    Look up a local User by the Supabase sub (UUID). If one doesn't exist yet,
    create a stub profile so the rest of the app works without a separate signup.
    """
    from .models import Profile, UserRole, AppRole

    try:
        uid = UUID(payload["sub"])
    except (KeyError, ValueError):
        return None

    user = db.get(User, uid)
    if user:
        return user

    # Auto-provision a local shadow user for this Supabase identity
    email = payload.get("email", f"{uid}@supabase.local")
    user = User(
        id=uid,
        email=email,
        encrypted_password=None,
        email_confirmed_at=datetime.now(timezone.utc),
        raw_user_meta_data=payload.get("user_metadata") or {},
    )
    db.add(user)
    db.flush()
    db.add(Profile(id=uid, name=payload.get("user_metadata", {}).get("name", email.split("@")[0])))
    db.add(UserRole(user_id=uid, role=AppRole.user))
    db.commit()
    db.refresh(user)
    return user


def optional_user(authorization: str | None = Header(None)) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    # supabase-js sends the public API key as a bearer value before login.
    if token == "local-anon-key":
        return None

    try:
        payload = decode_token(token)
    except HTTPException:
        return None

    with SessionLocal() as db:
        user = db.get(User, UUID(payload["sub"]))
        if not user and _SUPABASE_JWT_SECRET:
            # Supabase user not yet in local DB — auto-provision
            user = _get_or_create_supabase_user(db, payload)
        return user


def require_user(authorization: str | None = Header(None)) -> User:
    user = optional_user(authorization)
    if not user:
        raise HTTPException(401, {"message": "Auth session missing!"})
    return user
