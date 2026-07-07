from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.enums import TipoMovimiento

class SuministroBase(BaseModel):
    nombre: str
    unidad: str
    stock_actual: float = 0.0
    stock_minimo: float = 0.0
    activo: bool = True

class SuministroCreate(SuministroBase):
    pass

class SuministroUpdate(BaseModel):
    nombre: Optional[str] = None
    unidad: Optional[str] = None
    stock_minimo: Optional[float] = None
    activo: Optional[bool] = None

class SuministroOut(SuministroBase):
    model_config = ConfigDict(from_attributes=True)
    id: int

class MovimientoInventarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    suministro_id: int
    suministro_nombre: Optional[str] = None # Agregamos nombre para reportes
    tipo: TipoMovimiento
    cantidad: float
    motivo: Optional[str] = None
    referencia_id: Optional[int] = None
    creado_en: datetime

class AjusteInventarioCreate(BaseModel):
    cantidad: float
    tipo: TipoMovimiento # entrada, salida, ajuste
    motivo: str
