import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .models import Profile, RefreshToken, User, UserRole, AppRole
from .security import access_token, hash_password, require_user, token_hash, verify_password

router = APIRouter(prefix="/auth/v1", tags=["Supabase-compatible auth"])
oauth = OAuth()
if settings.google_client_id:
    oauth.register("google", client_id=settings.google_client_id, client_secret=settings.google_client_secret, server_metadata_url="https://accounts.google.com/.well-known/openid-configuration", client_kwargs={"scope": "openid email profile"})
if settings.github_client_id:
    oauth.register("github", client_id=settings.github_client_id, client_secret=settings.github_client_secret, access_token_url="https://github.com/login/oauth/access_token", authorize_url="https://github.com/login/oauth/authorize", api_base_url="https://api.github.com/", client_kwargs={"scope": "read:user user:email"})
class Credentials(BaseModel):
    email: str
    password: str
    data: dict[str, Any] | None = None

def user_json(u: User):
    return {"id": str(u.id), "aud": "authenticated", "role": "authenticated", "email": u.email, "email_confirmed_at": u.email_confirmed_at, "phone": "", "confirmed_at": u.email_confirmed_at, "last_sign_in_at": datetime.now(timezone.utc), "app_metadata": {"provider": "email", "providers": ["email"]}, "user_metadata": u.raw_user_meta_data or {}, "identities": [], "created_at": u.created_at, "updated_at": u.updated_at, "is_anonymous": False}

def session_json(db: Session, u: User):
    raw = secrets.token_urlsafe(48)
    db.add(RefreshToken(token_hash=token_hash(raw), user_id=u.id, expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_expiry_days)))
    db.commit()
    return {"access_token": access_token(u), "token_type": "bearer", "expires_in": settings.jwt_expiry_seconds, "expires_at": int(datetime.now(timezone.utc).timestamp()) + settings.jwt_expiry_seconds, "refresh_token": raw, "user": user_json(u)}

@router.post("/signup")
def signup(body: Credentials, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    if db.scalar(select(User).where(User.email == email)): raise HTTPException(422, {"code": "user_already_exists", "message": "User already registered"})
    u = User(email=email, encrypted_password=hash_password(body.password), raw_user_meta_data=body.data or {})
    db.add(u); db.flush(); db.add(Profile(id=u.id, name=(body.data or {}).get("name", ""))); db.add(UserRole(user_id=u.id, role=AppRole.user)); db.commit(); db.refresh(u)
    return session_json(db, u)

@router.post("/token")
async def token(request: Request, grant_type: str, db: Session = Depends(get_db)):
    body = await request.json()
    if grant_type == "password":
        u = db.scalar(select(User).where(User.email == body.get("email", "").strip().lower()))
        if not u or not u.encrypted_password or not verify_password(body.get("password", ""), u.encrypted_password): raise HTTPException(400, {"error_code": "invalid_credentials", "msg": "Invalid login credentials"})
        return session_json(db, u)
    if grant_type == "refresh_token":
        row = db.get(RefreshToken, token_hash(body.get("refresh_token", "")))
        if not row or row.revoked or row.expires_at < datetime.now(timezone.utc): raise HTTPException(400, {"error_code": "refresh_token_not_found", "msg": "Invalid Refresh Token"})
        row.revoked = True; db.commit(); return session_json(db, db.get(User, row.user_id))
    raise HTTPException(400, {"error_code": "unsupported_grant_type", "msg": "Unsupported grant type"})

@router.get("/user")
def get_user(user: User = Depends(require_user)): return user_json(user)

@router.post("/logout", status_code=204)
def logout(authorization: str | None = Header(None)): return None

@router.post("/recover")
def recover(): return {}

@router.get("/authorize")
async def authorize(request: Request, provider: str, redirect_to: str | None = None):
    client = oauth.create_client(provider)
    if not client: raise HTTPException(400, {"error_code": "validation_failed", "msg": f"Provider {provider} is not configured"})
    request.session["redirect_to"] = redirect_to or settings.allowed_origins[0]
    return await client.authorize_redirect(request, f"{settings.public_url}/auth/v1/callback/{provider}")

@router.get("/callback/{provider}")
async def oauth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    client = oauth.create_client(provider)
    if not client: raise HTTPException(400, "Provider is not configured")
    token = await client.authorize_access_token(request)
    if provider == "google":
        info = token.get("userinfo") or await client.parse_id_token(request, token)
    else:
        info = (await client.get("user", token=token)).json()
        if not info.get("email"):
            emails = (await client.get("user/emails", token=token)).json()
            info["email"] = next((x["email"] for x in emails if x.get("primary")), None)
    email = (info.get("email") or "").lower()
    if not email: raise HTTPException(400, "OAuth provider did not return an email")
    u = db.scalar(select(User).where(User.email == email))
    if not u:
        meta = {"name": info.get("name") or info.get("login") or email.split("@")[0], "avatar_url": info.get("picture") or info.get("avatar_url")}
        u = User(email=email, encrypted_password=None, raw_user_meta_data=meta)
        db.add(u); db.flush(); db.add(Profile(id=u.id, name=meta["name"])); db.add(UserRole(user_id=u.id, role=AppRole.user)); db.commit(); db.refresh(u)
    payload = session_json(db, u)
    target = request.session.pop("redirect_to", settings.allowed_origins[0])
    fragment = "&".join(f"{k}={v}" for k, v in {"access_token": payload["access_token"], "refresh_token": payload["refresh_token"], "expires_in": payload["expires_in"], "token_type": "bearer", "type": "signup"}.items())
    return RedirectResponse(f"{target}#{fragment}")
