import httpx

from agents.settings import get_settings


async def publish(channel_id: str, event: str, content: dict) -> None:
    settings = get_settings()
    if not settings.portal_secret:
        return

    async with httpx.AsyncClient(timeout=10.0) as client:
        await client.post(
            f"{settings.portal_api_url}/v1/publish",
            headers={"Authorization": f"Bearer {settings.portal_secret}"},
            json={"channelId": channel_id, "event": event, "content": content},
        )
