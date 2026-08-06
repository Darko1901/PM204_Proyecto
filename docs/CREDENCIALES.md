# Credenciales — Sistema de Gestión de Cafetería

Generadas por `api/app/seed.py` (única fuente de verdad). Correr `python -m
app.seed --demo` las deja listas junto con datos de ejemplo.

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@cafeteria.com | cafe2026 |
| Mesero | mesero@cafeteria.com | cafe2026 |
| Caja | caja@cafeteria.com | cafe2026 |
| Cocina | cocina@cafeteria.com | cafe2026 |

## URLs

| Componente | URL |
|---|---|
| Web (panel admin) | http://localhost:5173 |
| API | http://localhost:8000 |
| Documentación del API (Swagger) | http://localhost:8000/docs |

**Nota:** el portal web es exclusivo del rol Administrador; Mesero, Caja y Cocina inician sesión desde la app móvil.
