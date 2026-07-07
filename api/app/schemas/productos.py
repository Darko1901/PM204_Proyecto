from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class RecetaBase(BaseModel):
    suministro_id: int
    cantidad: float

class RecetaCreate(RecetaBase):
    pass

class RecetaOut(RecetaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    producto_id: int
    suministro_nombre: Optional[str] = None # Para mostrar el nombre del insumo en el frontend

class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    categoria: Optional[str] = None
    disponible: bool = True

class ProductoCreate(ProductoBase):
    recetas: List[RecetaCreate] = [] # Opcional crear con receta inmediatamente

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    categoria: Optional[str] = None
    disponible: Optional[bool] = None
    recetas: Optional[List[RecetaCreate]] = None

class ProductoOut(ProductoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    recetas: List[RecetaOut] = []
