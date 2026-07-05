from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class DetalleCompraBase(BaseModel):
    suministro_id: int
    cantidad: float
    costo_unitario: float

class DetalleCompraCreate(DetalleCompraBase):
    pass

class DetalleCompraOut(DetalleCompraBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    compra_id: int
    suministro_nombre: Optional[str] = None # Para mostrar el nombre en el front

class CompraCreate(BaseModel):
    proveedor: Optional[str] = None
    detalles: List[DetalleCompraCreate]

class CompraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cajero_id: int
    cajero_nombre: Optional[str] = None # Nombre del cajero/administrador
    proveedor: Optional[str] = None
    total: float
    comprado_en: datetime
    detalles: List[DetalleCompraOut] = []
