from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.seguridad import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    credentials_exc = HTTPException(
        status_code=401,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
    except InvalidTokenError:
        raise credentials_exc

    sub = payload.get("sub")
    if sub is None:
        raise credentials_exc

    user_id = int(sub)
    user = db.execute(
        select(Usuario).options(joinedload(Usuario.rol)).where(Usuario.id == user_id)
    ).scalar_one_or_none()

    if user is None:
        raise credentials_exc

    if not user.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    return user


def require_roles(*roles_permitidos: str):
    def dep(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if current_user.rol.nombre not in roles_permitidos:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para esta operación",
            )
        return current_user

    return dep
