import sys
import os
import random
from datetime import datetime, timedelta

# Asegurar que el directorio actual esté en el PATH para importar app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine, SessionLocal
from app.core import roles
from app.core.security import hash_password
from app.models.seguridad import Rol, Usuario
from app.models.catalogo import Producto, Suministro, Receta
from app.models.operacion import Mesa, Cuenta, DetalleCuenta
from app.models.finanzas import Compra, Pago, Ticket
from app.models.inventario import DetalleCompra, MovimientoInventario
from app.models.enums import TipoCuenta, EstadoCuenta, EstadoCocina, MetodoPago, TipoMovimiento

def init_db():
    print("Inicializando base de datos...")
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas exitosamente.")

    db = SessionLocal()
    try:
        # 1. Crear Roles
        print("Creando roles...")
        rol_objs = {}
        for r in roles.TODOS:
            existe = db.query(Rol).filter_by(nombre=r).first()
            if not existe:
                rol = Rol(nombre=r, descripcion=f"Rol de {r}")
                db.add(rol)
                db.flush()
                rol_objs[r] = rol
            else:
                rol_objs[r] = existe
        db.commit()

        # 2. Crear Usuarios
        print("Creando usuarios semilla...")
        usuarios_data = [
            {"nombre": "Administrador", "correo": "admin@cafeteria.com", "pass": "admin1234", "rol": roles.ADMIN},
            {"nombre": "Mesero Juan", "correo": "mesero@cafeteria.com", "pass": "mesero1234", "rol": roles.MESERO},
            {"nombre": "Cajero Alberto", "correo": "cajero@cafeteria.com", "pass": "caja1234", "rol": roles.CAJA},
            {"nombre": "Chef Maria", "correo": "cocina@cafeteria.com", "pass": "cocina1234", "rol": roles.COCINA},
        ]
        user_objs = {}
        for u in usuarios_data:
            existe = db.query(Usuario).filter_by(correo=u["correo"]).first()
            if not existe:
                rol = rol_objs[u["rol"]]
                usuario = Usuario(
                    nombre_completo=u["nombre"],
                    correo=u["correo"],
                    password_hash=hash_password(u["pass"]),
                    rol_id=rol.id,
                    activo=True
                )
                db.add(usuario)
                db.flush()
                user_objs[u["correo"]] = usuario
            else:
                user_objs[u["correo"]] = existe
        db.commit()

        # 3. Crear Mesas
        print("Creando mesas...")
        mesa_objs = []
        for i in range(1, 11):
            existe = db.query(Mesa).filter_by(numero=i).first()
            if not existe:
                mesa = Mesa(numero=i, capacidad=2 if i <= 4 else 4 if i <= 8 else 6, activa=True)
                db.add(mesa)
                db.flush()
                mesa_objs.append(mesa)
            else:
                mesa_objs.append(existe)
        db.commit()

        # 4. Crear Suministros (Insumos)
        print("Creando suministros...")
        suministros_data = [
            {"nombre": "Café en Grano", "unidad": "kg", "stock_actual": 12.5, "stock_minimo": 3.0},
            {"nombre": "Leche Entera", "unidad": "L", "stock_actual": 25.0, "stock_minimo": 5.0},
            {"nombre": "Matcha en Polvo", "unidad": "kg", "stock_actual": 1.8, "stock_minimo": 0.5},
            {"nombre": "Croissant Crudo", "unidad": "pz", "stock_actual": 30.0, "stock_minimo": 10.0},
            {"nombre": "Pastel de Chocolate (Entero)", "unidad": "pz", "stock_actual": 5.0, "stock_minimo": 1.0},
            {"nombre": "Pechuga de Pollo", "unidad": "kg", "stock_actual": 8.0, "stock_minimo": 2.0},
            {"nombre": "Queso Gouda", "unidad": "kg", "stock_actual": 4.5, "stock_minimo": 1.0},
            {"nombre": "Jamón de Pavo", "unidad": "kg", "stock_actual": 4.0, "stock_minimo": 1.0},
            {"nombre": "Azúcar", "unidad": "kg", "stock_actual": 10.0, "stock_minimo": 2.0},
            {"nombre": "Vasos Desechables", "unidad": "pz", "stock_actual": 150.0, "stock_minimo": 50.0},
        ]
        sum_objs = {}
        for s in suministros_data:
            existe = db.query(Suministro).filter_by(nombre=s["nombre"]).first()
            if not existe:
                sumi = Suministro(
                    nombre=s["nombre"],
                    unidad=s["unidad"],
                    stock_actual=s["stock_actual"],
                    stock_minimo=s["stock_minimo"],
                    activo=True
                )
                db.add(sumi)
                db.flush()
                sum_objs[s["nombre"]] = sumi
            else:
                sum_objs[s["nombre"]] = existe
        db.commit()

        # 5. Crear Productos
        print("Creando productos...")
        productos_data = [
            {"nombre": "Café Americano", "descripcion": "Espresso clásico rebajado con agua caliente.", "precio": 45.0, "categoria": "Bebidas Calientes"},
            {"nombre": "Cappuccino", "descripcion": "Espresso, leche vaporizada y abundante espuma.", "precio": 55.0, "categoria": "Bebidas Calientes"},
            {"nombre": "Espresso Doble", "descripcion": "Shot cargado de espresso intenso.", "precio": 35.0, "categoria": "Bebidas Calientes"},
            {"nombre": "Latte Frío", "descripcion": "Espresso sobre leche fría y cubos de hielo.", "precio": 60.0, "categoria": "Bebidas Frías"},
            {"nombre": "Matcha Latte", "descripcion": "Té matcha premium con leche vaporizada.", "precio": 65.0, "categoria": "Bebidas Calientes"},
            {"nombre": "Croissant de Jamón y Queso", "descripcion": "Croissant crujiente relleno de jamón de pavo y queso gouda.", "precio": 75.0, "categoria": "Panadería"},
            {"nombre": "Pastel de Chocolate", "descripcion": "Rebanada de pastel húmedo de chocolate fudge.", "precio": 80.0, "categoria": "Postres"},
            {"nombre": "Muffin de Arándanos", "descripcion": "Panecillo esponjoso relleno de arándanos silvestres.", "precio": 45.0, "categoria": "Panadería"},
            {"nombre": "Panini de Pollo", "descripcion": "Sándwich tostado de pechuga de pollo y queso gouda fundido.", "precio": 95.0, "categoria": "Comidas"},
        ]
        prod_objs = {}
        for p in productos_data:
            existe = db.query(Producto).filter_by(nombre=p["nombre"]).first()
            if not existe:
                prod = Producto(
                    nombre=p["nombre"],
                    descripcion=p["descripcion"],
                    precio=p["precio"],
                    categoria=p["categoria"],
                    disponible=True
                )
                db.add(prod)
                db.flush()
                prod_objs[p["nombre"]] = prod
            else:
                prod_objs[p["nombre"]] = existe
        db.commit()

        # 6. Crear Recetas
        print("Creando recetas...")
        recetas_data = [
            ("Café Americano", "Café en Grano", 0.015),
            ("Café Americano", "Vasos Desechables", 1.0),
            ("Cappuccino", "Café en Grano", 0.015),
            ("Cappuccino", "Leche Entera", 0.200),
            ("Cappuccino", "Vasos Desechables", 1.0),
            ("Espresso Doble", "Café en Grano", 0.020),
            ("Latte Frío", "Café en Grano", 0.015),
            ("Latte Frío", "Leche Entera", 0.250),
            ("Latte Frío", "Vasos Desechables", 1.0),
            ("Matcha Latte", "Matcha en Polvo", 0.010),
            ("Matcha Latte", "Leche Entera", 0.200),
            ("Matcha Latte", "Vasos Desechables", 1.0),
            ("Croissant de Jamón y Queso", "Croissant Crudo", 1.0),
            ("Croissant de Jamón y Queso", "Jamón de Pavo", 0.050),
            ("Croissant de Jamón y Queso", "Queso Gouda", 0.050),
            ("Pastel de Chocolate", "Pastel de Chocolate (Entero)", 0.125), # 1/8 de pastel
            ("Panini de Pollo", "Pechuga de Pollo", 0.100),
            ("Panini de Pollo", "Queso Gouda", 0.050),
        ]
        for p_name, s_name, cant in recetas_data:
            prod = prod_objs[p_name]
            sumi = sum_objs[s_name]
            existe = db.query(Receta).filter_by(producto_id=prod.id, suministro_id=sumi.id).first()
            if not existe:
                receta = Receta(producto_id=prod.id, suministro_id=sumi.id, cantidad=cant)
                db.add(receta)
        db.commit()

        # 7. Crear Historial de Compras (Gastos) - últimos 30 días
        print("Creando historial de compras (gastos)...")
        now = datetime.now()
        admin_user = user_objs["admin@cafeteria.com"]
        
        # Si no hay compras guardadas, creamos algunas
        if db.query(Compra).count() == 0:
            for days_ago in [28, 21, 14, 7, 2]:
                compra_date = now - timedelta(days=days_ago)
                total_compra = 0
                detalles = []
                
                # Insumos a comprar
                insumos_compra = [
                    ("Café en Grano", random.randint(5, 10), 180.0), # cant, costo unitario
                    ("Leche Entera", random.randint(10, 20), 22.0),
                    ("Queso Gouda", random.randint(2, 4), 160.0),
                    ("Jamón de Pavo", random.randint(2, 4), 120.0),
                ]
                
                compra = Compra(
                    cajero_id=admin_user.id,
                    proveedor="Proveedor Central S.A.",
                    total=0,
                    comprado_en=compra_date
                )
                db.add(compra)
                db.flush()
                
                for s_name, qty, cost in insumos_compra:
                    sumi = sum_objs[s_name]
                    det = DetalleCompra(
                        compra_id=compra.id,
                        suministro_id=sumi.id,
                        cantidad=qty,
                        costo_unitario=cost
                    )
                    db.add(det)
                    total_compra += qty * cost
                    
                    # Registrar movimiento de entrada
                    mov = MovimientoInventario(
                        suministro_id=sumi.id,
                        tipo=TipoMovimiento.entrada,
                        cantidad=qty,
                        motivo="Compra de insumos",
                        referencia_id=compra.id,
                        creado_en=compra_date
                    )
                    db.add(mov)
                
                compra.total = total_compra
            db.commit()

        # 8. Crear Historial de Ventas (Pedidos/Ganancias) - últimos 30 días
        print("Creando historial de ventas (ganancias)...")
        mesero_user = user_objs["mesero@cafeteria.com"]
        cajero_user = user_objs["cajero@cafeteria.com"]
        
        if db.query(Cuenta).count() == 0:
            ticket_counter = 1
            # Generar pedidos a lo largo de los últimos 30 días
            # Haremos unos 2 a 5 pedidos por día para tener datos de gráficos interesantes
            for day in range(30):
                order_date = now - timedelta(days=day)
                # No todos los días tienen la misma cantidad de ventas
                num_orders = random.randint(3, 8)
                for o_idx in range(num_orders):
                    # Hora aleatoria del día
                    hour = random.randint(8, 20)
                    minute = random.randint(0, 59)
                    o_time = datetime(order_date.year, order_date.month, order_date.day, hour, minute)
                    
                    # Tipo y mesa
                    tipo = random.choice([TipoCuenta.en_mesa, TipoCuenta.para_llevar])
                    mesa = random.choice(mesa_objs) if tipo == TipoCuenta.en_mesa else None
                    
                    # Crear cuenta
                    cuenta = Cuenta(
                        mesa_id=mesa.id if mesa else None,
                        mesero_id=mesero_user.id,
                        tipo=tipo,
                        estado=EstadoCuenta.pagada,
                        total=0,
                        abierta_en=o_time - timedelta(minutes=random.randint(15, 60)),
                        cerrada_en=o_time
                    )
                    db.add(cuenta)
                    db.flush()
                    
                    # Agregar detalles
                    total_cuenta = 0
                    num_items = random.randint(1, 4)
                    selected_products = random.sample(list(prod_objs.values()), num_items)
                    
                    for prod in selected_products:
                        qty = random.randint(1, 3)
                        det = DetalleCuenta(
                            cuenta_id=cuenta.id,
                            producto_id=prod.id,
                            cantidad=qty,
                            precio_unitario=prod.price if hasattr(prod, 'price') else prod.precio,
                            estado=EstadoCocina.entregado,
                            creado_en=cuenta.abierta_en
                        )
                        db.add(det)
                        total_cuenta += qty * det.precio_unitario
                    
                    cuenta.total = total_cuenta
                    db.flush()
                    
                    # Crear Pago
                    metodo_pago = random.choice([MetodoPago.efectivo, MetodoPago.tarjeta, MetodoPago.transferencia])
                    pago = Pago(
                        cuenta_id=cuenta.id,
                        cajero_id=cajero_user.id,
                        metodo=metodo_pago,
                        monto=total_cuenta,
                        pagado_en=o_time
                    )
                    db.add(pago)
                    
                    # Crear Ticket
                    folio = f"F-{o_time.strftime('%Y%m%d')}-{ticket_counter:04d}"
                    ticket_counter += 1
                    ticket = Ticket(
                        cuenta_id=cuenta.id,
                        folio=folio,
                        total=total_cuenta,
                        emitido_en=o_time
                    )
                    db.add(ticket)
                    
                    # Descontar insumos de la receta e inventario para cada producto vendido
                    for prod in selected_products:
                        # Buscar receta
                        recetas = db.query(Receta).filter_by(producto_id=prod.id).all()
                        for r in recetas:
                            sumi = r.suministro
                            cant_descontar = r.cantidad * qty
                            
                            # Crear movimiento de salida
                            mov_salida = MovimientoInventario(
                                suministro_id=sumi.id,
                                tipo=TipoMovimiento.salida,
                                cantidad=cant_descontar,
                                motivo=f"Venta en Cuenta #{cuenta.id}",
                                referencia_id=cuenta.id,
                                creado_en=o_time
                            )
                            db.add(mov_salida)
            db.commit()

        # 9. Crear un par de Cuentas Activas/Abiertas para el POS de demostración
        print("Creando cuentas activas de demostración...")
        # Mesa 1 abierta con algunos productos
        mesa1 = mesa_objs[0]
        cuenta_abierta1 = db.query(Cuenta).filter_by(mesa_id=mesa1.id, estado=EstadoCuenta.abierta).first()
        if not cuenta_abierta1:
            cuenta_abierta1 = Cuenta(
                mesa_id=mesa1.id,
                mesero_id=mesero_user.id,
                tipo=TipoCuenta.en_mesa,
                estado=EstadoCuenta.abierta,
                total=120.0, # Cafe Americano + Croissant de jamon y queso
                abierta_en=now - timedelta(minutes=35)
            )
            db.add(cuenta_abierta1)
            db.flush()
            
            p1 = prod_objs["Café Americano"]
            p2 = prod_objs["Croissant de Jamón y Queso"]
            
            det1 = DetalleCuenta(
                cuenta_id=cuenta_abierta1.id,
                producto_id=p1.id,
                cantidad=1,
                precio_unitario=p1.precio,
                estado=EstadoCocina.entregado,
                creado_en=now - timedelta(minutes=30)
            )
            det2 = DetalleCuenta(
                cuenta_id=cuenta_abierta1.id,
                producto_id=p2.id,
                cantidad=1,
                precio_unitario=p2.precio,
                estado=EstadoCocina.pendiente,
                creado_en=now - timedelta(minutes=25)
            )
            db.add_all([det1, det2])
            db.commit()

        print("Base de datos y semilla cargados exitosamente!")

    except Exception as e:
        db.rollback()
        print(f"Error al inicializar la base de datos: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
