from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from typing import Dict, List, Any

from app.core import roles
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.seguridad import Usuario
from app.models.finanzas import Compra, Pago
from app.models.operacion import Cuenta, DetalleCuenta
from app.models.enums import EstadoCuenta

router = APIRouter(prefix="/estadisticas", tags=["estadisticas"])

@router.get("")
def obtener_estadisticas(
    dias: int = 30,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> Dict[str, Any]:
    fecha_limite = datetime.now() - timedelta(days=dias)
    
    # 1. Obtener todas las compras (gastos) en el rango
    compras = db.execute(
        select(Compra).where(Compra.comprado_en >= fecha_limite)
    ).scalars().all()
    
    # 2. Obtener todos los pagos (ganancias) en el rango
    pagos = db.execute(
        select(Pago).where(Pago.pagado_en >= fecha_limite)
    ).scalars().all()
    
    # 3. Obtener todas las cuentas en el rango
    cuentas = db.execute(
        select(Cuenta).where(Cuenta.abierta_en >= fecha_limite)
    ).scalars().all()
    
    # 4. Obtener todos los detalles de cuentas pagadas para estadísticas de productos
    detalles_pagados = db.execute(
        select(DetalleCuenta)
        .options(joinedload(DetalleCuenta.producto))
        .join(Cuenta)
        .where(Cuenta.estado == EstadoCuenta.pagada, Cuenta.abierta_en >= fecha_limite)
    ).scalars().all()

    # --- Cálculos de Resumen ---
    total_ganancias = sum(float(p.monto) for p in pagos)
    total_gastos = sum(float(c.total) for c in compras)
    utilidad_neta = total_ganancias - total_gastos
    total_pedidos = len([c for c in cuentas if c.estado == EstadoCuenta.pagada])

    # --- Agrupación por Día ---
    # Inicializar diccionarios con fechas de los últimos 30 días para asegurar que se muestren días con $0
    ganancias_diarias = {}
    gastos_diarios = {}
    for i in range(dias):
        f = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        ganancias_diarias[f] = 0.0
        gastos_diarios[f] = 0.0
        
    for p in pagos:
        f_str = p.pagado_en.strftime("%Y-%m-%d") if p.pagado_en else datetime.now().strftime("%Y-%m-%d")
        if f_str in ganancias_diarias:
            ganancias_diarias[f_str] += float(p.monto)
            
    for c in compras:
        f_str = c.comprado_en.strftime("%Y-%m-%d") if c.comprado_en else datetime.now().strftime("%Y-%m-%d")
        if f_str in gastos_diarios:
            gastos_diarios[f_str] += float(c.total)

    # Convertir a listas ordenadas cronológicamente
    list_ganancias = [{"fecha": k, "monto": v} for k, v in sorted(ganancias_diarias.items())]
    list_gastos = [{"fecha": k, "monto": v} for k, v in sorted(gastos_diarios.items())]

    # --- Agrupación de Ventas por Producto ---
    productos_dict = {}
    for d in detalles_pagados:
        prod_name = d.producto.nombre
        if prod_name not in productos_dict:
            productos_dict[prod_name] = {"cantidad": 0, "ingresos": 0.0}
        productos_dict[prod_name]["cantidad"] += d.cantidad
        productos_dict[prod_name]["ingresos"] += d.cantidad * float(d.precio_unitario)

    list_productos = [
        {"producto": k, "cantidad": v["cantidad"], "ingresos": v["ingresos"]}
        for k, v in sorted(productos_dict.items(), key=lambda x: x[1]["cantidad"], reverse=True)
    ]

    return {
        "resumen": {
            "total_ganancias": round(total_ganancias, 2),
            "total_gastos": round(total_gastos, 2),
            "utilidad_neta": round(utilidad_neta, 2),
            "total_pedidos": total_pedidos
        },
        "ganancias_por_dia": list_ganancias,
        "gastos_por_dia": list_gastos,
        "ventas_por_producto": list_productos
    }
