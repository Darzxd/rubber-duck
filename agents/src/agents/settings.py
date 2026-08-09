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
    openai_architect_model: str = "gpt-4.1-mini"
    openai_notetaker_model: str = "gpt-4.1-mini"
    openai_critic_model: str = "gpt-4.1-mini"
    # The only model that emits deltas while somebody is still talking. Every
    # other one waits for the turn to close, which costs us 3-6s of dead screen.
    # It refuses turn_detection of any kind (verified against the API, twice),
    # so segments close on our side or not at all.
    openai_realtime_model: str = "gpt-live-transcribe"
    # Plural on purpose: this model rejects the singular `language`.
    openai_realtime_languages: tuple[str, ...] = ("es",)
    # minimal | low | medium | high | xhigh. More delay buys the model more
    # audio context per emission. "low" is the floor that still reads as live.
    openai_realtime_delay: str = "low"
    # Literal hints, not preceding text — this is the safe way to feed
    # vocabulary in. Keep it short: every term here biases what it hears.
    openai_realtime_keywords: tuple[str, ...] = (
        "Supabase",
        "Portal",
        "React Flow",
        "Next.js",
        "Vercel",
        "LangGraph",
        "dagre",
    )
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
