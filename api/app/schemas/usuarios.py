import re

from pydantic import BaseModel, field_validator

# Validación de email permisiva: acepta dominios locales (.local, .test, etc.)
# usados en entornos de desarrollo sin depender de la lista de TLDs de email-validator.
_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


def _check_email(v: str) -> str:
    if not _EMAIL_RE.match(v):
        raise ValueError("Formato de correo electrónico inválido")
    return v.lower()


def _check_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres")
    return v


class UsuarioCreate(BaseModel):
    nombre_completo: str
    correo: str
    password: str
    rol_id: int

    @field_validator("correo")
    @classmethod
    def validar_correo(cls, v: str) -> str:
        return _check_email(v)

    @field_validator("password")
    @classmethod
    def validar_password(cls, v: str) -> str:
        return _check_password(v)


class UsuarioUpdate(BaseModel):
    nombre_completo: str | None = None
    correo: str | None = None
    rol_id: int | None = None

    @field_validator("correo")
    @classmethod
    def validar_correo(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _check_email(v)


class UsuarioEstado(BaseModel):
    activo: bool


class PasswordReset(BaseModel):
    password: str

    @field_validator("password")
    @classmethod
    def validar_password(cls, v: str) -> str:
        return _check_password(v)
