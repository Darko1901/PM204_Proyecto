from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import TipoMovimiento, enum_col

if TYPE_CHECKING:
    from app.models.catalogo import Suministro
    from app.models.finanzas import Compra


class DetalleCompra(Base):
    __tablename__ = "detalle_compra"

    id: Mapped[int] = mapped_column(primary_key=True)
    compra_id: Mapped[int] = mapped_column(
        ForeignKey("compra.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    suministro_id: Mapped[int] = mapped_column(
        ForeignKey("suministro.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    cantidad: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    costo_unitario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    compra: Mapped["Compra"] = relationship(back_populates="detalles")
    suministro: Mapped["Suministro"] = relationship(back_populates="detalles_compra")


class MovimientoInventario(Base):
    __tablename__ = "movimiento_inventario"

    id: Mapped[int] = mapped_column(primary_key=True)
    suministro_id: Mapped[int] = mapped_column(
        ForeignKey("suministro.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    tipo: Mapped[str] = mapped_column(enum_col(TipoMovimiento), nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    motivo: Mapped[str | None] = mapped_column(String(60), nullable=True)
    referencia_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    creado_en: Mapped[datetime | None] = mapped_column(
        nullable=True, server_default=func.now()
    )

    suministro: Mapped["Suministro"] = relationship(back_populates="movimientos")
