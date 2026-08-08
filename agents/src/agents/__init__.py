def main() -> None:
    import uvicorn

    from agents.settings import get_settings

    uvicorn.run(
        "agents.main:app",
        host="0.0.0.0",
        port=get_settings().agents_port,
        reload=True,
        # Open SSE streams never end on their own, so without a deadline a
        # reload hangs forever holding the port.
        timeout_graceful_shutdown=2,
    )
