"""
BarrioYa — Cliente Supabase
Inicializa la conexión con la base de datos Supabase usando las credenciales.
"""

import logging
from typing import Any
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None

from config.settings import SUPABASE_URL, SUPABASE_ANON_KEY

logger = logging.getLogger("barrioya.db")

def get_supabase() -> Any:
    """
    Inicializa y devuelve el cliente de Supabase.
    Si faltan credenciales o la librería, devuelve None.
    """
    if not SUPABASE_AVAILABLE:
        logger.warning("⚠️  Librería 'supabase' no instalada. Usando fallback en memoria.")
        return None
        
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        logger.warning(
            "⚠️  Credenciales de Supabase no encontradas. "
            "Asegúrate de definir SUPABASE_URL y SUPABASE_ANON_KEY."
        )
        return None
        
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        return supabase
    except Exception as e:
        logger.error("❌ Error inicializando Supabase: %s", e)
        return None

# Instancia global exportada
supabase_client = get_supabase()
export_vars = ["supabase_client", "SUPABASE_AVAILABLE"]
