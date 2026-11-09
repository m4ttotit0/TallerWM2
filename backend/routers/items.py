
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from models import models
from schemas import schemas

from routers.auth import get_current_user

router = APIRouter()


# CREAR
@router.post("/items/")
def create_item(
    item: schemas.PrincipalEntityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    new_item = models.PrincipalEntity(
        image_url=item.image_url,
        description=item.description,
        user_id=current_user.id
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


# LISTAR LOS ITEMS DEL USUARIO
@router.get("/items/")
def get_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    return db.query(models.PrincipalEntity).filter(
        models.PrincipalEntity.user_id == current_user.id
    ).all()


# CONSULTAR UN ITEM
@router.get("/items/{item_id}")
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    item = db.query(models.PrincipalEntity).filter(
        models.PrincipalEntity.id == item_id,
        models.PrincipalEntity.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Elemento no encontrado"
        )

    return item


# MODIFICAR
@router.put("/items/{item_id}")
def update_item(
    item_id: int,
    item_data: schemas.PrincipalEntityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    item = db.query(models.PrincipalEntity).filter(
        models.PrincipalEntity.id == item_id,
        models.PrincipalEntity.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Elemento no encontrado"
        )

    item.image_url = item_data.image_url
    item.description = item_data.description

    db.commit()
    db.refresh(item)

    return item


# ELIMINAR
@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    item = db.query(models.PrincipalEntity).filter(
        models.PrincipalEntity.id == item_id,
        models.PrincipalEntity.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Elemento no encontrado"
        )

    db.delete(item)
    db.commit()

    return {"message": "Elemento eliminado correctamente"}
