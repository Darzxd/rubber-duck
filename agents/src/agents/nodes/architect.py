import json
import logging

from openai import AsyncOpenAI

from agents.bus import emit
from agents.settings import get_settings
from agents.state import GraphState

logger = logging.getLogger("agents.architect")

SYSTEM_PROMPT = """Sos el Architect de una pizarra que se llena sola mientras un equipo habla. Recibís las ideas que el equipo viene diciendo, cada una con su id, y decís CÓMO SE CONECTAN entre sí.

No escribís ideas nuevas. No renombrás las que hay. Solo trazás flechas entre las que ya existen.

Conectá dos ideas solo si la relación se dijo o se desprende directamente de cómo se dijeron:
- una lleva a la otra ("primero X, después Y")
- una depende de la otra ("X necesita Y")
- una se opone a la otra ("o X o Y")
- una es la causa o el problema de la otra

Si dos ideas simplemente aparecieron en la misma charla, NO las conectes. Un diagrama con dos flechas correctas vale más que uno con diez inventadas. Devolver `edges` vacío es una respuesta correcta.

La etiqueta de la flecha es de 1 a 3 palabras, o vacía.

Formato de salida (JSON, sin prosa alrededor):
{
  "edges": [
    {"source": "id de la idea origen", "target": "id de la idea destino", "label": "necesita"}
  ]
}"""


def _edges(v, valid: set[str]) -> list[dict]:
    """Whatever cannot be read as an edge between two ideas we actually have
    is dropped. The model never gets to invent a node through here."""
    out: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for item in v if isinstance(v, list) else []:
        if not isinstance(item, dict):
            continue
        source, target = item.get("source"), item.get("target")
        if not isinstance(source, str) or not isinstance(target, str):
            continue
        if source not in valid or target not in valid or source == target:
            continue
        if (source, target) in seen:
            continue
        seen.add((source, target))
        label = item.get("label")
        out.append(
            {
                "source": source,
                "target": target,
                "label": label.strip() if isinstance(label, str) else "",
            }
        )
    return out


async def architect(state: GraphState) -> dict:
    digest = state["digest"]
    points = digest["points"]

    # Nodes are the Organizer's points verbatim, keeping their content-derived
    # ids. So a redraw reuses the same node instead of replacing it, and the
    # Architect has no way to draw something nobody said.
    nodes = [
        {"id": p["id"], "label": p["text"], "author": p["author"]}
        for p in points
    ]

    edges: list[dict] = []
    settings = get_settings()
    if len(points) >= 2 and settings.openai_api_key:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        try:
            resp = await client.chat.completions.create(
                model=settings.openai_architect_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": json.dumps(
                            {
                                "contexto": digest["summary"],
                                "ideas": [
                                    {"id": p["id"], "text": p["text"]}
                                    for p in points
                                ],
                            },
                            ensure_ascii=False,
                        ),
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )
            data = json.loads(resp.choices[0].message.content or "{}")
            if isinstance(data, dict):
                edges = _edges(data.get("edges"), {p["id"] for p in points})
        except Exception:
            # A diagram with no arrows still beats no diagram.
            logger.exception("architect edges failed; drawing nodes only")

    await emit(
        state["session_id"],
        "architect.draw",
        {
            "revision": digest["revision"],
            # These nodes are the complete state of the board, not an addition.
            "replace": True,
            "nodes": nodes,
            "edges": edges,
        },
    )
    return {}
