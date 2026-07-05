from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models.enums import TipoCuenta, EstadoCuenta, EstadoCocina, MetodoPago

class MesaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    numero: int
    capacidad: Optional[int] = None
    activa: bool

class DetalleCuentaBase(BaseModel):
    producto_id: int
    cantidad: int = 1
    observaciones: Optional[str] = None

class DetalleCuentaCreate(DetalleCuentaBase):
    pass

class DetalleCuentaOut(DetalleCuentaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cuenta_id: int
    producto_nombre: Optional[str] = None
    precio_unitario: float
    estado: EstadoCocina
    creado_en: datetime

class DetalleCuentaUpdate(BaseModel):
    estado: Optional[EstadoCocina] = None
    cantidad: Optional[int] = None
    observaciones: Optional[str] = None

class CuentaCreate(BaseModel):
    mesa_id: Optional[int] = None
    tipo: TipoCuenta
    detalles: List[DetalleCuentaCreate] = []

class CuentaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    mesa_id: Optional[int] = None
    mesa_numero: Optional[int] = None
    mesero_id: int
    mesero_nombre: Optional[str] = None
    tipo: TipoCuenta
    estado: EstadoCuenta
    total: float
    abierta_en: datetime
    cerrada_en: Optional[datetime] = None
    detalles: List[DetalleCuentaOut] = []

class PagoCreate(BaseModel):
    metodo: MetodoPago

class PagoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cuenta_id: int
    cajero_id: int
    metodo: MetodoPago
    monto: float
    pagado_en: datetime

class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cuenta_id: int
    folio: str
    total: float
    emitido_en: datetime
