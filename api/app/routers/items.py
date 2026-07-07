from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.catalogo import Receta, Suministro
from app.models.inventario import MovimientoInventario
from app.models.operacion import DetalleCuenta
from app.models.seguridad import Usuario
from app.schemas.operacion import DetalleCuentaOut, ItemEstado

router = APIRouter(prefix="/items", tags=["items"])

_TRANSICIONES = {
    "pendiente": {"en_preparacion", "cancelado"},
    "en_preparacion": {"listo", "cancelado"},
    "listo": {"entregado"},
}


def _item_o_404(db: Session, item_id: int) -> DetalleCuenta:
    item = db.get(DetalleCuenta, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    return item


def _descontar_inventario(db: Session, item: DetalleCuenta) -> None:
    lineas = list(
        db.execute(select(Receta).where(Receta.producto_id == item.producto_id)).scalars().all()
    )
    requerido: dict[int, float] = {}
    for linea in lineas:
        requerido[linea.suministro_id] = requerido.get(linea.suministro_id, 0) + float(
            linea.cantidad
        ) * item.cantidad

    suministros = {
        s.id: s
        for s in db.execute(
            select(Suministro).where(Suministro.id.in_(requerido.keys()))
        ).scalars()
    }
    for suministro_id, cantidad in requerido.items():
        suministro = suministros.get(suministro_id)
        if suministro is None or float(suministro.stock_actual) < cantidad:
            raise HTTPException(
                status_code=409,
                detail=f"Stock insuficiente de '{suministro.nombre if suministro else suministro_id}'",
            )

    for suministro_id, cantidad in requerido.items():
        suministro = suministros[suministro_id]
        suministro.stock_actual = float(suministro.stock_actual) - cantidad
        db.add(
            MovimientoInventario(
                suministro_id=suministro_id,
                tipo="salida",
                cantidad=cantidad,
                motivo="consumo_cocina",
                referencia_id=item.id,
                creado_en=datetime.now(timezone.utc),
            )
        )


@router.get("", response_model=list[DetalleCuentaOut])
def listar_items(
    estado: str | None = None,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(*roles.TODOS)),
) -> list[DetalleCuenta]:
    q = select(DetalleCuenta).order_by(DetalleCuenta.creado_en)
    if estado is not None:
        estados = [e.strip() for e in estado.split(",")]
        q = q.where(DetalleCuenta.estado.in_(estados))
    return list(db.execute(q).scalars().all())


@router.get("/{item_id}", response_model=DetalleCuentaOut)
def detalle_item(
    item_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(*roles.TODOS)),
) -> DetalleCuenta:
    return _item_o_404(db, item_id)


@router.patch("/{item_id}/estado", response_model=DetalleCuentaOut)
def cambiar_estado_item(
    item_id: int,
    body: ItemEstado,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.COCINA, roles.MESERO, roles.ADMIN)),
) -> DetalleCuenta:
    item = _item_o_404(db, item_id)

    if item.estado not in _TRANSICIONES or body.estado not in _TRANSICIONES[item.estado]:
        raise HTTPException(
            status_code=409,
            detail=f"No se puede cambiar de '{item.estado}' a '{body.estado}'",
        )

    if body.estado == "listo":
        _descontar_inventario(db, item)

    item.estado = body.estado
    db.commit()
    db.refresh(item)
    return item
