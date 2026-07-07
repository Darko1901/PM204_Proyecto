from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.seguridad import Rol, Usuario
from app.schemas.auth import RolOut
from app.schemas.roles import RolCreate, RolUpdate

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RolOut])
def listar_roles(
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> list[Rol]:
    return list(db.execute(select(Rol).order_by(Rol.id)).scalars().all())


@router.post("", response_model=RolOut, status_code=201)
def crear_rol(
    body: RolCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Rol:
    if db.execute(select(Rol).where(Rol.nombre == body.nombre)).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe un rol con ese nombre")

    rol = Rol(nombre=body.nombre, descripcion=body.descripcion)
    db.add(rol)
    db.commit()
    db.refresh(rol)
    return rol


@router.patch("/{rol_id}", response_model=RolOut)
def actualizar_rol(
    rol_id: int,
    body: RolUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Rol:
    rol = db.get(Rol, rol_id)
    if rol is None:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    datos = body.model_dump(exclude_unset=True)
    if "nombre" in datos and datos["nombre"] != rol.nombre:
        if db.execute(
            select(Rol).where(Rol.nombre == datos["nombre"], Rol.id != rol_id)
        ).scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Ya existe un rol con ese nombre")

    for campo, valor in datos.items():
        setattr(rol, campo, valor)

    db.commit()
    db.refresh(rol)
    return rol


@router.delete("/{rol_id}", status_code=204)
def eliminar_rol(
    rol_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> None:
    rol = db.get(Rol, rol_id)
    if rol is None:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    usuarios_asignados = db.scalar(
        select(func.count()).select_from(Usuario).where(Usuario.rol_id == rol_id)
    )
    if usuarios_asignados:
        raise HTTPException(
            status_code=409, detail="No se puede eliminar un rol con usuarios asignados"
        )

    db.delete(rol)
    db.commit()
