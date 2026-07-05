from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.catalogo import Suministro
from app.models.inventario import MovimientoInventario
from app.schemas.catalogo import (
    SuministroAjusteStock,
    SuministroCreate,
    SuministroOut,
    SuministroUpdate,
)

router = APIRouter(prefix="/suministros", tags=["suministros"])


@router.get("", response_model=list[SuministroOut])
def listar_suministros(
    activo: bool | None = None,
    bajo_minimo: bool = False,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(*roles.TODOS)),
) -> list[Suministro]:
    q = select(Suministro).order_by(Suministro.id)
    if activo is not None:
        q = q.where(Suministro.activo == activo)
    if bajo_minimo:
        q = q.where(Suministro.stock_actual < Suministro.stock_minimo)
    return list(db.execute(q).scalars().all())


@router.get("/{suministro_id}", response_model=SuministroOut)
def obtener_suministro(
    suministro_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(*roles.TODOS)),
) -> Suministro:
    suministro = db.get(Suministro, suministro_id)
    if suministro is None:
        raise HTTPException(status_code=404, detail="Suministro no encontrado")
    return suministro


@router.post("", response_model=SuministroOut, status_code=201)
def crear_suministro(
    body: SuministroCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Suministro:
    if db.execute(
        select(Suministro).where(Suministro.nombre == body.nombre)
    ).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe un suministro con ese nombre")

    suministro = Suministro(**body.model_dump())
    db.add(suministro)
    db.commit()
    db.refresh(suministro)
    return suministro


@router.patch("/{suministro_id}", response_model=SuministroOut)
def actualizar_suministro(
    suministro_id: int,
    body: SuministroUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Suministro:
    suministro = db.get(Suministro, suministro_id)
    if suministro is None:
        raise HTTPException(status_code=404, detail="Suministro no encontrado")

    datos = body.model_dump(exclude_unset=True)
    if "nombre" in datos and datos["nombre"] != suministro.nombre:
        if db.execute(
            select(Suministro).where(
                Suministro.nombre == datos["nombre"], Suministro.id != suministro_id
            )
        ).scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Ya existe un suministro con ese nombre")

    for campo, valor in datos.items():
        setattr(suministro, campo, valor)

    db.commit()
    db.refresh(suministro)
    return suministro


@router.patch("/{suministro_id}/ajuste", response_model=SuministroOut)
def ajustar_stock(
    suministro_id: int,
    body: SuministroAjusteStock,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Suministro:
    suministro = db.get(Suministro, suministro_id)
    if suministro is None:
        raise HTTPException(status_code=404, detail="Suministro no encontrado")

    nuevo_stock = float(suministro.stock_actual) + body.cantidad
    if nuevo_stock < 0:
        raise HTTPException(status_code=409, detail="El ajuste dejaría el stock en negativo")

    suministro.stock_actual = nuevo_stock
    db.add(
        MovimientoInventario(
            suministro_id=suministro_id,
            tipo="ajuste",
            cantidad=abs(body.cantidad),
            motivo=body.motivo or "ajuste",
            creado_en=datetime.now(timezone.utc),
        )
    )
    db.commit()
    db.refresh(suministro)
    return suministro
