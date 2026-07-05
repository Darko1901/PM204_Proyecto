from fastapi import FastAPI

from app.routers import (
    auth,
    compras,
    cuentas,
    health,
    items,
    mesas,
    pagos,
    productos,
    recetas,
    reportes,
    roles,
    suministros,
    usuarios,
)

app = FastAPI(title="API Cafetería", version="0.1.0")

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(roles.router)
app.include_router(productos.router)
app.include_router(suministros.router)
app.include_router(recetas.router)
app.include_router(mesas.router)
app.include_router(cuentas.router)
app.include_router(items.router)
app.include_router(pagos.router)
app.include_router(compras.router)
app.include_router(reportes.router)
