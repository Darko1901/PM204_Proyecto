from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class MesaBase(BaseModel):
    numero: int
    capacidad: int | None = None


class MesaCreate(MesaBase):
    pass


class MesaUpdate(BaseModel):
    capacidad: int | None = None
    activa: bool | None = None


class MesaOut(MesaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activa: bool


class CuentaCreate(BaseModel):
    tipo: str
    mesa_id: int | None = None

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        if v not in ("en_mesa", "para_llevar"):
            raise ValueError("Tipo de cuenta inválido")
        return v


class CuentaEstado(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        if v not in ("abierta", "por_cobrar", "pagada", "cancelada"):
            raise ValueError("Estado de cuenta inválido")
        return v


class ItemCreate(BaseModel):
    producto_id: int
    cantidad: int = 1
    observaciones: str | None = None

    @field_validator("cantidad")
    @classmethod
    def validar_cantidad(cls, v: int) -> int:
        if v < 1:
            raise ValueError("La cantidad debe ser al menos 1")
        return v


class ItemEstado(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        if v not in ("pendiente", "en_preparacion", "listo", "entregado", "cancelado"):
            raise ValueError("Estado de ítem inválido")
        return v


class DetalleCuentaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cuenta_id: int
    producto_id: int
    cantidad: int
    precio_unitario: float
    observaciones: str | None
    estado: str
    creado_en: datetime | None


class CuentaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mesa_id: int | None
    mesero_id: int
    tipo: str
    estado: str
    total: float
    abierta_en: datetime | None
    cerrada_en: datetime | None


class CuentaDetalleOut(CuentaOut):
    detalles: list[DetalleCuentaOut] = []
