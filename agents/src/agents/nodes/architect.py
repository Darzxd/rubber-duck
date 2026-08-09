import asyncio
import json
import logging
import time

from openai import AsyncOpenAI

from agents import architect_board, repo
from agents import organizer_store as store
from agents.bus import emit
from agents.settings import get_settings
from agents.state import GraphState

logger = logging.getLogger("agents.architect")

# What the Organizer's kinds turn into on the board. Everything the Architect
# writes is one of these four flavours.
KIND_STYLE: dict[str, str] = {
    "decision": "decision",
    "idea": "idea",
    "pendiente": "tarea",
    "pregunta": "duda",
}

# The pause between consecutive ops going out on the wire. Long enough that
# the front can animate a cursor moving from one spot to the next; short
# enough that a 5-op turn does not feel like the agent is stalling.
OP_INTERVAL_SEC = 0.15


SYSTEM_PROMPT = """Sos el Architect de una pizarra que se llena mientras un equipo de producto habla.

Trabajás como un humano: no volcás todo lo que se dice. Elegís lo que vale y armás la estructura de a poco. Cada revisión hacés MUY POCO — una o dos cosas, o nada.

QUÉ RECIBÍS:
- `contexto`: el resumen vivo de la conversación.
- `reunion`: para qué se juntó el equipo. Es la vara: lo que no es sobre eso, no va.
- `ideas`: las cosas que el Organizer marcó como valiosas. Cada una trae su `id`, `text`, `kind` y `en_pizarra` (true si ya tiene nodo en la pizarra).
- `pizarra_actual`: lo que ya está dibujado — nodos con su id/columna/kind, columnas tituladas, flechas. NO redibujes lo que ya está bien.
- `repo`: a veces, cómo está armado el proyecto del equipo. Usalo para NOMBRAR: si un nodo corresponde a un módulo o archivo del repo, usá ese nombre exacto (`editar_nodo` a un nodo existente, o `crear_nodo` con el nombre real). No es fuente de ideas — nada del repo entra si nadie lo dijo.

CÓMO DECIDÍS QUÉ HACER:
- Una idea con `en_pizarra: true` ya está. NO la vuelvas a crear.
- Una idea con `text` de 1 o 2 palabras no vale un nodo — es probable que sea un fragmento sin contexto. NO llames crear_nodo sobre ella. Si el equipo la retoma con más sustancia, la próxima revisión te dará algo mejor.
- Una idea nueva se sube al board solo si vale la pena — un detalle que nadie retomó puede quedarse afuera. Si dudás, no la agregues; volverá si el equipo insiste.
- Un nodo del board cuya idea ya no tiene sentido (contradicha, obsoleta) se `borrar`.
- Una relación se `conectar` SOLO si el equipo la dijo — dos ideas mencionadas juntas no son una relación.
- `pegar_nota` es SOLO para un dato concreto que aclara un nodo — un número, una restricción, un requisito. NO es para narrar la conversación ni para decir "Fulano quiere tal": eso no es una nota. Si no hay un dato así, no llames pegar_nota. Máximo una nota por revisión, y muchas revisiones no llevan ninguna.
- Una columna se `titular_columna` cuando ya tiene ≥2 nodos del mismo tema.

TUS HERRAMIENTAS (llamalas con function calling — no escribas JSON en el texto):
- `crear_nodo(id, texto, columna, kind)` — el `id` DEBE ser uno de `ideas`. Columna 0 a 3.
- `editar_nodo(id, texto)` — para renombrar un nodo existente (típicamente con el nombre del repo).
- `mover_nodo(id, columna)` — reubicar un nodo entre columnas.
- `conectar(de, a, label?)` — flecha entre dos nodos existentes. Label 1-2 palabras o vacío.
- `pegar_nota(nodo_id, texto, autor?)` — nota amarilla de detalle pegada al nodo.
- `borrar(id)` — quita un nodo, anotación o flecha.
- `titular_columna(columna, titulo)` — nombra una columna. 1-3 palabras.

LÍMITES DE TEXTO:
- `texto` de un nodo: 1 a 4 palabras.
- `texto` de una anotación: hasta 10 palabras.
- `titulo` de columna: 1 a 3 palabras.

REGLA DURA — NO INVENTAR:
- No inventes ids. Toda id que uses para `crear_nodo` viene de `ideas`.
- No inventes archivos, nombres, tecnologías o gente. Si `repo` no tiene algo, no se llama con nombre del repo.
- Si nada nuevo justifica una acción, NO LLAMES NINGUNA TOOL. Responder sin tool calls es la respuesta correcta y frecuente."""


def _tools() -> list[dict]:
    return [
        {
            "type": "function",
            "function": {
                "name": "crear_nodo",
                "description": "Crea un nodo en la pizarra. El id DEBE ser exactamente el de una idea en `ideas`.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "texto": {"type": "string"},
                        "columna": {"type": "integer", "minimum": 0, "maximum": 3},
                        "kind": {
                            "type": "string",
                            "enum": ["idea", "decision", "tarea", "duda"],
                        },
                    },
                    "required": ["id", "texto", "columna", "kind"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "editar_nodo",
                "description": "Cambia el texto de un nodo ya en la pizarra.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "texto": {"type": "string"},
                    },
                    "required": ["id", "texto"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "mover_nodo",
                "description": "Mueve un nodo existente a otra columna.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "columna": {"type": "integer", "minimum": 0, "maximum": 3},
                    },
                    "required": ["id", "columna"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "conectar",
                "description": "Dibuja una flecha entre dos nodos existentes. Solo si la relación fue dicha.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "de": {"type": "string"},
                        "a": {"type": "string"},
                        "label": {"type": "string"},
                    },
                    "required": ["de", "a"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "pegar_nota",
                "description": "Pega una nota de detalle al lado de un nodo existente.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "nodo_id": {"type": "string"},
                        "texto": {"type": "string"},
                        "autor": {"type": "string"},
                    },
                    "required": ["nodo_id", "texto"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "borrar",
                "description": "Quita del board un nodo, una anotación o una flecha por id.",
                "parameters": {
                    "type": "object",
                    "properties": {"id": {"type": "string"}},
                    "required": ["id"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "titular_columna",
                "description": "Le pone un título a una columna.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "columna": {"type": "integer", "minimum": 0, "maximum": 3},
                        "titulo": {"type": "string"},
                    },
                    "required": ["columna", "titulo"],
                    "additionalProperties": False,
                },
            },
        },
    ]


def _text(v) -> str:
    return v.strip() if isinstance(v, str) else ""


def _int(v, default: int = 0) -> int:
    if isinstance(v, bool):
        return default
    if isinstance(v, int):
        return v
    if isinstance(v, str) and v.strip().lstrip("-").isdigit():
        return int(v.strip())
    return default


def _apply(
    board: architect_board.ArchitectBoard,
    name: str,
    args: dict,
    allowed_ids: set[str],
) -> dict | None:
    """Turns one tool call into a board mutation, or None if it was rejected.

    The apply functions swallow duplicates and unknown targets, so the model's
    off-day calls never crash the board. The `allowed_ids` gate is the extra
    guard `crear_nodo` needs — the id must be an idea we actually gave it."""
    if name == "crear_nodo":
        node_id = _text(args.get("id"))
        if node_id not in allowed_ids:
            return None
        texto = _text(args.get("texto"))
        # A one- or two-word sticky is either a leaked filler or the model
        # inventing a label of its own. Neither belongs on the pizarra.
        if len(texto.split()) < 2:
            return None
        return architect_board.crear_nodo(
            board,
            node_id,
            texto,
            _int(args.get("columna")),
            _text(args.get("kind")),
        )
    if name == "editar_nodo":
        return architect_board.editar_nodo(
            board, _text(args.get("id")), _text(args.get("texto"))
        )
    if name == "mover_nodo":
        return architect_board.mover_nodo(
            board, _text(args.get("id")), _int(args.get("columna"))
        )
    if name == "conectar":
        return architect_board.conectar(
            board,
            _text(args.get("de")),
            _text(args.get("a")),
            _text(args.get("label")),
        )
    if name == "pegar_nota":
        return architect_board.pegar_nota(
            board,
            _text(args.get("nodo_id")),
            _text(args.get("texto")),
            _text(args.get("autor")),
        )
    if name == "borrar":
        return architect_board.borrar(board, _text(args.get("id")))
    if name == "titular_columna":
        return architect_board.titular_columna(
            board, _int(args.get("columna")), _text(args.get("titulo"))
        )
    return None


def _serialise_board(board: architect_board.ArchitectBoard) -> dict:
    """A picture of the current pizarra shaped so the model can read it. Only
    the fields it needs to decide what to do next — not the internal stacks."""
    return {
        "nodos": [
            {
                "id": n.id,
                "texto": n.texto,
                "columna": n.columna,
                "kind": n.kind,
            }
            for n in board.nodes.values()
        ],
        "columnas": {str(k): v for k, v in board.titles.items()},
        "flechas": [
            {"id": a.id, "de": a.de, "a": a.a, "label": a.label}
            for a in board.arrows.values()
        ],
        "anotaciones": [
            {"id": an.id, "nodo_id": an.nodo_id, "texto": an.texto}
            for an in board.annotations.values()
        ],
    }


async def architect(state: GraphState) -> dict:
    session_id = state["session_id"]
    digest = state["digest"]
    revision = digest["revision"]
    points = state["routes"]["architect"]

    if not points:
        return {}

    settings = get_settings()
    if not settings.openai_api_key:
        return {}

    session = store.get(session_id)
    board = session.architect_board

    allowed_ids = {p["id"] for p in points}
    payload = {
        "reunion": session.brief,
        "contexto": digest["summary"],
        "repo": repo.summary(session.repo),
        "ideas": [
            {
                "id": p["id"],
                "text": p["text"],
                "kind": KIND_STYLE.get(p["kind"], "idea"),
                "en_pizarra": p["id"] in board.nodes,
            }
            for p in points
        ],
        "pizarra_actual": _serialise_board(board),
    }

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    started = time.time()
    try:
        resp = await client.chat.completions.create(
            model=settings.openai_architect_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
            tools=_tools(),
            tool_choice="auto",
            temperature=0.2,
        )
    except Exception:
        # A model call the API refused is not the moment to guess at ops. The
        # board keeps what it had; the next revision tries again.
        logger.exception("architect call failed session=%s rev=%s", session_id, revision)
        return {}

    tool_calls = resp.choices[0].message.tool_calls or []
    emitted = 0
    for call in tool_calls:
        try:
            args = json.loads(call.function.arguments)
        except Exception:
            continue
        if not isinstance(args, dict):
            continue
        # borrar wipes the target, so its cursor spot has to be read now.
        # Everything else reads its position from the op payload after apply.
        pre_cursor = (
            architect_board.cursor_before_borrar(board, _text(args.get("id")))
            if call.function.name == "borrar"
            else None
        )
        op = _apply(board, call.function.name, args, allowed_ids)
        if not op:
            continue
        cursor = pre_cursor or architect_board.cursor_from_op(board, op)
        if cursor is not None:
            # The cursor lands first so the front can slide the pointer across
            # the pizarra before the op appears where it stopped.
            await emit(
                session_id,
                "agent.cursor",
                {"agent": "architect", "x": cursor[0], "y": cursor[1]},
            )
        await emit(
            session_id, "architect.op", {"revision": revision, "op": op}
        )
        emitted += 1
        # A small pause so the front can animate one op before the next lands.
        # Without it a five-op turn arrives as a single blink and reads as the
        # old whole-board redraw.
        await asyncio.sleep(OP_INTERVAL_SEC)

    # Snapshot the board so a browser that joins the session later has
    # something to render from /digest without waiting for the next op.
    store.set_board(session_id, revision, architect_board.to_elements(board))

    logger.info(
        "architect rev=%s calls=%s ops=%s in %.2fs session=%s",
        revision,
        len(tool_calls),
        emitted,
        time.time() - started,
        session_id,
    )
    return {}
