from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.core import roles
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.seguridad import Usuario
from app.models.catalogo import Suministro
from app.models.finanzas import Compra
from app.models.inventario import DetalleCompra, MovimientoInventario
from app.models.enums import TipoMovimiento
from app.schemas.compras import CompraCreate, CompraOut

router = APIRouter(prefix="/compras", tags=["compras"])

@router.get("", response_model=List[CompraOut])
def listar_compras(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> List[Compra]:
    q = select(Compra).options(
        joinedload(Compra.cajero),
        joinedload(Compra.detalles).joinedload(DetalleCompra.suministro)
    ).order_by(Compra.comprado_en.desc())
    
    compras = list(db.execute(q).scalars().unique().all())
    
    # Mapear nombres para el frontend
    for c in compras:
        c.cajero_nombre = c.cajero.nombre_completo
        for d in c.detalles:
            d.suministro_nombre = d.suministro.nombre
            
    return compras

@router.get("/{compra_id}", response_model=CompraOut)
def obtener_compra(
    compra_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> Compra:
    c = db.execute(
        select(Compra)
        .options(
            joinedload(Compra.cajero),
            joinedload(Compra.detalles).joinedload(DetalleCompra.suministro)
        )
        .where(Compra.id == compra_id)
    ).scalar_one_or_none()
    
    if not c:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
        
    c.cajero_nombre = c.cajero.nombre_completo
    for d in c.detalles:
        d.suministro_nombre = d.suministro.nombre
        
    return c

@router.post("", response_model=CompraOut, status_code=status.HTTP_201_CREATED)
def registrar_compra(
    body: CompraCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(roles.ADMIN))
) -> Compra:
    if not body.detalles:
        raise HTTPException(status_code=400, detail="Debe especificar al menos un detalle de insumo")
        
    # Crear compra
    compra = Compra(
        cajero_id=current_user.id,
        proveedor=body.proveedor,
        total=0.0,
        comprado_en=datetime.now()
    )
    db.add(compra)
    db.flush() # Para obtener compra.id
    
    total = 0.0
    for d in body.detalles:
        sumi = db.get(Suministro, d.suministro_id)
        if not sumi or not sumi.activo:
            raise HTTPException(status_code=400, detail=f"Insumo id {d.suministro_id} no válido o inactivo")
            
        detalle = DetalleCompra(
            compra_id=compra.id,
            suministro_id=d.suministro_id,
            cantidad=d.cantidad,
            costo_unitario=d.costo_unitario
        )
        db.add(detalle)
        total += d.cantidad * d.costo_unitario
        
        # Aumentar stock de insumos
        sumi.stock_actual = float(sumi.stock_actual) + float(d.cantidad)
        
        # Registrar movimiento de entrada
        mov = MovimientoInventario(
            suministro_id=sumi.id,
            tipo=TipoMovimiento.entrada,
            cantidad=d.cantidad,
            motivo=f"Entrada por Compra #{compra.id}",
            referencia_id=compra.id,
            creado_en=datetime.now()
        )
        db.add(mov)
        
    compra.total = total
    db.commit()
    
    return obtener_compra(compra.id, db, current_user)
