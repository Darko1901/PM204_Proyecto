from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.catalogo import Suministro
from app.models.finanzas import Compra
from app.models.inventario import DetalleCompra, MovimientoInventario
from app.models.seguridad import Usuario
from app.schemas.finanzas import CompraCreate, CompraOut

router = APIRouter(prefix="/compras", tags=["compras"])


@router.get("", response_model=list[CompraOut])
def listar_compras(
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.CAJA, roles.ADMIN)),
) -> list[Compra]:
    q = (
        select(Compra)
        .options(joinedload(Compra.detalles))
        .order_by(Compra.comprado_en.desc())
    )
    return list(db.execute(q).unique().scalars().all())


@router.post("", response_model=CompraOut, status_code=201)
def registrar_compra(
    body: CompraCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(roles.CAJA, roles.ADMIN)),
) -> Compra:
    suministro_ids = {linea.suministro_id for linea in body.lineas}
    suministros = {
        s.id: s
        for s in db.execute(
            select(Suministro).where(Suministro.id.in_(suministro_ids))
        ).scalars()
    }
    faltantes = suministro_ids - suministros.keys()
    if faltantes:
        raise HTTPException(status_code=422, detail=f"Suministros no válidos: {sorted(faltantes)}")

    ahora = datetime.now(timezone.utc)
    total = sum(linea.cantidad * linea.costo_unitario for linea in body.lineas)

    compra = Compra(
        cajero_id=current_user.id,
        proveedor=body.proveedor,
        total=total,
        comprado_en=ahora,
    )
    db.add(compra)
    db.flush()

    for linea in body.lineas:
        db.add(
            DetalleCompra(
                compra_id=compra.id,
                suministro_id=linea.suministro_id,
                cantidad=linea.cantidad,
                costo_unitario=linea.costo_unitario,
            )
        )
        suministro = suministros[linea.suministro_id]
        suministro.stock_actual = float(suministro.stock_actual) + linea.cantidad
        db.add(
            MovimientoInventario(
                suministro_id=linea.suministro_id,
                tipo="entrada",
                cantidad=linea.cantidad,
                motivo="compra",
                referencia_id=compra.id,
                creado_en=ahora,
            )
        )

    db.commit()
    db.refresh(compra)
    return compra
