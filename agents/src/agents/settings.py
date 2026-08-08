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
    openai_organizer_model: str = "gpt-4.1-mini"
    # gpt-live-transcribe streams deltas but rejects turn_detection, so it
    # never closes a segment — we need server VAD to get final transcripts.
    openai_realtime_model: str = "gpt-4o-transcribe"
    openai_realtime_language: str = "es"
    openai_realtime_silence_ms: int = 600
    # Empty on purpose. The model treats this as preceding text and repeats it
    # verbatim on a short or noisy segment — a list of technologies came back
    # as "confirmamos el backend en Python?".
    openai_realtime_prompt: str = ""

    portal_secret: str = ""
    portal_api_url: str = "https://api.useportal.co"
    portal_channel_id: str = "canvas"

    agents_port: int = 8000


@lru_cache
def get_settings() -> Settings:
    return Settings()
