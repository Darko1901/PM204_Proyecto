from pydantic import BaseModel, ConfigDict, field_validator


class ProductoBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    precio: float
    categoria: str | None = None
    disponible: bool = True

    @field_validator("precio")
    @classmethod
    def validar_precio(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        return v


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    precio: float | None = None
    categoria: str | None = None
    disponible: bool | None = None

    @field_validator("precio")
    @classmethod
    def validar_precio(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        return v


class ProductoOut(ProductoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class SuministroBase(BaseModel):
    nombre: str
    unidad: str
    stock_minimo: float = 0


class SuministroCreate(SuministroBase):
    stock_actual: float = 0


class SuministroUpdate(BaseModel):
    nombre: str | None = None
    unidad: str | None = None
    stock_minimo: float | None = None
    activo: bool | None = None


class SuministroAjusteStock(BaseModel):
    cantidad: float
    motivo: str | None = "ajuste"

    @field_validator("cantidad")
    @classmethod
    def validar_cantidad(cls, v: float) -> float:
        if v == 0:
            raise ValueError("La cantidad de ajuste no puede ser 0")
        return v


class SuministroOut(SuministroBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    stock_actual: float
    activo: bool


class RecetaLineaCreate(BaseModel):
    suministro_id: int
    cantidad: float

    @field_validator("cantidad")
    @classmethod
    def validar_cantidad(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")
        return v


class RecetaLineaUpdate(BaseModel):
    cantidad: float

    @field_validator("cantidad")
    @classmethod
    def validar_cantidad(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")
        return v


class RecetaLineaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    suministro_id: int
    cantidad: float
