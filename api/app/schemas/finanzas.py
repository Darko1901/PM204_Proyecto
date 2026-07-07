from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class PagoCreate(BaseModel):
    metodo: str
    monto: float

    @field_validator("metodo")
    @classmethod
    def validar_metodo(cls, v: str) -> str:
        if v not in ("efectivo", "tarjeta", "transferencia", "otro"):
            raise ValueError("Método de pago inválido")
        return v

    @field_validator("monto")
    @classmethod
    def validar_monto(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0")
        return v


class PagoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cuenta_id: int
    cajero_id: int
    metodo: str
    monto: float
    pagado_en: datetime | None


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cuenta_id: int
    folio: str
    total: float
    emitido_en: datetime | None


class CobroOut(BaseModel):
    pago: PagoOut
    ticket: TicketOut


class DetalleCompraCreate(BaseModel):
    suministro_id: int
    cantidad: float
    costo_unitario: float

    @field_validator("cantidad")
    @classmethod
    def validar_cantidad(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")
        return v

    @field_validator("costo_unitario")
    @classmethod
    def validar_costo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El costo unitario debe ser mayor a 0")
        return v


class CompraCreate(BaseModel):
    proveedor: str | None = None
    lineas: list[DetalleCompraCreate]

    @field_validator("lineas")
    @classmethod
    def validar_lineas(cls, v: list[DetalleCompraCreate]) -> list[DetalleCompraCreate]:
        if not v:
            raise ValueError("La compra debe tener al menos una línea")
        return v


class DetalleCompraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    suministro_id: int
    cantidad: float
    costo_unitario: float


class CompraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cajero_id: int
    proveedor: str | None
    total: float
    comprado_en: datetime | None
    detalles: list[DetalleCompraOut] = []
