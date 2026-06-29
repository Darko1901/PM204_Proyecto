from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.seguridad import Rol
from app.schemas.auth import RolOut

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RolOut])
def listar_roles(
    db: Session = Depends(get_db),
    _: object = Depends(require_roles(roles.ADMIN)),
) -> list[Rol]:
    return list(db.execute(select(Rol).order_by(Rol.id)).scalars().all())
