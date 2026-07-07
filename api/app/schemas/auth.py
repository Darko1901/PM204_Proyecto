from pydantic import BaseModel, ConfigDict


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RolOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_completo: str
    correo: str
    activo: bool
    rol_id: int
    rol: RolOut
