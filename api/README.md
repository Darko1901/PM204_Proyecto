# api — Backend FastAPI

## Requisitos

- Python 3.11+
- PostgreSQL

## Configuración

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edita con tus credenciales reales
```

## Ejecución

```bash
uvicorn app.main:app --reload
```

El endpoint de salud queda disponible en `GET /health`.

## Migraciones (Alembic)

```bash
alembic current          # revisión actual
alembic upgrade head     # aplicar migraciones pendientes
alembic revision --autogenerate -m "descripcion"  # generar nueva migración
```
