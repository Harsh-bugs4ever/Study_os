import hashlib, secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID
import jwt
from fastapi import Header, HTTPException
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from .config import settings
from .database import SessionLocal
from .models import User

password_hash = PasswordHash.recommended()

def hash_password(value: str) -> str: return password_hash.hash(value)
def verify_password(value: str, hashed: str) -> bool: return password_hash.verify(value, hashed)
def token_hash(value: str) -> str: return hashlib.sha256(value.encode()).hexdigest()

def access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user.id), "email": user.email, "role": "authenticated", "aud": "authenticated", "iat": now, "exp": now + timedelta(seconds=settings.jwt_expiry_seconds)}, settings.jwt_secret, algorithm="HS256")

def decode_token(value: str) -> dict:
    try: return jwt.decode(value, settings.jwt_secret, algorithms=["HS256"], audience="authenticated")
    except jwt.PyJWTError: raise HTTPException(401, {"message": "Invalid JWT", "code": "bad_jwt"})

def optional_user(authorization: str | None = Header(None)) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "): return None
    token = authorization.split(" ", 1)[1]
    # supabase-js sends the public API key as a bearer value before login.
    if token == "local-anon-key": return None
    payload = decode_token(token)
    with SessionLocal() as db: return db.get(User, UUID(payload["sub"]))

def require_user(authorization: str | None = Header(None)) -> User:
    user = optional_user(authorization)
    if not user: raise HTTPException(401, {"message": "Auth session missing!"})
    return user
