from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://studyos:studyos@localhost:5432/studyos"
    jwt_secret: str = "change-me"
    jwt_expiry_seconds: int = 3600
    refresh_expiry_days: int = 30
    cors_origins: str = "http://localhost:5173"
    public_url: str = "http://localhost:8000"
    storage_path: Path = Path("./storage")
    groq_api_key: str | None = None
    groq_api_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "llama-3.3-70b-versatile"
    supabase_jwt_secret: str | None = None  # Supabase Dashboard → Project Settings → API → JWT Secret
    resend_api_key: str | None = None        # Resend Dashboard → API Keys
    email_from: str = "StudyOS <noreply@studyos.app>"  # Verified sender in Resend
    google_client_id: str | None = None
    google_client_secret: str | None = None
    github_client_id: str | None = None
    github_client_secret: str | None = None
    session_secret: str = "change-me-too"

    # ── Cognee Cloud ─────────────────────────────────────────────────────────
    cognee_enabled: bool = True
    cognee_dataset_prefix: str = "studyos"
    cognee_api_key: str | None = None       # Cognee Cloud API key
    cognee_service_url: str | None = None   # Tenant URL e.g. https://<tenant>.aws.cognee.ai

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
