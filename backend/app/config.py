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

    # --- Gemini / Google AI ---
    google_ai_api_key: str | None = None
    lovable_api_key: str | None = None
    ai_gateway_url: str = "https://generativelanguage.googleapis.com/v1beta"
    ai_model: str = "gemini-2.5-flash"

    # --- Groq ---
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"

    # --- Provider selection ---
    # Values: "auto" (groq if key present, else gemini), "groq", "gemini"
    ai_provider: str = "auto"

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

    @property
    def ai_api_key(self) -> str | None:
        """Legacy Gemini key (kept for backwards compat)."""
        return self.google_ai_api_key or self.lovable_api_key

    @property
    def active_provider(self) -> str:
        """Resolve the effective AI provider: 'groq' or 'gemini'."""
        provider = self.ai_provider.lower()
        if provider == "groq":
            return "groq"
        if provider == "gemini":
            return "gemini"
        # auto: prefer Groq if a key is configured
        return "groq" if self.groq_api_key else "gemini"

    @property
    def active_api_key(self) -> str | None:
        """Return the API key for the active provider."""
        if self.active_provider == "groq":
            return self.groq_api_key
        return self.ai_api_key

    @property
    def active_model(self) -> str:
        """Return the model name for the active provider."""
        if self.active_provider == "groq":
            return self.groq_model
        return self.ai_model


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
