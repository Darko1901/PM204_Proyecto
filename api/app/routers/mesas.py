from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.operacion import Mesa
from app.schemas.operacion import MesaCreate, MesaOut, MesaUpdate

router = APIRouter(prefix="/mesas", tags=["mesas"])


@router.get("", response_model=list[MesaOut])
def listar_mesas(
    activa: bool | None = None,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(*roles.TODOS)),
) -> list[Mesa]:
    q = select(Mesa).order_by(Mesa.numero)
    if activa is not None:
        q = q.where(Mesa.activa == activa)
    return list(db.execute(q).scalars().all())


@router.post("", response_model=MesaOut, status_code=201)
def crear_mesa(
    body: MesaCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Mesa:
    if db.execute(select(Mesa).where(Mesa.numero == body.numero)).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe una mesa con ese número")

    mesa = Mesa(**body.model_dump())
    db.add(mesa)
    db.commit()
    db.refresh(mesa)
    return mesa


@router.patch("/{mesa_id}", response_model=MesaOut)
def actualizar_mesa(
    mesa_id: int,
    body: MesaUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Mesa:
    mesa = db.get(Mesa, mesa_id)
    if mesa is None:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    for campo, valor in body.model_dump(exclude_unset=True).items():
        setattr(mesa, campo, valor)

    db.commit()
    db.refresh(mesa)
    return mesa
