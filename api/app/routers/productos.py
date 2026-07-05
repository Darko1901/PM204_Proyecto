from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core import roles
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.seguridad import Usuario
from app.models.catalogo import Producto, Receta, Suministro
from app.schemas.productos import ProductoCreate, ProductoUpdate, ProductoOut

router = APIRouter(prefix="/productos", tags=["productos"])

@router.get("", response_model=List[ProductoOut])
def listar_productos(
    categoria: str | None = None,
    disponible: bool | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> List[Producto]:
    q = select(Producto).options(joinedload(Producto.recetas).joinedload(Receta.suministro)).order_by(Producto.id)
    if categoria:
        q = q.where(Producto.categoria == categoria)
    if disponible is not None:
        q = q.where(Producto.disponible == disponible)
    
    productos = list(db.execute(q).scalars().unique().all())
    
    # Mapear nombre del suministro para el frontend
    for p in productos:
        for r in p.recetas:
            r.suministro_nombre = r.suministro.nombre
            
    return productos

@router.get("/{producto_id}", response_model=ProductoOut)
def obtener_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> Producto:
    producto = db.execute(
        select(Producto)
        .options(joinedload(Producto.recetas).joinedload(Receta.suministro))
        .where(Producto.id == producto_id)
    ).scalar_one_or_none()
    
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        
    for r in producto.recetas:
        r.suministro_nombre = r.suministro.nombre
        
    return producto

@router.post("", response_model=ProductoOut, status_code=status.HTTP_201_CREATED)
def crear_producto(
    body: ProductoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN))
) -> Producto:
    # Validar que todos los suministros en recetas existan
    for r in body.recetas:
        sumi = db.get(Suministro, r.suministro_id)
        if not sumi:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
                detail=f"Suministro con id {r.suministro_id} no existe"
            )
            
    nuevo = Producto(
        nombre=body.nombre,
        descripcion=body.descripcion,
        precio=body.precio,
        categoria=body.categoria,
        disponible=body.disponible
    )
    db.add(nuevo)
    db.flush() # Para obtener nuevo.id
    
    for r in body.recetas:
        receta = Receta(
            producto_id=nuevo.id,
            suministro_id=r.suministro_id,
            cantidad=r.cantidad
        )
        db.add(receta)
        
    db.commit()
    db.refresh(nuevo)
    
    # Cargar relaciones
    producto = db.execute(
        select(Producto)
        .options(joinedload(Producto.recetas).joinedload(Receta.suministro))
        .where(Producto.id == nuevo.id)
    ).scalar_one()
    
    for r in producto.recetas:
        r.suministro_nombre = r.suministro.nombre
        
    return producto

@router.patch("/{producto_id}", response_model=ProductoOut)
def actualizar_producto(
    producto_id: int,
    body: ProductoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN))
) -> Producto:
    producto = db.execute(
        select(Producto)
        .options(joinedload(Producto.recetas))
        .where(Producto.id == producto_id)
    ).scalar_one_or_none()
    
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        
    # Actualizar campos básicos
    if body.nombre is not None:
        producto.nombre = body.nombre
    if body.descripcion is not None:
        producto.descripcion = body.descripcion
    if body.precio is not None:
        producto.precio = body.precio
    if body.categoria is not None:
        producto.categoria = body.categoria
    if body.disponible is not None:
        producto.disponible = body.disponible
        
    # Actualizar recetas si se especifican
    if body.recetas is not None:
        # Borrar recetas anteriores
        for r in producto.recetas:
            db.delete(r)
        db.flush()
        
        # Validar y agregar nuevas recetas
        for r in body.recetas:
            sumi = db.get(Suministro, r.suministro_id)
            if not sumi:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
                    detail=f"Suministro con id {r.suministro_id} no existe"
                )
            receta = Receta(
                producto_id=producto.id,
                suministro_id=r.suministro_id,
                cantidad=r.cantidad
            )
            db.add(receta)
            
    db.commit()
    
    # Recargar con relaciones
    producto = db.execute(
        select(Producto)
        .options(joinedload(Producto.recetas).joinedload(Receta.suministro))
        .where(Producto.id == producto_id)
    ).scalar_one()
    
    for r in producto.recetas:
        r.suministro_nombre = r.suministro.nombre
        
    return producto

@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN))
):
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        
    tiene_ventas = db.execute(
        select(Producto.id).join(Producto.detalles_cuenta).where(Producto.id == producto_id)
    ).first() is not None
    
    if tiene_ventas:
        producto.disponible = False
        db.commit()
    else:
        recetas = db.query(Receta).filter_by(producto_id=producto_id).all()
        for r in recetas:
            db.delete(r)
        db.delete(producto)
        db.commit()
        
    return None


# --- RECETAS por producto ---
from app.schemas.productos import RecetaCreate, RecetaOut

@router.get("/{producto_id}/receta", response_model=list[RecetaOut])
def listar_receta(
    producto_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
) -> list[Receta]:
    recetas = db.query(Receta).filter_by(producto_id=producto_id).all()
    for r in recetas:
        s = db.get(Suministro, r.suministro_id)
        r.suministro_nombre = s.nombre if s else None
    return recetas


@router.post("/{producto_id}/receta", response_model=RecetaOut, status_code=201)
def agregar_receta(
    producto_id: int,
    body: RecetaCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN))
) -> Receta:
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    sumi = db.get(Suministro, body.suministro_id)
    if not sumi:
        raise HTTPException(status_code=422, detail="Suministro no encontrado")
    # Verificar si ya existe esta combinación
    existe = db.execute(
        select(Receta).where(Receta.producto_id == producto_id, Receta.suministro_id == body.suministro_id)
    ).scalar_one_or_none()
    if existe:
        raise HTTPException(status_code=409, detail="Este insumo ya está en la receta")
    
    receta = Receta(producto_id=producto_id, suministro_id=body.suministro_id, cantidad=body.cantidad)
    db.add(receta)
    db.commit()
    db.refresh(receta)
    receta.suministro_nombre = sumi.nombre
    return receta


@router.delete("/recetas/{receta_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_receta(
    receta_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(roles.ADMIN))
):
    receta = db.get(Receta, receta_id)
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    db.delete(receta)
    db.commit()
    return None

