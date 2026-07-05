from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.seguridad import Rol, Usuario
from app.schemas.auth import RolOut

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RolOut])
def listar_roles(
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> list[Rol]:
    return list(db.execute(select(Rol).order_by(Rol.id)).scalars().all())


@router.post("", response_model=RolOut, status_code=status.HTTP_201_CREATED)
def crear_rol(
    body: dict,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Rol:
    nombre = body.get("nombre", "").strip()
    if not nombre:
        raise HTTPException(status_code=422, detail="El nombre del rol es obligatorio")
    existe = db.execute(select(Rol).where(Rol.nombre == nombre)).scalar_one_or_none()
    if existe:
        raise HTTPException(status_code=409, detail="Ya existe un rol con ese nombre")
    nuevo = Rol(nombre=nombre, descripcion=body.get("descripcion"))
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.patch("/{rol_id}", response_model=RolOut)
def actualizar_rol(
    rol_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> Rol:
    rol = db.get(Rol, rol_id)
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    if "nombre" in body and body["nombre"]:
        rol.nombre = body["nombre"].strip()
    if "descripcion" in body:
        rol.descripcion = body["descripcion"]
    db.commit()
    db.refresh(rol)
    return rol


@router.delete("/{rol_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_rol(
    rol_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
):
    rol = db.get(Rol, rol_id)
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    # Verificar que no tenga usuarios
    tiene_usuarios = db.scalar(
        select(func.count()).select_from(Usuario).where(Usuario.rol_id == rol_id)
    )
    if tiene_usuarios:
        raise HTTPException(
            status_code=409,
            detail=f"No se puede eliminar: tiene {tiene_usuarios} usuario(s) asignados"
        )
    db.delete(rol)
    db.commit()
    return None
