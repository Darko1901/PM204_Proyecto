from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.core.security import hash_password
from app.models.seguridad import Rol, Usuario
from app.schemas.auth import UsuarioOut
from app.schemas.usuarios import PasswordReset, UsuarioCreate, UsuarioEstado, UsuarioUpdate

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


def _con_rol(db: Session, usuario_id: int) -> Usuario | None:
    return db.execute(
        select(Usuario).options(joinedload(Usuario.rol)).where(Usuario.id == usuario_id)
    ).scalar_one_or_none()


def _admins_activos_count(db: Session) -> int:
    return db.scalar(
        select(func.count())
        .select_from(Usuario)
        .join(Rol)
        .where(Rol.nombre == roles.ADMIN, Usuario.activo == True)  # noqa: E712
    )


@router.get("", response_model=list[UsuarioOut])
def listar_usuarios(
    skip: int = 0,
    limit: int = 50,
    activo: bool | None = None,
    rol_id: int | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN)),
) -> list[Usuario]:
    q = select(Usuario).options(joinedload(Usuario.rol)).order_by(Usuario.id)
    if activo is not None:
        q = q.where(Usuario.activo == activo)
    if rol_id is not None:
        q = q.where(Usuario.rol_id == rol_id)
    return list(db.execute(q.offset(skip).limit(limit)).scalars().all())


@router.get("/{usuario_id}", response_model=UsuarioOut)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN)),
) -> Usuario:
    user = _con_rol(db, usuario_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.post("", response_model=UsuarioOut, status_code=201)
def crear_usuario(
    body: UsuarioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN)),
) -> Usuario:
    if not db.execute(select(Rol).where(Rol.id == body.rol_id)).scalar_one_or_none():
        raise HTTPException(status_code=422, detail="Rol no válido")

    if db.execute(select(Usuario).where(Usuario.correo == body.correo)).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo")

    nuevo = Usuario(
        nombre_completo=body.nombre_completo,
        correo=body.correo,
        rol_id=body.rol_id,
        activo=True,
        password_hash=hash_password(body.password),
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return _con_rol(db, nuevo.id)


@router.patch("/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(
    usuario_id: int,
    body: UsuarioUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN)),
) -> Usuario:
    user = _con_rol(db, usuario_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if body.correo is not None and body.correo != user.correo:
        duplicado = db.execute(
            select(Usuario).where(Usuario.correo == body.correo, Usuario.id != usuario_id)
        ).scalar_one_or_none()
        if duplicado:
            raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo")
        user.correo = body.correo

    if body.rol_id is not None and body.rol_id != user.rol_id:
        if not db.execute(select(Rol).where(Rol.id == body.rol_id)).scalar_one_or_none():
            raise HTTPException(status_code=422, detail="Rol no válido")
        # Regla último admin: no degradar al único administrador activo
        if user.rol.nombre == roles.ADMIN and user.activo:
            if _admins_activos_count(db) <= 1:
                raise HTTPException(
                    status_code=409,
                    detail="No puedes degradar al último administrador activo",
                )
        user.rol_id = body.rol_id

    if body.nombre_completo is not None:
        user.nombre_completo = body.nombre_completo

    db.commit()
    return _con_rol(db, usuario_id)


@router.patch("/{usuario_id}/estado", response_model=UsuarioOut)
def cambiar_estado(
    usuario_id: int,
    body: UsuarioEstado,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(roles.ADMIN)),
) -> Usuario:
    user = _con_rol(db, usuario_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not body.activo:
        if usuario_id == current_user.id:
            raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")
        if user.rol.nombre == roles.ADMIN and user.activo:
            if _admins_activos_count(db) <= 1:
                raise HTTPException(
                    status_code=409,
                    detail="No puedes desactivar al último administrador activo",
                )

    user.activo = body.activo
    db.commit()
    return _con_rol(db, usuario_id)


@router.patch("/{usuario_id}/password", response_model=UsuarioOut)
def resetear_password(
    usuario_id: int,
    body: PasswordReset,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN)),
) -> Usuario:
    user = _con_rol(db, usuario_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.password_hash = hash_password(body.password)
    db.commit()
    return _con_rol(db, usuario_id)
