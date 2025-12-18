from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    project_name: str = "tg-catalog"
    api_v1_prefix: str = "/api/v1"

    database_url: PostgresDsn

    admin_token: str

    telegram_api_id: int
    telegram_api_hash: str
    telegram_bot_token: str | None = None
    telegram_session_name: str = "tg_catalog"

    media_dir: str = "media"


settings = Settings()
