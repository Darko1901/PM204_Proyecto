from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.catalogo import Producto, Receta, Suministro
from app.schemas.catalogo import RecetaLineaCreate, RecetaLineaOut, RecetaLineaUpdate

router = APIRouter(prefix="/recetas", tags=["recetas"])


def _producto_o_404(db: Session, producto_id: int) -> Producto:
    producto = db.get(Producto, producto_id)
    if producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.get("/{producto_id}", response_model=list[RecetaLineaOut])
def listar_receta(
    producto_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(*roles.TODOS)),
) -> list[Receta]:
    _producto_o_404(db, producto_id)
    q = select(Receta).where(Receta.producto_id == producto_id).order_by(Receta.id)
    return list(db.execute(q).scalars().all())


@router.post("/{producto_id}", response_model=RecetaLineaOut, status_code=201)
def agregar_linea(
    producto_id: int,
    body: RecetaLineaCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Receta:
    _producto_o_404(db, producto_id)
    if db.get(Suministro, body.suministro_id) is None:
        raise HTTPException(status_code=422, detail="Suministro no válido")

    if db.execute(
        select(Receta).where(
            Receta.producto_id == producto_id, Receta.suministro_id == body.suministro_id
        )
    ).scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="Ese suministro ya está en la receta del producto"
        )

    linea = Receta(producto_id=producto_id, suministro_id=body.suministro_id, cantidad=body.cantidad)
    db.add(linea)
    db.commit()
    db.refresh(linea)
    return linea


@router.patch("/{producto_id}/{suministro_id}", response_model=RecetaLineaOut)
def editar_linea(
    producto_id: int,
    suministro_id: int,
    body: RecetaLineaUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Receta:
    linea = db.execute(
        select(Receta).where(
            Receta.producto_id == producto_id, Receta.suministro_id == suministro_id
        )
    ).scalar_one_or_none()
    if linea is None:
        raise HTTPException(status_code=404, detail="Línea de receta no encontrada")

    linea.cantidad = body.cantidad
    db.commit()
    db.refresh(linea)
    return linea


@router.delete("/{producto_id}/{suministro_id}", status_code=204)
def eliminar_linea(
    producto_id: int,
    suministro_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> None:
    linea = db.execute(
        select(Receta).where(
            Receta.producto_id == producto_id, Receta.suministro_id == suministro_id
        )
    ).scalar_one_or_none()
    if linea is None:
        raise HTTPException(status_code=404, detail="Línea de receta no encontrada")

    db.delete(linea)
    db.commit()
