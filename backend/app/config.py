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
    lovable_api_key: str | None = None
    ai_gateway_url: str = "https://ai.gateway.lovable.dev/v1/chat/completions"
    ai_model: str = "google/gemini-2.5-flash"
    google_client_id: str | None = None
    google_client_secret: str | None = None
    github_client_id: str | None = None
    github_client_secret: str | None = None
    session_secret: str = "change-me-too"
    cognee_enabled: bool = True
    cognee_dataset_prefix: str = "studyos"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
