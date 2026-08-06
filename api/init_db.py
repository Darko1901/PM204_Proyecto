import sys
import os

# Asegurar que el directorio actual esté en el PATH para importar app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine
from app import seed


def init_db():
    print("Inicializando base de datos (modo legacy: create_all, sin Alembic)...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas exitosamente.")

    # Antes este script creaba su propio juego de 4 usuarios @cafeteria.com
    # con contraseñas distintas a las de app/seed.py. Ahora delega ahí: es
    # la única fuente de verdad de credenciales y de datos de demostración,
    # así da igual qué script se corra, las credenciales son siempre las
    # mismas. Ver docs/CREDENCIALES.md.
    seed.run(demo=True)
    print("Base de datos y semilla cargados exitosamente!")


if __name__ == "__main__":
    init_db()
