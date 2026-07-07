from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.core import roles
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.seguridad import Usuario
from app.models.catalogo import Producto, Receta, Suministro
from app.models.operacion import Mesa, Cuenta, DetalleCuenta
from app.models.finanzas import Pago, Ticket
from app.models.inventario import MovimientoInventario
from app.models.enums import TipoCuenta, EstadoCuenta, EstadoCocina, MetodoPago, TipoMovimiento

from app.schemas.operaciones import (
    MesaOut,
    CuentaCreate,
    CuentaOut,
    DetalleCuentaCreate,
    DetalleCuentaOut,
    DetalleCuentaUpdate,
    PagoCreate,
    PagoOut,
    TicketOut
)

router = APIRouter(prefix="", tags=["operaciones"]) # Usamos prefijo vacío para compatibilidad flexible

# --- MESAS ---
@router.get("/mesas", response_model=List[MesaOut])
def listar_mesas(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> List[Mesa]:
    return list(db.execute(select(Mesa).order_by(Mesa.numero)).scalars().all())

@router.post("/mesas", response_model=MesaOut, status_code=status.HTTP_201_CREATED)
def crear_mesa(
    numero: int,
    capacidad: int = 4,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN))
) -> Mesa:
    existe = db.execute(select(Mesa).where(Mesa.numero == numero)).scalar_one_or_none()
    if existe:
        raise HTTPException(status_code=409, detail="La mesa ya existe")
    mesa = Mesa(numero=numero, capacidad=capacidad, activa=True)
    db.add(mesa)
    db.commit()
    db.refresh(mesa)
    return mesa

# --- CUENTAS / PEDIDOS ---
@router.get("/cuentas", response_model=List[CuentaOut])
def listar_cuentas(
    estado: EstadoCuenta | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> List[Cuenta]:
    q = select(Cuenta).options(
        joinedload(Cuenta.mesa),
        joinedload(Cuenta.mesero),
        joinedload(Cuenta.detalles).joinedload(DetalleCuenta.producto)
    ).order_by(Cuenta.id.desc())
    
    if estado:
        q = q.where(Cuenta.estado == estado)
        
    cuentas = list(db.execute(q).scalars().unique().all())
    
    # Mapear nombres para el frontend
    for c in cuentas:
        c.mesa_numero = c.mesa.numero if c.mesa else None
        c.mesero_nombre = c.mesero.nombre_completo
        for d in c.detalles:
            d.producto_nombre = d.producto.nombre
            
    return cuentas

@router.get("/cuentas/{cuenta_id}", response_model=CuentaOut)
def obtener_cuenta(
    cuenta_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> Cuenta:
    c = db.execute(
        select(Cuenta)
        .options(
            joinedload(Cuenta.mesa),
            joinedload(Cuenta.mesero),
            joinedload(Cuenta.detalles).joinedload(DetalleCuenta.producto)
        )
        .where(Cuenta.id == cuenta_id)
    ).unique().scalar_one_or_none()
    
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
        
    c.mesa_numero = c.mesa.numero if c.mesa else None
    c.mesero_nombre = c.mesero.nombre_completo
    for d in c.detalles:
        d.producto_nombre = d.producto.nombre
        
    return c

@router.post("/cuentas", response_model=CuentaOut, status_code=status.HTTP_201_CREATED)
def crear_cuenta(
    body: CuentaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(roles.ADMIN, roles.MESERO, roles.CAJA))
) -> Cuenta:
    # Si es en mesa, verificar que exista la mesa y esté activa
    if body.tipo == TipoCuenta.en_mesa:
        if not body.mesa_id:
            raise HTTPException(status_code=400, detail="Debe especificar una mesa para pedidos en mesa")
        mesa = db.get(Mesa, body.mesa_id)
        if not mesa or not mesa.activa:
            raise HTTPException(status_code=400, detail="Mesa no válida o inactiva")
            
        # Verificar si ya hay una cuenta ABIERTA para esa mesa
        cuenta_activa = db.execute(
            select(Cuenta).where(Cuenta.mesa_id == body.mesa_id, Cuenta.estado == EstadoCuenta.abierta)
        ).scalar_one_or_none()
        if cuenta_activa:
            raise HTTPException(status_code=409, detail="La mesa ya tiene una cuenta abierta")
            
    nueva_cuenta = Cuenta(
        mesa_id=body.mesa_id if body.tipo == TipoCuenta.en_mesa else None,
        mesero_id=current_user.id,
        tipo=body.tipo,
        estado=EstadoCuenta.abierta,
        total=0.0
    )
    db.add(nueva_cuenta)
    db.flush() # Obtener nueva_cuenta.id
    
    total = 0.0
    for d in body.detalles:
        prod = db.get(Producto, d.producto_id)
        if not prod or not prod.disponible:
            raise HTTPException(status_code=400, detail=f"Producto id {d.producto_id} no disponible")
            
        detalle = DetalleCuenta(
            cuenta_id=nueva_cuenta.id,
            producto_id=d.producto_id,
            cantidad=d.cantidad,
            precio_unitario=prod.precio,
            observaciones=d.observaciones,
            estado=EstadoCocina.pendiente
        )
        db.add(detalle)
        total += d.cantidad * float(prod.precio)
        
    nueva_cuenta.total = total
    db.commit()
    
    # Recargar cuenta con relaciones
    return obtener_cuenta(nueva_cuenta.id, db, current_user)

@router.post("/cuentas/{cuenta_id}/detalles", response_model=CuentaOut)
def agregar_detalles_cuenta(
    cuenta_id: int,
    detalles_nuevos: List[DetalleCuentaCreate],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Cuenta:
    cuenta = db.get(Cuenta, cuenta_id)
    if not cuenta or cuenta.estado != EstadoCuenta.abierta:
        raise HTTPException(status_code=400, detail="La cuenta no está abierta o no existe")
        
    total_adicional = 0.0
    for d in detalles_nuevos:
        prod = db.get(Producto, d.producto_id)
        if not prod or not prod.disponible:
            raise HTTPException(status_code=400, detail=f"Producto id {d.producto_id} no disponible")
            
        detalle = DetalleCuenta(
            cuenta_id=cuenta.id,
            producto_id=d.producto_id,
            cantidad=d.cantidad,
            precio_unitario=prod.precio,
            observaciones=d.observaciones,
            estado=EstadoCocina.pendiente
        )
        db.add(detalle)
        total_adicional += d.cantidad * float(prod.precio)
        
    cuenta.total = float(cuenta.total) + total_adicional
    db.commit()
    
    return obtener_cuenta(cuenta.id, db, current_user)

@router.patch("/cuentas/detalles/{detalle_id}", response_model=DetalleCuentaOut)
def actualizar_detalle(
    detalle_id: int,
    body: DetalleCuentaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> DetalleCuenta:
    detalle = db.execute(
        select(DetalleCuenta).options(joinedload(DetalleCuenta.producto)).where(DetalleCuenta.id == detalle_id)
    ).scalar_one_or_none()
    
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")
        
    cuenta = db.get(Cuenta, detalle.cuenta_id)
    if not cuenta or cuenta.estado != EstadoCuenta.abierta:
        # Si la cuenta está cerrada/pagada, no se pueden modificar los detalles
        if body.estado != EstadoCocina.entregado: # Permite cambio de estado a entregado para fines POS
            raise HTTPException(status_code=400, detail="La cuenta ya no está abierta")
            
    if body.estado is not None:
        detalle.estado = body.estado
        
    if body.cantidad is not None and cuenta.estado == EstadoCuenta.abierta:
        diferencia = body.cantidad - detalle.cantidad
        detalle.cantidad = body.cantidad
        cuenta.total = float(cuenta.total) + (diferencia * float(detalle.precio_unitario))
        
    if body.observaciones is not None:
        detalle.observaciones = body.observaciones
        
    db.commit()
    db.refresh(detalle)
    detalle.producto_nombre = detalle.producto.nombre
    return detalle

@router.patch("/cuentas/{cuenta_id}/cerrar", response_model=CuentaOut)
def cerrar_cuenta(
    cuenta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
) -> Cuenta:
    cuenta = db.get(Cuenta, cuenta_id)
    if not cuenta or cuenta.estado != EstadoCuenta.abierta:
        raise HTTPException(status_code=400, detail="La cuenta no está abierta o no existe")
        
    # Verificar si tiene detalles comandados. Una cuenta vacía no debería cerrarse.
    detalles = db.query(DetalleCuenta).filter_by(cuenta_id=cuenta.id).all()
    if not detalles:
        raise HTTPException(status_code=400, detail="No se puede cerrar una cuenta sin productos")
        
    cuenta.estado = EstadoCuenta.por_cobrar
    db.commit()
    return obtener_cuenta(cuenta.id, db, current_user)

@router.post("/cuentas/{cuenta_id}/pagar", response_model=PagoOut)
def pagar_cuenta(
    cuenta_id: int,
    body: PagoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(roles.ADMIN, roles.CAJA))
) -> Pago:
    cuenta = db.execute(
        select(Cuenta)
        .options(joinedload(Cuenta.detalles).joinedload(DetalleCuenta.producto).joinedload(Producto.recetas).joinedload(Receta.suministro))
        .where(Cuenta.id == cuenta_id)
    ).unique().scalar_one_or_none()
    
    if not cuenta or cuenta.estado not in [EstadoCuenta.abierta, EstadoCuenta.por_cobrar]:
        raise HTTPException(status_code=400, detail="La cuenta no se puede cobrar (invalida o ya pagada)")
        
    # 1. Registrar Pago
    pago = Pago(
        cuenta_id=cuenta.id,
        cajero_id=current_user.id,
        metodo=body.metodo,
        monto=cuenta.total,
        pagado_en=datetime.now()
    )
    db.add(pago)
    
    # 2. Registrar Ticket (Folio Único)
    timestamp_str = datetime.now().strftime("%Y%m%d%H%M%S")
    rand_suffix = datetime.now().microsecond % 1000
    folio = f"F-{timestamp_str}-{rand_suffix:03d}"
    
    ticket = Ticket(
        cuenta_id=cuenta.id,
        folio=folio,
        total=cuenta.total,
        emitido_en=datetime.now()
    )
    db.add(ticket)
    
    # 3. Cambiar estado de la cuenta
    cuenta.estado = EstadoCuenta.pagada
    cuenta.cerrada_en = datetime.now()
    
    # 4. Descontar insumos de inventario
    for det in cuenta.detalles:
        # Por cada detalle de cuenta, restar insumos de las recetas
        for rec in det.producto.recetas:
            sumi = rec.suministro
            cant_descontar = rec.cantidad * det.cantidad
            
            # Restar del stock
            sumi.stock_actual = float(sumi.stock_actual) - float(cant_descontar)
            if sumi.stock_actual < 0:
                # Opcional: Podríamos lanzar error, pero en POS real a veces el stock físico difiere. 
                # Dejaremos que quede negativo o 0, pero guardaremos el log.
                pass
                
            # Log de salida de inventario
            mov = MovimientoInventario(
                suministro_id=sumi.id,
                tipo=TipoMovimiento.salida,
                cantidad=cant_descontar,
                motivo=f"Venta en Cuenta #{cuenta.id} (Ticket {folio})",
                referencia_id=cuenta.id,
                creado_en=datetime.now()
            )
            db.add(mov)
            
    db.commit()
    db.refresh(pago)
    return pago

@router.get("/cuentas/{cuenta_id}/ticket", response_model=TicketOut)
def obtener_ticket(
    cuenta_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> Ticket:
    t = db.execute(select(Ticket).where(Ticket.cuenta_id == cuenta_id)).scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado para esta cuenta")
    return t
