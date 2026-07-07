import sys
import os

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

def run():
    print("Borrando tablas existentes...")
    Base.metadata.drop_all(bind=engine)
    print("Creando tablas limpias...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Crear Roles
        print("Creando roles...")
        rol_objs = {}
        for r in roles.TODOS:
            rol = Rol(nombre=r, descripcion=f"Rol de {r}")
            db.add(rol)
            db.flush()
            rol_objs[r] = rol
        
        # 2. Crear Admin
        print("Creando usuario administrador...")
        admin = Usuario(
            nombre_completo="Administrador",
            correo="admin@cafeteria.com",
            password_hash=hash_password("admin1234"),
            rol_id=rol_objs[roles.ADMIN].id,
            activo=True
        )
        db.add(admin)
        db.commit()
        print("¡Base de datos limpiada y lista!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run()
