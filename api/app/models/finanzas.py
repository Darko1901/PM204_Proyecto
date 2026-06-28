from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import MetodoPago, enum_col

if TYPE_CHECKING:
    from app.models.inventario import DetalleCompra
    from app.models.operacion import Cuenta
    from app.models.seguridad import Usuario


class Pago(Base):
    __tablename__ = "pago"

    id: Mapped[int] = mapped_column(primary_key=True)
    cuenta_id: Mapped[int] = mapped_column(
        ForeignKey("cuenta.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    cajero_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    metodo: Mapped[str] = mapped_column(enum_col(MetodoPago), nullable=False)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    pagado_en: Mapped[datetime | None] = mapped_column(
        nullable=True, server_default=func.now()
    )

    cuenta: Mapped["Cuenta"] = relationship(back_populates="pagos")
    cajero: Mapped["Usuario"] = relationship(back_populates="pagos_registrados")


class Ticket(Base):
    __tablename__ = "ticket"
    __table_args__ = (UniqueConstraint("cuenta_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    cuenta_id: Mapped[int] = mapped_column(
        ForeignKey("cuenta.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    folio: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    emitido_en: Mapped[datetime | None] = mapped_column(
        nullable=True, server_default=func.now()
    )

    cuenta: Mapped["Cuenta"] = relationship(back_populates="ticket")


class Compra(Base):
    __tablename__ = "compra"

    id: Mapped[int] = mapped_column(primary_key=True)
    cajero_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    proveedor: Mapped[str | None] = mapped_column(String(120), nullable=True)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    comprado_en: Mapped[datetime | None] = mapped_column(
        nullable=True, server_default=func.now()
    )

    cajero: Mapped["Usuario"] = relationship(back_populates="compras_registradas")
    detalles: Mapped[list["DetalleCompra"]] = relationship(back_populates="compra")
