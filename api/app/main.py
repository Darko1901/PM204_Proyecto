from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    compras,
    estadisticas,
    health,
    items,
    operaciones,
    productos,
    reportes,
    roles,
    suministros,
    usuarios,
)

app = FastAPI(title="API Cafetería", version="0.1.0")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir cualquier origen en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(roles.router)
app.include_router(productos.router)
app.include_router(suministros.router)
app.include_router(compras.router)
app.include_router(operaciones.router)
app.include_router(estadisticas.router)
app.include_router(reportes.router)
app.include_router(items.router)
