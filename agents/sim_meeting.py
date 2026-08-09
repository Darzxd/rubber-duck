"""Feeds a real-shaped meeting through /ingest at the pace people speak.

Five people, interrupting each other, with the speech recogniser cutting lines
mid-sentence — the board is never tested by clean paragraphs typed by hand."""

import argparse
import asyncio
import time

import httpx

BRIEF = "Definir el modelo de cobro y qué entra en el plan gratis antes del lanzamiento"

# (author, text, seconds to wait before saying it)
SCRIPT: list[tuple[str, str, float]] = [
    ("Ignacio", "Bueno, ¿se escucha todo bien?", 0.5),
    ("Nico", "Sí sí, perfecto.", 1.0),
    ("Sofía", "Yo escucho bien también", 0.8),
    ("Ignacio", "Dale, arrancamos.", 1.0),
    ("Ignacio", "El tema de hoy es cómo cobramos, porque lanzamos en tres semanas", 1.5),
    ("Ignacio", "y todavía no tenemos nada definido.", 1.2),
    ("Martín", "Yo venía pensando en esto. Creo que", 1.4),
    ("Martín", "tenemos que ir con Stripe, es lo más rápido de integrar.", 1.5),
    ("Sofía", "¿Stripe cobra por transacción o hay un fijo mensual?", 1.6),
    ("Martín", "Es por transacción, 2.9 más treinta centavos.", 1.5),
    ("Laura", "Che pero para cobrar con Stripe necesitamos el dominio propio", 1.8),
    ("Laura", "no nos deja con un subdominio de Vercel.", 1.3),
    ("Ignacio", "Uh, cierto. Eso no lo tenemos todavía.", 1.4),
    ("Nico", "jajaja", 0.7),
    ("Ignacio", "Bueno, queda como pendiente registrar el dominio esta semana.", 1.6),
    ("Martín", "Igual yo diría que vamos con Stripe y listo, no le demos más vueltas.", 1.8),
    ("Sofía", "Sí, de acuerdo. Stripe.", 1.2),
    ("Laura", "Dale.", 0.8),
    ("Ignacio", "Listo, decidido: Stripe.", 1.2),
    ("Sofía", "Ahora, el plan gratis. ¿Hasta dónde llega?", 1.7),
    ("Nico", "Yo pondría un límite de sesiones, no de tiempo.", 1.6),
    ("Nico", "Tipo tres sesiones por mes y después te pide la tarjeta.", 1.5),
    ("Martín", "Tres me parece poco, la gente no llega a probarlo bien.", 1.8),
    ("Sofía", "Cinco estaría mejor.", 1.2),
    ("Laura", "Pero cada sesión nos cuesta plata en la API, ojo con eso.", 1.9),
    ("Laura", "Si le damos cinco gratis a todo el mundo nos fundimos.", 1.5),
    ("Ignacio", "¿Cuánto nos sale una sesión en realidad? Alguien lo midió?", 1.8),
    ("Martín", "No, nadie lo midió todavía.", 1.3),
    ("Ignacio", "Ok, eso hay que medirlo antes de decidir el número.", 1.6),
    ("Nico", "Igual el límite es de sesiones, eso sí queda.", 1.5),
    ("Ignacio", "Sí, el mecanismo queda: límite por sesiones. El número lo definimos", 1.7),
    ("Ignacio", "cuando tengamos el costo real.", 1.2),
    ("Sofía", "¿Y qué pasa con las sesiones que ya están abiertas cuando se te acaba el plan?", 2.0),
    ("Martín", "Ni idea, buena pregunta.", 1.4),
    ("Laura", "Otra cosa: el link de solo lectura de la reunión, ¿es gratis siempre?", 1.9),
    ("Ignacio", "Eso sí, el link compartido tiene que ser gratis siempre.", 1.6),
    ("Ignacio", "Es lo que nos trae gente nueva.", 1.2),
    ("Nico", "Buenísimo, eso me cierra.", 1.3),
]


async def main(session_id: str, base: str, speed: float) -> None:
    async with httpx.AsyncClient(base_url=base, timeout=10.0) as client:
        await client.post("/brief", json={"session_id": session_id, "brief": BRIEF})
        print(f"sesión {session_id} · brief puesto · {len(SCRIPT)} líneas\n")
        for author, text, wait in SCRIPT:
            await asyncio.sleep(wait / speed)
            await client.post(
                "/ingest",
                json={
                    "session_id": session_id,
                    "author": author,
                    "text": text,
                    "ts": time.time(),
                },
            )
            print(f"  {author:8} {text}")
        print("\nse terminó de hablar; los agentes siguen trabajando")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("session_id")
    p.add_argument("--base", default="http://localhost:8000")
    p.add_argument("--speed", type=float, default=1.0)
    asyncio.run(main(p.parse_args().session_id, p.parse_args().base, p.parse_args().speed))
