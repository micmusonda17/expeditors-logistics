"""Application settings, read from environment variables or a .env file."""

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    app_name: str = "Expeditors Logistics API"
    environment: str = "development"

    # Database: any SQLAlchemy URL. Postgres in Docker and production.
    database_url: str = "postgresql+psycopg://expeditors:expeditors@localhost:5432/expeditors"

    # Auth. SECRET_KEY must be a long random string in production.
    secret_key: str = "dev-only-change-me-dev-only-change-me"
    access_token_minutes: int = 60 * 12

    # Comma separated list of frontend origins allowed to call the API.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Public website address, used in tracking links inside emails.
    public_site_url: str = "http://localhost:5173"

    # Shared route network (towns, border posts, roads).
    network_file: Path = REPO_ROOT / "shared" / "network.json"

    # Quote requests allowed per IP address per window.
    quote_rate_limit: int = 5
    quote_rate_window_seconds: int = 600

    # Optional email notification for new quote requests (Gmail: use an app password).
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    # One address, or several separated by commas: every one gets each new request.
    notify_email: str | None = None

    @field_validator("database_url")
    @classmethod
    def _normalise_db_url(cls, v: str) -> str:
        # Hosts such as Render and Neon hand out postgres:// URLs; SQLAlchemy needs the driver name.
        if v.startswith("postgres://"):
            v = "postgresql+psycopg://" + v[len("postgres://") :]
        elif v.startswith("postgresql://"):
            v = "postgresql+psycopg://" + v[len("postgresql://") :]
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def notify_email_list(self) -> list[str]:
        return [e.strip() for e in (self.notify_email or "").split(",") if e.strip()]

    @property
    def email_enabled(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password and self.notify_email_list)


@lru_cache
def get_settings() -> Settings:
    return Settings()
