def main() -> None:
    import uvicorn

    from agents.settings import get_settings

    uvicorn.run(
        "agents.main:app",
        host="0.0.0.0",
        port=get_settings().agents_port,
        reload=True,
    )
