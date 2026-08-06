import sys
import os

# Asegurar que el directorio actual esté en el PATH para importar app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine
from app import seed


def run():
    print("Borrando tablas existentes...")
    Base.metadata.drop_all(bind=engine)
    print("Creando tablas limpias...")
    Base.metadata.create_all(bind=engine)

    # Delega en app/seed.py: es la única fuente de verdad de credenciales,
    # para que nunca queden usuarios distintos según qué script se corrió.
    # `--demo` en la línea de comandos también puebla catálogo y operación.
    demo = "--demo" in sys.argv
    seed.run(demo=demo)
    print("¡Base de datos limpiada y lista!")


if __name__ == "__main__":
    run()
