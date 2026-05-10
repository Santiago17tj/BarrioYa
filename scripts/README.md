# BarrioYa — Scripts auxiliares

Scripts Python de uso puntual (NO se ejecutan en producción ni durante el build).
Originalmente estaban en la raíz del repo; movidos aquí en la limpieza de Fase 3.

| Script | Propósito |
|---|---|
| `apply_colors.py` | Aplica una paleta de colores en CSS (helper de diseño). |
| `bust_cache.py` | Añade `?v=N` a referencias de assets en HTMLs. |
| `bust_img_cache.py` | Idem, pero solo para imágenes. |
| `fix_admin.py` | Parche rápido al módulo admin (legacy). |
| `fix_buttons.py` | Normalizó estilos de botones (legacy). |
| `fix_shadows.py` | Ajustó sombras CSS (legacy). |
| `merge.py` | Mergea archivos CSS (legacy). |
| `run_sql.py` | Ejecuta `database_setup_es.sql` contra Supabase. |
| `update_html.py` | Replace masivo en HTMLs. |

> **Recomendación**: la mayoría son legacy y pueden eliminarse. `run_sql.py` es el único útil para inicializar la base.
