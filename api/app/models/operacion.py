from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import EstadoCocina, EstadoCuenta, TipoCuenta, enum_col

if TYPE_CHECKING:
    from app.models.catalogo import Producto
    from app.models.finanzas import Pago, Ticket
    from app.models.seguridad import Usuario


class Mesa(Base):
    __tablename__ = "mesa"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    capacidad: Mapped[int | None] = mapped_column(Integer, nullable=True)
    activa: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )

    cuentas: Mapped[list["Cuenta"]] = relationship(back_populates="mesa")


class Cuenta(Base):
    __tablename__ = "cuenta"

    id: Mapped[int] = mapped_column(primary_key=True)
    mesa_id: Mapped[int | None] = mapped_column(
        ForeignKey("mesa.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    mesero_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    tipo: Mapped[str] = mapped_column(enum_col(TipoCuenta), nullable=False)
    estado: Mapped[str] = mapped_column(
        enum_col(EstadoCuenta), nullable=False, server_default=text("'abierta'")
    )
    total: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, server_default=text("0")
    )
    abierta_en: Mapped[datetime | None] = mapped_column(
        nullable=True, server_default=func.now()
    )
    cerrada_en: Mapped[datetime | None] = mapped_column(nullable=True)

    mesa: Mapped["Mesa | None"] = relationship(back_populates="cuentas")
    mesero: Mapped["Usuario"] = relationship(back_populates="cuentas_atendidas")
    detalles: Mapped[list["DetalleCuenta"]] = relationship(back_populates="cuenta")
    pagos: Mapped[list["Pago"]] = relationship(back_populates="cuenta")
    ticket: Mapped["Ticket | None"] = relationship(back_populates="cuenta")


class DetalleCuenta(Base):
    __tablename__ = "detalle_cuenta"

    id: Mapped[int] = mapped_column(primary_key=True)
    cuenta_id: Mapped[int] = mapped_column(
        ForeignKey("cuenta.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    producto_id: Mapped[int] = mapped_column(
        ForeignKey("producto.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    cantidad: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("1")
    )
    precio_unitario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(String(255), nullable=True)
    estado: Mapped[str] = mapped_column(
        enum_col(EstadoCocina), nullable=False, server_default=text("'pendiente'")
    )
    creado_en: Mapped[datetime | None] = mapped_column(
        nullable=True, server_default=func.now()
    )

    cuenta: Mapped["Cuenta"] = relationship(back_populates="detalles")
    producto: Mapped["Producto"] = relationship(back_populates="detalles_cuenta")
