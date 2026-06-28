from sqlalchemy import select

from app.core import roles
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.seguridad import Rol, Usuario


def run() -> None:
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        raise SystemExit(
            "Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno (.env)."
        )

    db = SessionLocal()
    try:
        for nombre in roles.TODOS:
            existe = db.execute(
                select(Rol).where(Rol.nombre == nombre)
            ).scalar_one_or_none()
            if not existe:
                db.add(Rol(nombre=nombre))
        db.commit()

        admin_rol = db.execute(
            select(Rol).where(Rol.nombre == roles.ADMIN)
        ).scalar_one()

        admin = db.execute(
            select(Usuario).where(Usuario.correo == settings.ADMIN_EMAIL)
        ).scalar_one_or_none()

        if admin is None:
            db.add(
                Usuario(
                    rol_id=admin_rol.id,
                    nombre_completo="Administrador",
                    correo=settings.ADMIN_EMAIL,
                    activo=True,
                    password_hash=hash_password(settings.ADMIN_PASSWORD),
                )
            )
            db.commit()
            print("Admin creado.")
        else:
            print("Admin ya existe; nada que hacer.")

        print("Seed completado.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
