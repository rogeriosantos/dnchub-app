"""Application configuration settings."""

from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "FleetOptima"
    app_version: str = "1.0.0"
    app_env: str = "development"
    debug: bool = True

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/fleetoptima"
    database_sync_url: str = "postgresql://postgres:postgres@localhost:5432/fleetoptima"

    # JWT Authentication
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 525600  # 365 days (1 year)
    refresh_token_expire_days: int = 365  # 1 year

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:8000",
        "https://fleet.idnclabs.com",
        "https://fleet-optima-frontend.vercel.app",
    ]

    # Logging
    log_level: str = "INFO"

    # Email Configuration (for PIN reset, etc.)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "FleetOptima"
    smtp_use_tls: bool = True

    # WhatsApp/WAHA Configuration (for PIN reset, etc.)
    waha_enabled: bool = False
    waha_api_url: str = ""
    waha_api_key: str = ""
    waha_session: str = "default"
    waha_verify_ssl: bool = True  # Set to False for self-signed certs

    @property
    def email_enabled(self) -> bool:
        """Check if email is configured."""
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    @property
    def whatsapp_enabled(self) -> bool:
        """Check if WhatsApp/WAHA is configured and enabled."""
        return self.waha_enabled and bool(self.waha_api_url)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
