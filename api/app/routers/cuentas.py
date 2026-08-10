from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.catalogo import Producto
from app.models.operacion import Cuenta, DetalleCuenta, Mesa
from app.models.seguridad import Usuario
from app.schemas.operacion import (
    CuentaCreate,
    CuentaDetalleOut,
    CuentaEstado,
    CuentaOut,
    ItemCreate,
)

router = APIRouter(prefix="/cuentas", tags=["cuentas"])

_ESTADOS_ABIERTOS = ("abierta", "por_cobrar")


def _recalcular_total(db: Session, cuenta: Cuenta) -> None:
    total = sum(
        float(d.precio_unitario) * d.cantidad
        for d in cuenta.detalles
        if d.estado != "cancelado"
    )
    cuenta.total = total


def _cuenta_o_404(db: Session, cuenta_id: int) -> Cuenta:
    cuenta = db.execute(
        select(Cuenta)
        .options(joinedload(Cuenta.detalles))
        .where(Cuenta.id == cuenta_id)
    ).unique().scalar_one_or_none()
    if cuenta is None:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    return cuenta


@router.get("", response_model=list[CuentaOut])
def listar_cuentas(
    estado: str | None = None,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(*roles.TODOS)),
) -> list[Cuenta]:
    q = select(Cuenta).order_by(Cuenta.abierta_en.desc())
    if estado is not None:
        q = q.where(Cuenta.estado == estado)
    return list(db.execute(q).scalars().all())


@router.get("/{cuenta_id}", response_model=CuentaDetalleOut)
def detalle_cuenta(
    cuenta_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(*roles.TODOS)),
) -> Cuenta:
    return _cuenta_o_404(db, cuenta_id)


@router.post("", response_model=CuentaOut, status_code=201)
def abrir_cuenta(
    body: CuentaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(roles.MESERO, roles.ADMIN)),
) -> Cuenta:
    if body.tipo == "en_mesa":
        if body.mesa_id is None:
            raise HTTPException(status_code=422, detail="Se requiere mesa_id para cuentas en_mesa")
        mesa = db.get(Mesa, body.mesa_id)
        if mesa is None or not mesa.activa:
            raise HTTPException(status_code=422, detail="Mesa no válida")
        if db.execute(
            select(Cuenta).where(
                Cuenta.mesa_id == body.mesa_id, Cuenta.estado.in_(_ESTADOS_ABIERTOS)
            )
        ).scalar_one_or_none():
            raise HTTPException(status_code=409, detail="La mesa ya tiene una cuenta abierta")

    cuenta = Cuenta(
        mesa_id=body.mesa_id if body.tipo == "en_mesa" else None,
        mesero_id=current_user.id,
        tipo=body.tipo,
        estado="abierta",
        total=0,
        abierta_en=datetime.now(timezone.utc),
    )
    db.add(cuenta)
    db.commit()
    db.refresh(cuenta)
    return cuenta


@router.post("/{cuenta_id}/items", response_model=CuentaDetalleOut, status_code=201)
def agregar_item(
    cuenta_id: int,
    body: ItemCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.MESERO, roles.ADMIN)),
) -> Cuenta:
    cuenta = _cuenta_o_404(db, cuenta_id)
    if cuenta.estado != "abierta":
        raise HTTPException(status_code=409, detail="La cuenta no está abierta")

    producto = db.get(Producto, body.producto_id)
    if producto is None or not producto.disponible:
        raise HTTPException(status_code=422, detail="Producto no disponible")

    item = DetalleCuenta(
        cuenta_id=cuenta_id,
        producto_id=body.producto_id,
        cantidad=body.cantidad,
        precio_unitario=producto.precio,
        observaciones=body.observaciones,
        estado="pendiente",
        creado_en=datetime.now(timezone.utc),
    )
    db.add(item)
    db.flush()
    db.refresh(cuenta)
    _recalcular_total(db, cuenta)
    db.commit()
    return _cuenta_o_404(db, cuenta_id)


@router.patch("/{cuenta_id}/estado", response_model=CuentaOut)
def cambiar_estado_cuenta(
    cuenta_id: int,
    body: CuentaEstado,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.MESERO, roles.CAJA, roles.ADMIN)),
) -> Cuenta:
    cuenta = _cuenta_o_404(db, cuenta_id)

    transiciones_validas = {
        "abierta": {"por_cobrar", "cancelada"},
        "por_cobrar": {"abierta", "cancelada"},
    }
    if cuenta.estado not in transiciones_validas or body.estado not in transiciones_validas[cuenta.estado]:
        raise HTTPException(
            status_code=409,
            detail=f"No se puede cambiar de '{cuenta.estado}' a '{body.estado}'",
        )

    cuenta.estado = body.estado
    if body.estado == "cancelada":
        cuenta.cerrada_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cuenta)
    return cuenta
