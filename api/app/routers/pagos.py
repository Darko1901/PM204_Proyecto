from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

from app.core import roles
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.finanzas import Pago, Ticket
from app.models.operacion import Cuenta
from app.models.seguridad import Usuario
from app.schemas.finanzas import CobroOut, PagoCreate

router = APIRouter(tags=["pagos"])


@router.post("/cuentas/{cuenta_id}/pagos", response_model=CobroOut, status_code=201)
def cobrar_cuenta(
    cuenta_id: int,
    body: PagoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(roles.CAJA, roles.ADMIN)),
) -> CobroOut:
    cuenta = db.execute(
        select(Cuenta).options(joinedload(Cuenta.detalles)).where(Cuenta.id == cuenta_id)
    ).unique().scalar_one_or_none()
    if cuenta is None:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    if cuenta.estado != "por_cobrar":
        raise HTTPException(
            status_code=409, detail="La cuenta debe estar en estado 'por_cobrar' para cobrarse"
        )

    if body.monto < float(cuenta.total):
        raise HTTPException(status_code=422, detail="El monto recibido es menor al total de la cuenta")

    ahora = datetime.now(timezone.utc)

    pago = Pago(
        cuenta_id=cuenta_id,
        cajero_id=current_user.id,
        metodo=body.metodo,
        monto=cuenta.total,
        pagado_en=ahora,
    )
    db.add(pago)

    cuenta.estado = "pagada"
    cuenta.cerrada_en = ahora

    folio = f"TCK-{cuenta_id:06d}-{int(ahora.timestamp())}"
    ticket = Ticket(cuenta_id=cuenta_id, folio=folio, total=cuenta.total, emitido_en=ahora)
    db.add(ticket)

    db.commit()
    db.refresh(pago)
    db.refresh(ticket)
    return CobroOut(pago=pago, ticket=ticket)


@router.get("/cuentas/{cuenta_id}/ticket", response_model=CobroOut)
def obtener_ticket(
    cuenta_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(*roles.TODOS)),
) -> CobroOut:
    ticket = db.execute(
        select(Ticket).where(Ticket.cuenta_id == cuenta_id)
    ).scalar_one_or_none()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    pago = db.execute(
        select(Pago).where(Pago.cuenta_id == cuenta_id).order_by(Pago.id.desc())
    ).scalars().first()

    return CobroOut(pago=pago, ticket=ticket)
