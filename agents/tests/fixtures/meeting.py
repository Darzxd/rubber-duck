"""A scripted meeting we replay against the Organizer.

`SCRIPT` is what the microphone would deliver: fragments, filler, laughter,
system chatter and two real topics tangled together. `EXPECT` is what a good
Organizer should end up with — it is the target we iterate the prompt against,
not an assertion of exact wording.
"""

Line = tuple[str, str, float]

# (author, text, seconds since the meeting started)
SCRIPT: list[Line] = [
    ("Ignacio", "Hola, se escucha?", 0.0),
    ("Nico", "Si", 1.4),
    ("Ignacio", "Dale", 2.0),
    ("Nico", "jajaja", 2.6),
    ("Ignacio", "Bueno, arrancamos", 4.0),
    # Topic A — where the transcript lives.
    (
        "Ignacio",
        "Che, tenemos que decidir donde guardamos la transcripcion",
        6.0,
    ),
    ("Ignacio", "porque ahora esta todo en memoria del backend", 8.2),
    ("Nico", "y si se cae el server perdemos todo", 10.5),
    ("Ignacio", "exacto, se pierde todo", 12.0),
    (
        "Ignacio",
        "yo lo guardaria en Supabase pero solo el snapshot final",
        14.0,
    ),
    ("Nico", "mmm", 16.0),
    (
        "Nico",
        "yo no guardaria la transcripcion completa, es un monton de texto",
        17.5,
    ),
    ("Nico", "y no la vamos a leer nunca despues", 20.0),
    ("Ignacio", "si, con el snapshot del canvas alcanza", 22.0),
    ("Ignacio", "una tabla sola, sessions, y adentro el jsonb", 24.0),
    ("Nico", "dale, me cierra", 26.5),
    # Noise in the middle.
    ("Ignacio", "eh", 28.0),
    ("Nico", "jaja", 28.5),
    # Topic B — a different subject entirely.
    ("Nico", "otra cosa, el tema de los colores por persona", 31.0),
    (
        "Nico",
        "cada uno tendria que tener un color fijo cuando entra a la sesion",
        33.0,
    ),
    ("Nico", "asi ves de quien es cada nota sin leer el nombre", 36.0),
    ("Ignacio", "y el color de donde sale", 38.5),
    ("Nico", "lo asigno yo en el orden en que van entrando", 40.0),
    ("Nico", "cinco colores y despues repite", 42.0),
    ("Ignacio", "ok, mientras sea el mismo color en todas las pantallas", 44.0),
    ("Nico", "si, va con el id de la sesion", 46.5),
    # Meta chatter that must never reach the board.
    ("Ignacio", "esta sesion cual es, la tres?", 50.0),
    ("Nico", "no se, probando", 52.0),
]

EXPECT = {
    "points": [
        "guardar solo el snapshot del canvas en Supabase",
        "no guardar la transcripcion completa por tamano",
        "una tabla sessions con un jsonb adentro",
        "color fijo por persona, asignado al entrar",
        "el color va con el id de la sesion",
    ],
    "dropped": ["Hola, se escucha?", "esta sesion cual es, la tres?", "jajaja"],
}


def chunks(base_ts: float = 0.0) -> list[dict]:
    return [
        {"author": a, "text": t, "ts": base_ts + off} for a, t, off in SCRIPT
    ]
