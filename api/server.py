"""
BarrioYa — Adapter para el entorno de Emergent.
Re-exporta `app` desde main.py para que supervisor lo encuentre como `server:app`.

Este archivo NO sustituye a main.py; main.py sigue siendo el entry point local
(`python main.py` para correr en localhost:8000).
"""

from main import app  # noqa: F401  (re-export)
