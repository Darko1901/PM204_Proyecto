from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.finanzas import Compra, Pago
    from app.models.operacion import Cuenta


class Rol(Base):
    __tablename__ = "rol"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(String(150), nullable=True)

    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuario"

    id: Mapped[int] = mapped_column(primary_key=True)
    rol_id: Mapped[int] = mapped_column(
        ForeignKey("rol.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    nombre_completo: Mapped[str] = mapped_column(String(120), nullable=False)
    correo: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    activo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    creado_en: Mapped[datetime | None] = mapped_column(
        nullable=True, server_default=func.now()
    )

    rol: Mapped["Rol"] = relationship(back_populates="usuarios")
    cuentas_atendidas: Mapped[list["Cuenta"]] = relationship(back_populates="mesero")
    pagos_registrados: Mapped[list["Pago"]] = relationship(back_populates="cajero")
    compras_registradas: Mapped[list["Compra"]] = relationship(back_populates="cajero")
