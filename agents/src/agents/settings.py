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
    # gpt-live-transcribe rejects turn_detection outright, so it never closes a
    # segment on its own. gpt-transcribe takes semantic VAD and, unlike
    # gpt-4o-transcribe, carries earlier turns as context into the next one.
    openai_realtime_model: str = "gpt-transcribe"
    openai_realtime_language: str = "es"
    # Literal hints, not preceding text — this is the safe way to feed
    # vocabulary in. Keep it short: every term here biases what it hears.
    openai_realtime_keywords: tuple[str, ...] = (
        "Supabase",
        "Portal",
        "React Flow",
        "Next.js",
        "Vercel",
        "LangGraph",
    )
    # Accuracy over speed: a whole thought in one segment transcribes far
    # better than the same words cut into fragments, because each segment is
    # transcribed without the context of the others.
    openai_realtime_eagerness: str = "low"
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
