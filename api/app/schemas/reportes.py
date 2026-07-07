from datetime import date

from pydantic import BaseModel


class VentaPorDia(BaseModel):
    fecha: date
    total: float


class ProductoVendido(BaseModel):
    producto_id: int
    nombre: str
    cantidad: float


class ResumenReporte(BaseModel):
    desde: date | None
    hasta: date | None
    ventas_totales: float
    gastos_totales: float
    ganancias: float
    ventas_por_dia: list[VentaPorDia]
    productos_mas_vendidos: list[ProductoVendido]
    productos_menos_vendidos: list[ProductoVendido]


class VentasHoy(BaseModel):
    total: float
    tickets_emitidos: int
