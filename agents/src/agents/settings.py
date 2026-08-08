from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_realtime_model: str = "gpt-4o-transcribe"
    openai_realtime_language: str = "es"

    portal_secret: str = ""
    portal_api_url: str = "https://api.useportal.co"
    portal_channel_id: str = "canvas"

    agents_port: int = 8000


@lru_cache
def get_settings() -> Settings:
    return Settings()
