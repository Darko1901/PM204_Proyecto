"""Seed único del sistema de Cafetería — única fuente de verdad de usuarios.

Antes existían tres orígenes de datos distintos y no coincidentes entre sí:
`seed.py` (1 admin desde .env), `init_db.py` (4 usuarios @cafeteria.com
hardcodeados) y `reset_clean.py` (otro admin hardcodeado distinto). Ahora los
tres delegan aquí — ver `init_db.py` y `reset_clean.py`, que ya no crean sus
propios usuarios.

Uso:
    python -m app.seed          -> roles + los 4 usuarios base
    python -m app.seed --demo   -> lo anterior + catálogo y datos de operación

Nunca usa `create_all`: las tablas deben existir ya vía `alembic upgrade head`
(la única excepción documentada es el propio `init_db.py`, por ser legacy).
Todas las funciones son idempotentes: correr el seed dos veces no duplica
nada.
"""

import random
import sys
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import roles
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.catalogo import Producto, Receta, Suministro
from app.models.enums import EstadoCocina, EstadoCuenta, MetodoPago, TipoCuenta, TipoMovimiento
from app.models.finanzas import Compra, Pago, Ticket
from app.models.inventario import DetalleCompra, MovimientoInventario
from app.models.operacion import Cuenta, DetalleCuenta, Mesa
from app.models.seguridad import Rol, Usuario

# ---------------------------------------------------------------------------
# Credenciales de EVALUACIÓN ACADÉMICA — NO usar en producción.
# Son constantes a propósito (fáciles de teclear y de dictar en voz alta para
# la evaluación presencial). Si ADMIN_EMAIL / ADMIN_PASSWORD SÍ están
# definidas en el .env, esas tienen prioridad sobre ADMIN_EMAIL_DEFAULT /
# ADMIN_PASSWORD_DEFAULT; los otros tres roles siempre usan estas constantes,
# no tienen variable de entorno propia.
# ---------------------------------------------------------------------------
PASSWORD_DEFAULT = "cafe2026"

ADMIN_EMAIL_DEFAULT = "admin@cafeteria.com"
ADMIN_PASSWORD_DEFAULT = PASSWORD_DEFAULT

MESERO_EMAIL = "mesero@cafeteria.com"
CAJA_EMAIL = "caja@cafeteria.com"
COCINA_EMAIL = "cocina@cafeteria.com"


def seed_roles(db: Session) -> dict[str, Rol]:
    rol_objs: dict[str, Rol] = {}
    for nombre in roles.TODOS:
        rol = db.execute(select(Rol).where(Rol.nombre == nombre)).scalar_one_or_none()
        if rol is None:
            rol = Rol(nombre=nombre, descripcion=f"Rol de {nombre}")
            db.add(rol)
            db.flush()
        rol_objs[nombre] = rol
    db.commit()
    return rol_objs


def seed_usuarios(db: Session, rol_objs: dict[str, Rol]) -> dict[str, Usuario]:
    admin_email = settings.ADMIN_EMAIL or ADMIN_EMAIL_DEFAULT
    admin_password = settings.ADMIN_PASSWORD or ADMIN_PASSWORD_DEFAULT

    usuarios_data = [
        ("Administrador", admin_email, admin_password, roles.ADMIN),
        ("Mesero Demo", MESERO_EMAIL, PASSWORD_DEFAULT, roles.MESERO),
        ("Cajero Demo", CAJA_EMAIL, PASSWORD_DEFAULT, roles.CAJA),
        ("Cocina Demo", COCINA_EMAIL, PASSWORD_DEFAULT, roles.COCINA),
    ]

    user_objs: dict[str, Usuario] = {}
    for nombre_completo, correo, password, rol_nombre in usuarios_data:
        usuario = db.execute(select(Usuario).where(Usuario.correo == correo)).scalar_one_or_none()
        if usuario is None:
            usuario = Usuario(
                nombre_completo=nombre_completo,
                correo=correo,
                rol_id=rol_objs[rol_nombre].id,
                activo=True,
                password_hash=hash_password(password),
            )
            db.add(usuario)
            db.flush()
        user_objs[correo] = usuario
    db.commit()
    return user_objs


# ---------------------------------------------------------------------------
# Fase --demo: catálogo y datos de operación.
# Cada función es idempotente por su cuenta propia (busca antes de crear),
# salvo la generación de cuentas históricas, que se salta por completo si ya
# hay alguna cuenta en la tabla (ver seed_operacion_demo): así una segunda
# corrida con --demo no duplica pedidos/pagos/compras.
# ---------------------------------------------------------------------------

MESAS_TOTAL = 8

SUMINISTROS_DATA = [
    # (nombre, unidad, stock_actual, stock_minimo)
    ("Café en Grano", "kg", 12.5, 3.0),
    ("Leche Entera", "L", 25.0, 5.0),
    ("Matcha en Polvo", "kg", 0.3, 0.5),        # bajo mínimo
    ("Croissant Crudo", "pz", 30.0, 10.0),
    ("Pastel de Chocolate (Entero)", "pz", 5.0, 1.0),
    ("Pechuga de Pollo", "kg", 1.5, 2.0),        # bajo mínimo
    ("Queso Gouda", "kg", 0.8, 1.0),             # bajo mínimo
    ("Jamón de Pavo", "kg", 4.0, 1.0),
    ("Azúcar", "kg", 10.0, 2.0),
    ("Vasos Desechables", "pz", 150.0, 50.0),
]

PRODUCTOS_DATA = [
    # (nombre, descripcion, precio, categoria)
    ("Café Americano", "Espresso clásico rebajado con agua caliente.", 45.0, "Bebidas Calientes"),
    ("Cappuccino", "Espresso, leche vaporizada y abundante espuma.", 55.0, "Bebidas Calientes"),
    ("Espresso Doble", "Shot cargado de espresso intenso.", 35.0, "Bebidas Calientes"),
    ("Latte Frío", "Espresso sobre leche fría y cubos de hielo.", 60.0, "Bebidas Frías"),
    ("Matcha Latte", "Té matcha premium con leche vaporizada.", 65.0, "Bebidas Calientes"),
    ("Croissant de Jamón y Queso", "Croissant crujiente relleno de jamón de pavo y queso gouda.", 75.0, "Panadería"),
    ("Pastel de Chocolate", "Rebanada de pastel húmedo de chocolate fudge.", 80.0, "Postres"),
    ("Muffin de Arándanos", "Panecillo esponjoso relleno de arándanos silvestres.", 45.0, "Panadería"),
    ("Panini de Pollo", "Sándwich tostado de pechuga de pollo y queso gouda fundido.", 95.0, "Comidas"),
]

RECETAS_DATA = [
    # (producto, suministro, cantidad)
    ("Café Americano", "Café en Grano", 0.015),
    ("Café Americano", "Vasos Desechables", 1.0),
    ("Cappuccino", "Café en Grano", 0.015),
    ("Cappuccino", "Leche Entera", 0.200),
    ("Espresso Doble", "Café en Grano", 0.020),
    ("Latte Frío", "Café en Grano", 0.015),
    ("Latte Frío", "Leche Entera", 0.250),
    ("Matcha Latte", "Matcha en Polvo", 0.010),
    ("Matcha Latte", "Leche Entera", 0.200),
    ("Croissant de Jamón y Queso", "Croissant Crudo", 1.0),
    ("Croissant de Jamón y Queso", "Jamón de Pavo", 0.050),
    ("Croissant de Jamón y Queso", "Queso Gouda", 0.050),
    ("Pastel de Chocolate", "Pastel de Chocolate (Entero)", 0.125),
    ("Muffin de Arándanos", "Azúcar", 0.030),
    ("Panini de Pollo", "Pechuga de Pollo", 0.100),
    ("Panini de Pollo", "Queso Gouda", 0.050),
]


def seed_mesas(db: Session) -> list[Mesa]:
    mesas = []
    for numero in range(1, MESAS_TOTAL + 1):
        mesa = db.execute(select(Mesa).where(Mesa.numero == numero)).scalar_one_or_none()
        if mesa is None:
            mesa = Mesa(numero=numero, capacidad=2 if numero <= 3 else 4 if numero <= 6 else 6, activa=True)
            db.add(mesa)
            db.flush()
        mesas.append(mesa)
    db.commit()
    return mesas


def seed_suministros(db: Session) -> dict[str, Suministro]:
    sum_objs: dict[str, Suministro] = {}
    for nombre, unidad, stock_actual, stock_minimo in SUMINISTROS_DATA:
        sumi = db.execute(select(Suministro).where(Suministro.nombre == nombre)).scalar_one_or_none()
        if sumi is None:
            sumi = Suministro(
                nombre=nombre, unidad=unidad, stock_actual=stock_actual,
                stock_minimo=stock_minimo, activo=True,
            )
            db.add(sumi)
            db.flush()
        sum_objs[nombre] = sumi
    db.commit()
    return sum_objs


def seed_productos_y_recetas(db: Session, sum_objs: dict[str, Suministro]) -> dict[str, Producto]:
    prod_objs: dict[str, Producto] = {}
    for nombre, descripcion, precio, categoria in PRODUCTOS_DATA:
        prod = db.execute(select(Producto).where(Producto.nombre == nombre)).scalar_one_or_none()
        if prod is None:
            prod = Producto(
                nombre=nombre, descripcion=descripcion, precio=precio,
                categoria=categoria, disponible=True,
            )
            db.add(prod)
            db.flush()
        prod_objs[nombre] = prod
    db.commit()

    for nombre_prod, nombre_sum, cantidad in RECETAS_DATA:
        prod = prod_objs[nombre_prod]
        sumi = sum_objs[nombre_sum]
        existe = db.execute(
            select(Receta).where(Receta.producto_id == prod.id, Receta.suministro_id == sumi.id)
        ).scalar_one_or_none()
        if existe is None:
            db.add(Receta(producto_id=prod.id, suministro_id=sumi.id, cantidad=cantidad))
    db.commit()
    return prod_objs


def seed_compras(db: Session, sum_objs: dict[str, Suministro], admin: Usuario) -> None:
    if db.execute(select(func.count()).select_from(Compra)).scalar_one() > 0:
        return  # ya se sembraron compras antes; no duplicar

    ahora = datetime.now()
    insumos_compra = [
        ("Café en Grano", 8, 180.0),
        ("Leche Entera", 15, 22.0),
        ("Queso Gouda", 3, 160.0),
        ("Jamón de Pavo", 3, 120.0),
    ]
    for dias_atras in [55, 40, 25, 10, 3]:
        fecha_compra = ahora - timedelta(days=dias_atras)
        compra = Compra(cajero_id=admin.id, proveedor="Proveedor Central S.A.", total=0, comprado_en=fecha_compra)
        db.add(compra)
        db.flush()

        total = 0.0
        for nombre_sum, cantidad, costo_unitario in insumos_compra:
            sumi = sum_objs[nombre_sum]
            db.add(DetalleCompra(
                compra_id=compra.id, suministro_id=sumi.id,
                cantidad=cantidad, costo_unitario=costo_unitario,
            ))
            total += cantidad * costo_unitario
            db.add(MovimientoInventario(
                suministro_id=sumi.id, tipo=TipoMovimiento.entrada, cantidad=cantidad,
                motivo="Compra de insumos", referencia_id=compra.id, creado_en=fecha_compra,
            ))
        compra.total = total
    db.commit()


def _crear_cuenta_pagada(
    db: Session, mesas: list[Mesa], productos: list[Producto],
    mesero: Usuario, cajero: Usuario, momento: datetime, ticket_counter: int,
) -> None:
    tipo = random.choice([TipoCuenta.en_mesa, TipoCuenta.para_llevar])
    mesa = random.choice(mesas) if tipo == TipoCuenta.en_mesa else None

    cuenta = Cuenta(
        mesa_id=mesa.id if mesa else None, mesero_id=mesero.id, tipo=tipo,
        estado=EstadoCuenta.pagada, total=0,
        abierta_en=momento - timedelta(minutes=random.randint(15, 60)),
        cerrada_en=momento,
    )
    db.add(cuenta)
    db.flush()

    total = 0.0
    for prod in random.sample(productos, k=random.randint(1, 3)):
        cantidad = random.randint(1, 3)
        db.add(DetalleCuenta(
            cuenta_id=cuenta.id, producto_id=prod.id, cantidad=cantidad,
            precio_unitario=prod.precio, estado=EstadoCocina.entregado,
            creado_en=cuenta.abierta_en,
        ))
        total += cantidad * float(prod.precio)
    cuenta.total = total
    db.flush()

    metodo = random.choice([MetodoPago.efectivo, MetodoPago.tarjeta, MetodoPago.transferencia, MetodoPago.otro])
    db.add(Pago(cuenta_id=cuenta.id, cajero_id=cajero.id, metodo=metodo, monto=total, pagado_en=momento))
    folio = f"F-{momento.strftime('%Y%m%d%H%M%S')}-{ticket_counter:04d}"
    db.add(Ticket(cuenta_id=cuenta.id, folio=folio, total=total, emitido_en=momento))


def _crear_cuenta_en_curso_o_cancelada(
    db: Session, estado: str, mesas: list[Mesa], productos: list[Producto],
    mesero: Usuario, momento: datetime,
) -> None:
    tipo = random.choice([TipoCuenta.en_mesa, TipoCuenta.para_llevar])
    mesa = random.choice(mesas) if tipo == TipoCuenta.en_mesa else None
    cuenta = Cuenta(
        mesa_id=mesa.id if mesa else None, mesero_id=mesero.id, tipo=tipo,
        estado=estado, total=0, abierta_en=momento,
        cerrada_en=momento if estado == EstadoCuenta.cancelada else None,
    )
    db.add(cuenta)
    db.flush()

    if estado == EstadoCuenta.cancelada:
        estado_item = EstadoCocina.cancelado
    elif estado == EstadoCuenta.por_cobrar:
        estado_item = EstadoCocina.entregado  # ya se sirvió, falta cobrar
    else:  # abierta
        estado_item = EstadoCocina.en_preparacion

    total = 0.0
    for prod in random.sample(productos, k=random.randint(1, 2)):
        cantidad = random.randint(1, 2)
        db.add(DetalleCuenta(
            cuenta_id=cuenta.id, producto_id=prod.id, cantidad=cantidad,
            precio_unitario=prod.precio, estado=estado_item, creado_en=momento,
        ))
        total += cantidad * float(prod.precio)
    cuenta.total = total


def seed_operacion_demo(
    db: Session, mesas: list[Mesa], prod_objs: dict[str, Producto],
    user_objs: dict[str, Usuario],
) -> None:
    if db.execute(select(func.count()).select_from(Cuenta)).scalar_one() > 0:
        return  # ya se sembraron cuentas antes; no duplicar

    mesero = user_objs[MESERO_EMAIL]
    cajero = user_objs[CAJA_EMAIL]
    productos = list(prod_objs.values())
    ahora = datetime.now()

    # Historial de pedidos pagados, repartido en los últimos 60 días
    # (fechas y hora aleatorias, para que los filtros de rango discriminen).
    ticket_counter = 1
    for dias_atras in range(60):
        fecha = ahora - timedelta(days=dias_atras)
        for _ in range(random.randint(1, 4)):
            hora = random.randint(7, 20)
            minuto = random.randint(0, 59)
            momento = datetime(fecha.year, fecha.month, fecha.day, hora, minuto)
            _crear_cuenta_pagada(db, mesas, productos, mesero, cajero, momento, ticket_counter)
            ticket_counter += 1
    db.commit()

    # Cuentas en los otros tres estados, también repartidas en el tiempo,
    # para que el dominio se vea completo (Dashboard y consultas por estado).
    for dias_atras in [1, 3, 7, 15, 30]:
        momento = ahora - timedelta(days=dias_atras, hours=random.randint(0, 5))
        _crear_cuenta_en_curso_o_cancelada(db, EstadoCuenta.por_cobrar, mesas, productos, mesero, momento)
    for dias_atras in [2, 5, 12, 20, 45]:
        momento = ahora - timedelta(days=dias_atras, hours=random.randint(0, 5))
        _crear_cuenta_en_curso_o_cancelada(db, EstadoCuenta.cancelada, mesas, productos, mesero, momento)
    # "Abierta" son las de HOY: son las que de verdad están en curso ahora mismo.
    for _ in range(3):
        _crear_cuenta_en_curso_o_cancelada(db, EstadoCuenta.abierta, mesas, productos, mesero, ahora)
    db.commit()


def run(demo: bool = False) -> None:
    db = SessionLocal()
    try:
        rol_objs = seed_roles(db)
        user_objs = seed_usuarios(db, rol_objs)
        print(f"Roles y usuarios listos ({len(user_objs)} usuarios).")

        if demo:
            admin_correo = settings.ADMIN_EMAIL or ADMIN_EMAIL_DEFAULT
            mesas = seed_mesas(db)
            sum_objs = seed_suministros(db)
            prod_objs = seed_productos_y_recetas(db, sum_objs)
            seed_compras(db, sum_objs, user_objs[admin_correo])
            seed_operacion_demo(db, mesas, prod_objs, user_objs)
            print("Datos de demostración listos (suministros, productos, mesas, cuentas, pagos, compras).")

        print("Seed completado.")
    finally:
        db.close()


if __name__ == "__main__":
    run(demo="--demo" in sys.argv)
