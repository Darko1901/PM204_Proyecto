from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.inventario import DetalleCompra, MovimientoInventario
    from app.models.operacion import DetalleCuenta


class Producto(Base):
    __tablename__ = "producto"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    precio: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    categoria: Mapped[str | None] = mapped_column(String(60), nullable=True)
    disponible: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )

    recetas: Mapped[list["Receta"]] = relationship(back_populates="producto")
    detalles_cuenta: Mapped[list["DetalleCuenta"]] = relationship(back_populates="producto")


class Suministro(Base):
    __tablename__ = "suministro"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    unidad: Mapped[str] = mapped_column(String(20), nullable=False)
    stock_actual: Mapped[float] = mapped_column(
        Numeric(12, 3), nullable=False, server_default=text("0")
    )
    stock_minimo: Mapped[float] = mapped_column(
        Numeric(12, 3), nullable=False, server_default=text("0")
    )
    activo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )

    recetas: Mapped[list["Receta"]] = relationship(back_populates="suministro")
    detalles_compra: Mapped[list["DetalleCompra"]] = relationship(back_populates="suministro")
    movimientos: Mapped[list["MovimientoInventario"]] = relationship(back_populates="suministro")


class Receta(Base):
    __tablename__ = "receta"
    __table_args__ = (UniqueConstraint("producto_id", "suministro_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    producto_id: Mapped[int] = mapped_column(
        ForeignKey("producto.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    suministro_id: Mapped[int] = mapped_column(
        ForeignKey("suministro.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    cantidad: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)

    producto: Mapped["Producto"] = relationship(back_populates="recetas")
    suministro: Mapped["Suministro"] = relationship(back_populates="recetas")
