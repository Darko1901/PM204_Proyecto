from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core import roles
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.seguridad import Usuario
from app.models.catalogo import Suministro
from app.models.inventario import MovimientoInventario
from app.models.enums import TipoMovimiento
from app.schemas.suministros import (
    SuministroCreate,
    SuministroUpdate,
    SuministroOut,
    MovimientoInventarioOut,
    AjusteInventarioCreate,
)

router = APIRouter(prefix="/suministros", tags=["suministros"])

@router.get("", response_model=List[SuministroOut])
def listar_suministros(
    activo: bool | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> List[Suministro]:
    q = select(Suministro).order_by(Suministro.id)
    if activo is not None:
        q = q.where(Suministro.activo == activo)
    return list(db.execute(q).scalars().all())

@router.get("/movimientos", response_model=List[MovimientoInventarioOut])
def listar_movimientos(
    suministro_id: int | None = None,
    tipo: TipoMovimiento | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> List[MovimientoInventario]:
    q = select(MovimientoInventario).options(joinedload(MovimientoInventario.suministro)).order_by(MovimientoInventario.creado_en.desc())
    if suministro_id is not None:
        q = q.where(MovimientoInventario.suministro_id == suministro_id)
    if tipo is not None:
        q = q.where(MovimientoInventario.tipo == tipo)
        
    movs = list(db.execute(q.limit(100)).scalars().all())
    
    # Mapear nombre del insumo
    for m in movs:
        m.suministro_nombre = m.suministro.nombre
        
    return movs

@router.get("/{suministro_id}", response_model=SuministroOut)
def obtener_suministro(
    suministro_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> Suministro:
    sumi = db.get(Suministro, suministro_id)
    if not sumi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insumo/Suministro no encontrado")
    return sumi

@router.post("", response_model=SuministroOut, status_code=status.HTTP_201_CREATED)
def crear_suministro(
    body: SuministroCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN))
) -> Suministro:
    existe = db.execute(select(Suministro).where(Suministro.nombre == body.nombre)).scalar_one_or_none()
    if existe:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un suministro con este nombre")
        
    nuevo = Suministro(
        nombre=body.nombre,
        unidad=body.unidad,
        stock_actual=body.stock_actual,
        stock_minimo=body.stock_minimo,
        activo=body.activo
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    
    # Si viene con stock inicial > 0, registrar movimiento
    if nuevo.stock_actual > 0:
        mov = MovimientoInventario(
            suministro_id=nuevo.id,
            tipo=TipoMovimiento.entrada,
            cantidad=nuevo.stock_actual,
            motivo="Stock inicial de creación",
        )
        db.add(mov)
        db.commit()
        
    return nuevo

@router.patch("/{suministro_id}", response_model=SuministroOut)
def actualizar_suministro(
    suministro_id: int,
    body: SuministroUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN))
) -> Suministro:
    sumi = db.get(Suministro, suministro_id)
    if not sumi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insumo no encontrado")
        
    if body.nombre is not None:
        duplicado = db.execute(
            select(Suministro).where(Suministro.nombre == body.nombre, Suministro.id != suministro_id)
        ).scalar_one_or_none()
        if duplicado:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe otro suministro con este nombre")
        sumi.nombre = body.nombre
        
    if body.unidad is not None:
        sumi.unidad = body.unidad
    if body.stock_minimo is not None:
        sumi.stock_minimo = body.stock_minimo
    if body.activo is not None:
        sumi.activo = body.activo
        
    db.commit()
    db.refresh(sumi)
    return sumi

@router.post("/{suministro_id}/ajuste", response_model=SuministroOut)
def registrar_ajuste(
    suministro_id: int,
    body: AjusteInventarioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN, roles.CAJA))
) -> Suministro:
    sumi = db.get(Suministro, suministro_id)
    if not sumi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insumo no encontrado")
        
    if body.cantidad <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La cantidad debe ser mayor a cero")
        
    # Calcular nuevo stock
    if body.tipo == TipoMovimiento.entrada:
        sumi.stock_actual += body.cantidad
    elif body.tipo == TipoMovimiento.salida:
        if sumi.stock_actual < body.cantidad:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock insuficiente para salida")
        sumi.stock_actual -= body.cantidad
    elif body.tipo == TipoMovimiento.ajuste:
        sumi.stock_actual = body.cantidad # El ajuste directo sobrescribe el stock
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de movimiento inválido")
        
    # Registrar el movimiento
    mov = MovimientoInventario(
        suministro_id=sumi.id,
        tipo=body.tipo,
        cantidad=body.cantidad if body.tipo != TipoMovimiento.ajuste else (body.cantidad - sumi.stock_actual),
        motivo=body.motivo
    )
    db.add(mov)
    db.commit()
    db.refresh(sumi)
    return sumi
