from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "MESA - Economic Report Service"
    DEBUG: bool = False

    # API Keys
    ANTHROPIC_API_KEY: str = ""  # 런타임에 필수, 임포트 시엔 optional
    FRED_API_KEY: str = ""  # optional - public data도 있음

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./mesa.db"

    # Security
    SECRET_KEY: str = "change-me-in-production"

    # Web Push (VAPID)
    VAPID_PRIVATE_KEY: str = ""
    VAPID_PUBLIC_KEY: str = ""
    VAPID_CLAIMS_EMAIL: str = "admin@mesa.local"

    # Claude Model
    CLAUDE_MODEL: str = "claude-sonnet-4-6"

    class Config:
        env_file = ".env"


settings = Settings()
